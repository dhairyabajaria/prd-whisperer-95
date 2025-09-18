/**
 * Phase 3: Database Read Replica Strategy
 * 
 * Implements intelligent query routing to separate read/write operations
 * and distribute load across multiple database connections for enterprise scale
 * 
 * Target: Support 1000+ concurrent users with <200ms response times
 */

import { Pool, PoolConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';
import { getDatabaseUrlAsync } from './secretLoader';
import { optimizedPoolConfig } from '../critical-cache-implementation';

// ===============================
// REPLICA CONFIGURATION
// ===============================

interface ReplicaConfig extends PoolConfig {
  name: string;
  priority: number;        // Higher = preferred for reads
  maxReadLoad: number;     // Maximum concurrent read operations
  healthCheckInterval: number; // Health check frequency (ms)
  enabled: boolean;
}

const REPLICA_CONFIGS: ReplicaConfig[] = [
  // Primary database - handles all writes and critical reads
  {
    name: 'primary',
    priority: 100,
    maxReadLoad: 50,
    healthCheckInterval: 30000,
    enabled: true,
    ...optimizedPoolConfig
  },
  
  // Read replica 1 - handles analytical queries and reports
  {
    name: 'replica-analytics',
    priority: 90,
    maxReadLoad: 100,
    healthCheckInterval: 30000,
    enabled: process.env.REPLICA_ANALYTICS_URL ? true : false,
    connectionString: process.env.REPLICA_ANALYTICS_URL,
    ...optimizedPoolConfig,
    // Optimize for read-heavy analytical workloads
    max: 30,
    min: 10
  },
  
  // Read replica 2 - handles user sessions and lightweight queries  
  {
    name: 'replica-sessions',
    priority: 80,
    maxReadLoad: 150,
    healthCheckInterval: 30000,
    enabled: process.env.REPLICA_SESSIONS_URL ? true : false,
    connectionString: process.env.REPLICA_SESSIONS_URL,
    ...optimizedPoolConfig,
    // Optimize for high-frequency lightweight reads
    max: 25,
    min: 8
  }
];

// ===============================
// QUERY CLASSIFICATION
// ===============================

enum QueryType {
  WRITE = 'WRITE',           // INSERT, UPDATE, DELETE operations
  READ_CRITICAL = 'READ_CRITICAL',    // Real-time reads requiring latest data
  READ_ANALYTICAL = 'READ_ANALYTICAL', // Reports, dashboards, analytics
  READ_SESSION = 'READ_SESSION',       // User data, preferences, lightweight reads
  READ_BULK = 'READ_BULK'             // Large dataset queries, exports
}

interface QueryPattern {
  pattern: RegExp | string;
  type: QueryType;
  description: string;
}

const QUERY_PATTERNS: QueryPattern[] = [
  // Write operations (always go to primary)
  { pattern: /^(INSERT|UPDATE|DELETE|UPSERT)/i, type: QueryType.WRITE, description: 'Write operations' },
  { pattern: /WITH.*INSERT|UPDATE|DELETE/i, type: QueryType.WRITE, description: 'CTE with writes' },
  
  // Critical reads (require primary for data consistency)
  { pattern: /SELECT.*FOR UPDATE/i, type: QueryType.READ_CRITICAL, description: 'Row locking reads' },
  { pattern: /SELECT.*inventory.*quantity/i, type: QueryType.READ_CRITICAL, description: 'Inventory levels' },
  { pattern: /SELECT.*sales_orders.*status.*pending/i, type: QueryType.READ_CRITICAL, description: 'Active orders' },
  
  // Analytical reads (can use analytics replica)
  { pattern: /SELECT.*COUNT|SUM|AVG|MAX|MIN/i, type: QueryType.READ_ANALYTICAL, description: 'Aggregation queries' },
  { pattern: /SELECT.*dashboard|metrics|analytics/i, type: QueryType.READ_ANALYTICAL, description: 'Dashboard queries' },
  { pattern: /SELECT.*reports?|exports?/i, type: QueryType.READ_ANALYTICAL, description: 'Reporting queries' },
  { pattern: /SELECT.*DATE_TRUNC|EXTRACT|DATE_PART/i, type: QueryType.READ_ANALYTICAL, description: 'Time-based analytics' },
  
  // Session reads (can use session replica)
  { pattern: /SELECT.*users.*WHERE.*id/i, type: QueryType.READ_SESSION, description: 'User lookups' },
  { pattern: /SELECT.*sessions|preferences|settings/i, type: QueryType.READ_SESSION, description: 'Session data' },
  { pattern: /SELECT.*permissions|roles/i, type: QueryType.READ_SESSION, description: 'Authorization data' },
  
  // Bulk reads (prefer dedicated replicas)
  { pattern: /SELECT.*LIMIT.*[1-9]\d{2,}/i, type: QueryType.READ_BULK, description: 'Large result sets' },
  { pattern: /SELECT.*products.*categories/i, type: QueryType.READ_BULK, description: 'Product catalogs' },
  { pattern: /SELECT.*customers.*suppliers/i, type: QueryType.READ_BULK, description: 'Master data' }
];

// ===============================
// CONNECTION POOL MANAGER
// ===============================

interface PoolStatus {
  pool: Pool;
  db: ReturnType<typeof drizzle>;
  config: ReplicaConfig;
  isHealthy: boolean;
  currentReadLoad: number;
  totalQueries: number;
  avgResponseTime: number;
  lastHealthCheck: number;
  errors: number;
}

class DatabaseReplicaManager {
  private pools = new Map<string, PoolStatus>();
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private queryStats = new Map<string, {
    count: number;
    totalTime: number;
    errors: number;
    lastQuery: number;
  }>();

  constructor() {
    // Initialize pools with error handling to prevent unhandled rejections
    void this.initializePools().catch(err => {
      console.error('❌ [Replica Manager] Initialization failed:', err);
      console.log('🔄 [Replica Manager] Application will continue with fallback database access');
    });
    this.startHealthMonitoring();
  }

  private async initializePools(): Promise<void> {
    console.log('🗄️  [Replica Manager] Initializing database connection pools...');
    
    const primaryUrl = await getDatabaseUrlAsync();
    if (!primaryUrl) {
      console.log('⚠️  [Replica Manager] Primary database URL not available - replica manager disabled');
      console.log('🔄 [Replica Manager] Application will continue with memory storage');
      return; // Gracefully return instead of throwing
    }

    // Initialize each replica pool
    for (const config of REPLICA_CONFIGS) {
      if (!config.enabled) {
        console.log(`⏭️  [Replica Manager] Skipping disabled replica: ${config.name}`);
        continue;
      }

      try {
        const connectionString = config.connectionString || primaryUrl;
        const poolConfig = { ...config, connectionString };
        
        const pool = new Pool(poolConfig);
        const db = drizzle({ client: pool, schema });
        
        // Test connection
        await pool.query('SELECT 1');
        
        const status: PoolStatus = {
          pool,
          db,
          config,
          isHealthy: true,
          currentReadLoad: 0,
          totalQueries: 0,
          avgResponseTime: 0,
          lastHealthCheck: Date.now(),
          errors: 0
        };
        
        this.pools.set(config.name, status);
        console.log(`✅ [Replica Manager] Initialized ${config.name} pool (max: ${config.max}, priority: ${config.priority})`);
        
      } catch (error) {
        console.error(`❌ [Replica Manager] Failed to initialize ${config.name}:`, error);
      }
    }

    if (this.pools.size === 0) {
      console.log('⚠️  [Replica Manager] No database pools initialized - using fallback database access');
      return; // Don't throw - just continue with fallback behavior
    }

    console.log(`🎉 [Replica Manager] Initialized ${this.pools.size} database pools`);
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, 15000); // Check every 15 seconds

    // Cleanup on exit
    process.on('exit', () => {
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
      }
    });
  }

  private async performHealthChecks(): Promise<void> {
    const now = Date.now();
    
    for (const [name, status] of Array.from(this.pools.entries())) {
      if (now - status.lastHealthCheck < status.config.healthCheckInterval) {
        continue; // Skip if checked recently
      }

      try {
        const startTime = Date.now();
        await status.pool.query('SELECT 1 as health_check');
        const responseTime = Date.now() - startTime;
        
        // Update health status
        status.isHealthy = true;
        status.avgResponseTime = (status.avgResponseTime * 0.9) + (responseTime * 0.1);
        status.lastHealthCheck = now;
        
        if (responseTime > 1000) {
          console.warn(`⚠️  [Health Check] ${name} responded slowly: ${responseTime}ms`);
        }
        
      } catch (error) {
        status.isHealthy = false;
        status.errors++;
        console.error(`❌ [Health Check] ${name} failed:`, error);
      }
    }
  }

  // ===============================
  // QUERY ROUTING
  // ===============================

  /**
   * Route query to appropriate database based on query pattern and load
   */
  routeQuery(query: string, forceWrite: boolean = false): PoolStatus | null {
    // Classify the query
    const queryType = this.classifyQuery(query);
    
    // Force primary for writes or critical reads
    if (forceWrite || queryType === QueryType.WRITE || queryType === QueryType.READ_CRITICAL) {
      const primary = this.pools.get('primary');
      if (primary?.isHealthy) {
        return primary;
      }
      throw new Error('Primary database not available for write/critical operations');
    }

    // Find best replica for read operations
    return this.selectBestReadReplica(queryType);
  }

  private classifyQuery(query: string): QueryType {
    const normalizedQuery = query.trim();
    
    // Check against patterns
    for (const pattern of QUERY_PATTERNS) {
      const regex = pattern.pattern instanceof RegExp 
        ? pattern.pattern 
        : new RegExp(pattern.pattern, 'i');
        
      if (regex.test(normalizedQuery)) {
        return pattern.type;
      }
    }
    
    // Default classification
    if (normalizedQuery.toLowerCase().startsWith('select')) {
      return QueryType.READ_SESSION; // Default read type
    }
    
    return QueryType.WRITE; // Conservative default
  }

  private selectBestReadReplica(queryType: QueryType): PoolStatus | null {
    // Get healthy replicas sorted by preference for this query type
    const candidates = Array.from(this.pools.values())
      .filter(status => status.isHealthy && status.currentReadLoad < status.config.maxReadLoad)
      .sort((a, b) => this.calculateReplicaScore(b, queryType) - this.calculateReplicaScore(a, queryType));

    if (candidates.length === 0) {
      // Fallback to primary if no replicas available
      const primary = this.pools.get('primary');
      if (primary?.isHealthy) {
        console.warn('⚠️  [Query Routing] No replicas available, falling back to primary');
        return primary;
      }
      return null;
    }

    return candidates[0];
  }

  private calculateReplicaScore(status: PoolStatus, queryType: QueryType): number {
    let score = status.config.priority;
    
    // Adjust score based on query type preferences
    if (queryType === QueryType.READ_ANALYTICAL && status.config.name.includes('analytics')) {
      score += 20;
    } else if (queryType === QueryType.READ_SESSION && status.config.name.includes('session')) {
      score += 15;
    }
    
    // Penalize based on current load
    const loadPenalty = (status.currentReadLoad / status.config.maxReadLoad) * 30;
    score -= loadPenalty;
    
    // Penalize based on response time
    if (status.avgResponseTime > 200) {
      score -= 10;
    }
    
    return score;
  }

  // ===============================
  // QUERY EXECUTION
  // ===============================

  /**
   * Execute query with automatic routing and performance tracking
   */
  async executeQuery<T = any>(
    query: string,
    params: any[] = [],
    options: {
      forceWrite?: boolean;
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const queryType = this.classifyQuery(query);
    const { forceWrite = false, timeout = 30000, retries = 2 } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      const replica = this.routeQuery(query, forceWrite);
      
      if (!replica) {
        throw new Error('No healthy database connections available');
      }

      try {
        // Track load
        replica.currentReadLoad++;
        
        // Execute with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        );
        
        const queryPromise = replica.pool.query(query, params);
        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        // Update statistics
        const duration = Date.now() - startTime;
        this.updateQueryStats(replica.config.name, queryType, duration, false);
        
        replica.totalQueries++;
        replica.avgResponseTime = (replica.avgResponseTime * 0.95) + (duration * 0.05);
        replica.currentReadLoad--;
        
        console.log(`⚡ [Query] ${replica.config.name} executed ${queryType} in ${duration}ms`);
        return result as T;
        
      } catch (error) {
        replica.currentReadLoad--;
        replica.errors++;
        lastError = error as Error;
        
        this.updateQueryStats(replica.config.name, queryType, Date.now() - startTime, true);
        
        console.error(`❌ [Query Error] ${replica.config.name} attempt ${attempt + 1}:`, error);
        
        if (attempt === retries) {
          break;
        }
        
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, Math.min(100 * Math.pow(2, attempt), 1000)));
      }
    }
    
    throw lastError || new Error('Query failed after all retry attempts');
  }

  private updateQueryStats(replicaName: string, queryType: QueryType, duration: number, isError: boolean): void {
    const key = `${replicaName}:${queryType}`;
    const stats = this.queryStats.get(key) || {
      count: 0, totalTime: 0, errors: 0, lastQuery: 0
    };
    
    stats.count++;
    stats.totalTime += duration;
    stats.lastQuery = Date.now();
    
    if (isError) {
      stats.errors++;
    }
    
    this.queryStats.set(key, stats);
  }

  // ===============================
  // MONITORING & MANAGEMENT
  // ===============================

  /**
   * Get comprehensive status of all database pools
   */
  getStatus(): {
    pools: Array<{
      name: string;
      healthy: boolean;
      priority: number;
      currentLoad: number;
      maxLoad: number;
      totalQueries: number;
      avgResponseTime: number;
      errors: number;
      loadPercentage: number;
    }>;
    queryStats: Array<{
      replica: string;
      queryType: string;
      count: number;
      avgTime: number;
      errorRate: number;
    }>;
    summary: {
      totalPools: number;
      healthyPools: number;
      totalQueries: number;
      avgResponseTime: number;
    };
  } {
    const poolsStatus = Array.from(this.pools.entries()).map(([name, status]) => ({
      name,
      healthy: status.isHealthy,
      priority: status.config.priority,
      currentLoad: status.currentReadLoad,
      maxLoad: status.config.maxReadLoad,
      totalQueries: status.totalQueries,
      avgResponseTime: Math.round(status.avgResponseTime * 100) / 100,
      errors: status.errors,
      loadPercentage: Math.round((status.currentReadLoad / status.config.maxReadLoad) * 100)
    }));

    const queryStatsArray = Array.from(this.queryStats.entries()).map(([key, stats]) => {
      const [replica, queryType] = key.split(':');
      return {
        replica,
        queryType,
        count: stats.count,
        avgTime: stats.count > 0 ? Math.round((stats.totalTime / stats.count) * 100) / 100 : 0,
        errorRate: stats.count > 0 ? Math.round((stats.errors / stats.count) * 100) : 0
      };
    });

    const summary = {
      totalPools: this.pools.size,
      healthyPools: poolsStatus.filter(p => p.healthy).length,
      totalQueries: poolsStatus.reduce((sum, p) => sum + p.totalQueries, 0),
      avgResponseTime: poolsStatus.length > 0 
        ? Math.round((poolsStatus.reduce((sum, p) => sum + p.avgResponseTime, 0) / poolsStatus.length) * 100) / 100 
        : 0
    };

    return { pools: poolsStatus, queryStats: queryStatsArray, summary };
  }

  /**
   * Get specific database instance for manual operations
   */
  getDatabase(replicaName: string = 'primary'): ReturnType<typeof drizzle> | null {
    const replica = this.pools.get(replicaName);
    return replica?.isHealthy ? replica.db : null;
  }

  /**
   * Get all healthy databases for broadcasting operations
   */
  getHealthyDatabases(): Array<{ name: string; db: ReturnType<typeof drizzle> }> {
    return Array.from(this.pools.entries())
      .filter(([_, status]) => status.isHealthy)
      .map(([name, status]) => ({ name, db: status.db }));
  }

  /**
   * Graceful shutdown of all pools
   */
  async shutdown(): Promise<void> {
    console.log('🛑 [Replica Manager] Shutting down database pools...');
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    const promises = Array.from(this.pools.values()).map(async (status) => {
      try {
        await status.pool.end();
        console.log(`✅ [Shutdown] Closed ${status.config.name} pool`);
      } catch (error) {
        console.error(`❌ [Shutdown] Error closing ${status.config.name}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
    this.pools.clear();
    console.log('🎯 [Replica Manager] Shutdown complete');
  }
}

// ===============================
// EXPORTS
// ===============================

export const replicaManager = new DatabaseReplicaManager();
export { QueryType, QUERY_PATTERNS };

// Enhanced database connection with automatic routing
export async function getDatabase(preferredReplica?: string): Promise<ReturnType<typeof drizzle>> {
  if (preferredReplica) {
    const db = replicaManager.getDatabase(preferredReplica);
    if (db) return db;
  }
  
  // Fallback to primary
  const primary = replicaManager.getDatabase('primary');
  if (!primary) {
    throw new Error('No healthy database connections available');
  }
  
  return primary;
}

// Query execution wrapper with routing
export async function executeRoutedQuery<T = any>(
  query: string,
  params?: any[],
  options?: { forceWrite?: boolean; timeout?: number; retries?: number }
): Promise<T> {
  return replicaManager.executeQuery<T>(query, params || [], options || {});
}

console.log('🗄️  Database Read Replica Strategy initialized - Phase 3 Scaling ready');
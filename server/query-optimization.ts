/**
 * Phase 3: Advanced Query Optimization & Database Tuning
 * 
 * Implements intelligent query optimization, indexing strategies,
 * and database performance tuning for enterprise pharmaceutical ERP
 * 
 * Target: Optimize all database operations for <200ms response times
 */

import { sql, SQL } from 'drizzle-orm';
import { getDatabase } from './read-replica-strategy';
import { advancedCache, buildCacheKey, CACHE_KEYS } from './advanced-cache-system';
import { performanceMonitor } from './performance-monitoring';

// ===============================
// INDEX OPTIMIZATION DEFINITIONS
// ===============================

interface IndexDefinition {
  table: string;
  name: string;
  columns: string[];
  type: 'btree' | 'gin' | 'gist' | 'hash' | 'partial';
  condition?: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const PERFORMANCE_INDEXES: IndexDefinition[] = [
  // Critical performance indexes - most frequently accessed
  {
    table: 'sales_orders',
    name: 'idx_sales_orders_customer_status_date',
    columns: ['customer_id', 'status', 'order_date'],
    type: 'btree',
    description: 'Optimize customer order lookups by status and date',
    priority: 'critical'
  },
  {
    table: 'inventory',
    name: 'idx_inventory_product_warehouse_qty',
    columns: ['product_id', 'warehouse_id', 'quantity'],
    type: 'btree',
    description: 'Fast inventory level lookups',
    priority: 'critical'
  },
  {
    table: 'products',
    name: 'idx_products_active_category',
    columns: ['is_active', 'category'],
    type: 'btree',
    condition: 'is_active = true',
    description: 'Active products by category lookup',
    priority: 'critical'
  },
  
  // High priority indexes - dashboard and analytics
  {
    table: 'sales_order_items',
    name: 'idx_sales_order_items_product_date',
    columns: ['product_id', 'created_at'],
    type: 'btree',
    description: 'Product sales analytics and trends',
    priority: 'high'
  },
  {
    table: 'stock_movements',
    name: 'idx_stock_movements_date_type_product',
    columns: ['movement_date', 'movement_type', 'product_id'],
    type: 'btree',
    description: 'Stock movement analytics',
    priority: 'high'
  },
  {
    table: 'invoices',
    name: 'idx_invoices_customer_status_date',
    columns: ['customer_id', 'status', 'invoice_date'],
    type: 'btree',
    description: 'Customer invoice tracking',
    priority: 'high'
  },
  {
    table: 'users',
    name: 'idx_users_active_role',
    columns: ['is_active', 'role'],
    type: 'btree',
    condition: 'is_active = true',
    description: 'Active user role lookups',
    priority: 'high'
  },
  
  // Medium priority indexes - reporting and bulk operations
  {
    table: 'quotations',
    name: 'idx_quotations_customer_valid_period',
    columns: ['customer_id', 'valid_from', 'valid_to'],
    type: 'btree',
    description: 'Customer quotation validity tracking',
    priority: 'medium'
  },
  {
    table: 'purchase_orders',
    name: 'idx_purchase_orders_supplier_status',
    columns: ['supplier_id', 'status', 'order_date'],
    type: 'btree',
    description: 'Supplier purchase order management',
    priority: 'medium'
  },
  {
    table: 'employees',
    name: 'idx_employees_department_status',
    columns: ['department', 'employment_status'],
    type: 'btree',
    description: 'HR department analytics',
    priority: 'medium'
  },
  
  // Full-text search indexes
  {
    table: 'products',
    name: 'idx_products_name_description_gin',
    columns: ['name', 'description'],
    type: 'gin',
    description: 'Full-text search for products',
    priority: 'medium'
  },
  {
    table: 'customers',
    name: 'idx_customers_name_search_gin',
    columns: ['name', 'contact_person'],
    type: 'gin',
    description: 'Full-text search for customers',
    priority: 'medium'
  },
  
  // Expiry and compliance indexes
  {
    table: 'inventory',
    name: 'idx_inventory_expiry_warning',
    columns: ['expiry_date', 'warehouse_id'],
    type: 'btree',
    condition: 'expiry_date IS NOT NULL AND expiry_date > CURRENT_DATE',
    description: 'Expiry warning system',
    priority: 'high'
  },
  {
    table: 'licenses',
    name: 'idx_licenses_expiry_type',
    columns: ['expiry_date', 'license_type'],
    type: 'btree',
    condition: 'expiry_date > CURRENT_DATE',
    description: 'License compliance monitoring',
    priority: 'medium'
  }
];

// ===============================
// QUERY OPTIMIZATION PATTERNS
// ===============================

interface QueryPattern {
  name: string;
  pattern: RegExp;
  optimizer: (query: string, params: any[]) => {
    optimizedQuery: string;
    optimizedParams: any[];
    cacheable: boolean;
    cacheStrategy: 'HOT' | 'WARM' | 'COLD';
    cacheTTL?: number;
  };
}

const QUERY_OPTIMIZATIONS: QueryPattern[] = [
  // Dashboard metrics optimization
  {
    name: 'dashboard_metrics',
    pattern: /SELECT.*COUNT|SUM|AVG.*FROM.*(sales_orders|inventory|products).*WHERE/i,
    optimizer: (query, params) => {
      // Add query hints for better execution plan
      const optimizedQuery = query.replace(
        /SELECT/i,
        'SELECT /*+ USE_INDEX */'
      );
      
      return {
        optimizedQuery,
        optimizedParams: params,
        cacheable: true,
        cacheStrategy: 'HOT',
        cacheTTL: 300 // 5 minutes
      };
    }
  },
  
  // Product catalog queries
  {
    name: 'product_catalog',
    pattern: /SELECT.*FROM.*products.*WHERE.*category|is_active/i,
    optimizer: (query, params) => {
      // Ensure proper index usage
      let optimizedQuery = query;
      
      // Add covering index hint for product catalogs
      if (!query.includes('ORDER BY')) {
        optimizedQuery += ' ORDER BY category, name';
      }
      
      return {
        optimizedQuery,
        optimizedParams: params,
        cacheable: true,
        cacheStrategy: 'WARM',
        cacheTTL: 1800 // 30 minutes
      };
    }
  },
  
  // Inventory level queries
  {
    name: 'inventory_levels',
    pattern: /SELECT.*FROM.*inventory.*WHERE.*(product_id|warehouse_id)/i,
    optimizer: (query, params) => {
      return {
        optimizedQuery: query,
        optimizedParams: params,
        cacheable: true,
        cacheStrategy: 'HOT',
        cacheTTL: 60 // 1 minute - frequently changing data
      };
    }
  },
  
  // Customer lookup queries
  {
    name: 'customer_lookup',
    pattern: /SELECT.*FROM.*customers.*WHERE.*id.*=|\s+IN\s+/i,
    optimizer: (query, params) => {
      return {
        optimizedQuery: query,
        optimizedParams: params,
        cacheable: true,
        cacheStrategy: 'SESSION',
        cacheTTL: 900 // 15 minutes
      };
    }
  },
  
  // Reporting queries
  {
    name: 'analytical_reports',
    pattern: /SELECT.*FROM.*JOIN.*GROUP BY.*ORDER BY/i,
    optimizer: (query, params) => {
      // Add query parallelization hints for complex reports
      const optimizedQuery = query.replace(
        /SELECT/i,
        'SELECT /*+ PARALLEL(4) */'
      );
      
      return {
        optimizedQuery,
        optimizedParams: params,
        cacheable: true,
        cacheStrategy: 'COLD',
        cacheTTL: 3600 // 1 hour - reports don't change frequently
      };
    }
  }
];

// ===============================
// QUERY OPTIMIZATION ENGINE
// ===============================

class QueryOptimizationEngine {
  private queryCache = new Map<string, {
    result: any;
    timestamp: number;
    hitCount: number;
  }>();
  
  private queryStats = new Map<string, {
    executions: number;
    totalTime: number;
    cacheHits: number;
    avgTime: number;
    lastOptimized: number;
  }>();

  constructor() {
    this.startPerformanceTracking();
  }

  /**
   * Optimize and execute query with intelligent caching
   */
  async optimizeAndExecute<T = any>(
    query: string,
    params: any[] = [],
    options: {
      forceRefresh?: boolean;
      replica?: string;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const queryHash = this.hashQuery(query, params);
    const startTime = Date.now();
    
    // Check for query optimization pattern
    const optimization = this.findOptimization(query);
    let finalQuery = query;
    let finalParams = params;
    let cacheable = false;
    let cacheStrategy: 'HOT' | 'WARM' | 'COLD' | 'SESSION' = 'HOT';
    let cacheTTL = 300;
    
    if (optimization) {
      const optimized = optimization.optimizer(query, params);
      finalQuery = optimized.optimizedQuery;
      finalParams = optimized.optimizedParams;
      cacheable = optimized.cacheable;
      cacheStrategy = optimized.cacheStrategy;
      if (optimized.cacheTTL) {
        cacheTTL = optimized.cacheTTL;
      }
      
      console.log(`🔧 [Query Optimizer] Applied optimization: ${optimization.name}`);
    }

    // Try cache first if query is cacheable and not forced refresh
    if (cacheable && !options.forceRefresh) {
      const cacheKey = buildCacheKey(CACHE_KEYS.PRODUCT_LIST, {
        query: queryHash
      });
      
      const cached = await advancedCache.get<T>(cacheKey, cacheStrategy);
      if (cached) {
        this.updateQueryStats(queryHash, Date.now() - startTime, true);
        console.log(`🚀 [Query Cache Hit] ${optimization?.name || 'unknown'}`);
        return cached;
      }
    }

    try {
      // Execute optimized query
      const db = await getDatabase(options.replica);
      
      // Add timeout wrapper
      const timeoutMs = options.timeout || 30000;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      );
      
      const queryPromise = db.execute(sql.raw(finalQuery, ...finalParams));
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      const executionTime = Date.now() - startTime;
      
      // Cache result if cacheable
      if (cacheable) {
        const cacheKey = buildCacheKey(CACHE_KEYS.PRODUCT_LIST, {
          query: queryHash
        });
        
        await advancedCache.set(cacheKey, result, cacheStrategy, {
          query: optimization?.name,
          executionTime,
          optimized: !!optimization
        });
      }
      
      // Update statistics
      this.updateQueryStats(queryHash, executionTime, false);
      
      // Record performance metrics
      performanceMonitor.recordMetric(
        'query_optimization',
        optimization?.name || 'unoptimized',
        executionTime,
        'ms',
        {
          cached: 'false',
          optimized: optimization ? 'true' : 'false'
        }
      );
      
      console.log(`⚡ [Query Executed] ${optimization?.name || 'direct'} in ${executionTime}ms`);
      return result as T;
      
    } catch (error) {
      this.updateQueryStats(queryHash, Date.now() - startTime, false, true);
      console.error(`❌ [Query Error] ${optimization?.name || 'direct'}:`, error);
      throw error;
    }
  }

  /**
   * Batch optimize multiple queries for bulk operations
   */
  async optimizeBatch<T = any>(
    queries: Array<{ query: string; params?: any[] }>,
    options: {
      parallel?: boolean;
      replica?: string;
      timeout?: number;
    } = {}
  ): Promise<T[]> {
    const { parallel = true, ...queryOptions } = options;
    
    if (parallel) {
      // Execute queries in parallel for better performance
      const promises = queries.map(({ query, params }) =>
        this.optimizeAndExecute<T>(query, params || [], queryOptions)
      );
      
      return Promise.all(promises);
    } else {
      // Execute queries sequentially
      const results: T[] = [];
      for (const { query, params } of queries) {
        const result = await this.optimizeAndExecute<T>(query, params || [], queryOptions);
        results.push(result);
      }
      return results;
    }
  }

  private findOptimization(query: string): QueryPattern | null {
    for (const pattern of QUERY_OPTIMIZATIONS) {
      if (pattern.pattern.test(query)) {
        return pattern;
      }
    }
    return null;
  }

  private hashQuery(query: string, params: any[]): string {
    const normalized = query.trim().replace(/\s+/g, ' ').toLowerCase();
    const paramsStr = JSON.stringify(params);
    
    // Simple hash function
    let hash = 0;
    const str = normalized + paramsStr;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private updateQueryStats(
    queryHash: string,
    executionTime: number,
    wasCacheHit: boolean,
    wasError: boolean = false
  ): void {
    const stats = this.queryStats.get(queryHash) || {
      executions: 0,
      totalTime: 0,
      cacheHits: 0,
      avgTime: 0,
      lastOptimized: Date.now()
    };

    stats.executions++;
    stats.totalTime += executionTime;
    
    if (wasCacheHit) {
      stats.cacheHits++;
    }
    
    stats.avgTime = stats.totalTime / stats.executions;
    
    this.queryStats.set(queryHash, stats);
  }

  private startPerformanceTracking(): void {
    // Log query performance summary every 5 minutes
    setInterval(() => {
      this.logPerformanceSummary();
    }, 300000);
  }

  private logPerformanceSummary(): void {
    if (this.queryStats.size === 0) return;
    
    const stats = Array.from(this.queryStats.entries())
      .map(([hash, stats]) => ({
        hash: hash.substring(0, 8),
        executions: stats.executions,
        avgTime: Math.round(stats.avgTime),
        cacheHitRate: Math.round((stats.cacheHits / stats.executions) * 100),
        totalTime: stats.totalTime
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10);
    
    console.log('📊 [Query Performance Summary - Top 10 by Total Time]');
    console.table(stats);
  }

  /**
   * Get comprehensive query performance analytics
   */
  getPerformanceAnalytics(): {
    totalQueries: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    slowQueries: Array<{
      hash: string;
      executions: number;
      avgTime: number;
      totalTime: number;
    }>;
    topCachedQueries: Array<{
      hash: string;
      cacheHits: number;
      hitRate: number;
    }>;
  } {
    if (this.queryStats.size === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        cacheHitRate: 0,
        slowQueries: [],
        topCachedQueries: []
      };
    }

    const allStats = Array.from(this.queryStats.values());
    const totalExectuions = allStats.reduce((sum, s) => sum + s.executions, 0);
    const totalTime = allStats.reduce((sum, s) => sum + s.totalTime, 0);
    const totalCacheHits = allStats.reduce((sum, s) => sum + s.cacheHits, 0);

    const slowQueries = Array.from(this.queryStats.entries())
      .filter(([_, stats]) => stats.avgTime > 500) // Slower than 500ms
      .map(([hash, stats]) => ({
        hash: hash.substring(0, 8),
        executions: stats.executions,
        avgTime: Math.round(stats.avgTime),
        totalTime: stats.totalTime
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    const topCachedQueries = Array.from(this.queryStats.entries())
      .filter(([_, stats]) => stats.cacheHits > 0)
      .map(([hash, stats]) => ({
        hash: hash.substring(0, 8),
        cacheHits: stats.cacheHits,
        hitRate: Math.round((stats.cacheHits / stats.executions) * 100)
      }))
      .sort((a, b) => b.cacheHits - a.cacheHits)
      .slice(0, 10);

    return {
      totalQueries: totalExectuions,
      averageExecutionTime: totalExectuions > 0 ? Math.round(totalTime / totalExectuions) : 0,
      cacheHitRate: totalExectuions > 0 ? Math.round((totalCacheHits / totalExectuions) * 100) : 0,
      slowQueries,
      topCachedQueries
    };
  }
}

// ===============================
// INDEX MANAGEMENT
// ===============================

class IndexManager {
  private installedIndexes = new Set<string>();

  /**
   * Install all performance indexes
   */
  async installPerformanceIndexes(priorities: Array<IndexDefinition['priority']> = ['critical', 'high']): Promise<{
    installed: number;
    skipped: number;
    errors: Array<{ index: string; error: string }>;
  }> {
    console.log('🏗️  [Index Manager] Installing performance indexes...');
    
    const indexesToInstall = PERFORMANCE_INDEXES.filter(idx => 
      priorities.includes(idx.priority)
    );
    
    let installed = 0;
    let skipped = 0;
    const errors: Array<{ index: string; error: string }> = [];
    
    for (const indexDef of indexesToInstall) {
      try {
        if (this.installedIndexes.has(indexDef.name)) {
          skipped++;
          continue;
        }
        
        await this.createIndex(indexDef);
        this.installedIndexes.add(indexDef.name);
        installed++;
        
        console.log(`✅ [Index Created] ${indexDef.name} on ${indexDef.table}`);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ index: indexDef.name, error: errorMsg });
        console.error(`❌ [Index Error] ${indexDef.name}: ${errorMsg}`);
      }
    }
    
    const summary = { installed, skipped, errors };
    console.log(`🎯 [Index Installation Complete] Installed: ${installed}, Skipped: ${skipped}, Errors: ${errors.length}`);
    
    return summary;
  }

  private async createIndex(indexDef: IndexDefinition): Promise<void> {
    const db = await getDatabase('primary'); // Always use primary for DDL
    
    const columns = indexDef.columns.join(', ');
    let createSQL = `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexDef.name} ON ${indexDef.table}`;
    
    // Add index type
    if (indexDef.type === 'gin') {
      createSQL += ` USING GIN`;
    } else if (indexDef.type === 'gist') {
      createSQL += ` USING GIST`;
    } else if (indexDef.type === 'hash') {
      createSQL += ` USING HASH`;
    }
    
    // Add columns
    if (indexDef.type === 'gin' && indexDef.table === 'products') {
      // Special handling for full-text search indexes
      createSQL += ` (to_tsvector('english', ${columns}))`;
    } else {
      createSQL += ` (${columns})`;
    }
    
    // Add conditions for partial indexes
    if (indexDef.condition) {
      createSQL += ` WHERE ${indexDef.condition}`;
    }
    
    await db.execute(sql.raw(createSQL));
  }

  /**
   * Get index usage statistics
   */
  async getIndexStats(): Promise<Array<{
    indexName: string;
    tableName: string;
    size: string;
    scans: number;
    tuplesRead: number;
    tuplesPerScan: number;
  }>> {
    const db = await getDatabase('primary');
    
    const query = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexname::regclass)) as size,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        CASE WHEN idx_scan > 0 
          THEN round(idx_tup_read / idx_scan, 2) 
          ELSE 0 
        END as tuples_per_scan
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC, idx_tup_read DESC;
    `;
    
    const result = await db.execute(sql.raw(query));
    
    return (result as any[]).map(row => ({
      indexName: row.indexname,
      tableName: row.tablename,
      size: row.size,
      scans: parseInt(row.scans) || 0,
      tuplesRead: parseInt(row.tuples_read) || 0,
      tuplesPerScan: parseFloat(row.tuples_per_scan) || 0
    }));
  }
}

// ===============================
// EXPORTS
// ===============================

export const queryOptimizer = new QueryOptimizationEngine();
export const indexManager = new IndexManager();

// Convenience functions
export async function optimizedQuery<T = any>(
  query: string,
  params?: any[],
  options?: { forceRefresh?: boolean; replica?: string; timeout?: number }
): Promise<T> {
  return queryOptimizer.optimizeAndExecute<T>(query, params, options);
}

export async function optimizedBatch<T = any>(
  queries: Array<{ query: string; params?: any[] }>,
  options?: { parallel?: boolean; replica?: string; timeout?: number }
): Promise<T[]> {
  return queryOptimizer.optimizeBatch<T>(queries, options);
}

// Index installation helper
export async function installCriticalIndexes(): Promise<void> {
  const result = await indexManager.installPerformanceIndexes(['critical']);
  
  if (result.errors.length > 0) {
    console.warn(`⚠️  Some critical indexes failed to install: ${result.errors.length} errors`);
  } else {
    console.log(`✅ All critical indexes installed successfully (${result.installed} indexes)`);
  }
}

console.log('🔧 Query Optimization Engine initialized - Phase 3 Database Tuning ready');
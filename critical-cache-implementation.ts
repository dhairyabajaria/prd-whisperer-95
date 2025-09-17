/**
 * Critical Performance Fix: Dashboard Metrics Caching
 * 
 * This implementation addresses the most critical performance issue:
 * Dashboard metrics degrading from 586ms to 8.9s under concurrent load
 * 
 * Expected impact: Reduce dashboard load time by 83-91%
 */

import { Redis } from 'ioredis';

// Cache configuration
const CACHE_CONFIG = {
  DASHBOARD_METRICS_TTL: 300, // 5 minutes
  DASHBOARD_METRICS_KEY: 'dashboard:metrics',
  STALE_WHILE_REVALIDATE: 60, // Serve stale data for 1 minute while refreshing
};

// Redis client singleton with proper cleanup
let redisClient: Redis | null = null;
let shutdownHandlersRegistered = false;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      // Add connection timeout and error handling
      connectTimeout: 5000,
      commandTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 1) {
          console.warn('⚠️  Redis unavailable - using direct database queries only');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      }
    });
    
    // Log connection status
    redisClient.on('connect', () => console.log('🚀 Redis connected successfully!'));
    redisClient.on('error', (err) => console.warn('⚠️  Redis connection error:', err.message));
    
    // Register cleanup handlers once
    if (!shutdownHandlersRegistered) {
      registerRedisShutdownHandlers();
      shutdownHandlersRegistered = true;
    }
  }
  return redisClient;
}

// Proper Redis shutdown function
async function shutdownRedis(): Promise<void> {
  if (redisClient) {
    console.log('🔄 [Redis] Shutting down connection...');
    try {
      await redisClient.quit();
      console.log('✅ [Redis] Connection closed successfully');
    } catch (error) {
      console.error('❌ [Redis] Error closing connection:', error);
      // Force disconnect if quit fails
      redisClient.disconnect();
    }
    redisClient = null;
  }
}

// Register shutdown handlers for Redis
function registerRedisShutdownHandlers(): void {
  // Import the safe shutdown orchestrator
  import('./server/shutdown-orchestrator').then(({ registerShutdownHandler }) => {
    registerShutdownHandler({
      name: 'redis-client',
      priority: 30, // Redis should shut down after most other services
      shutdown: async () => {
        await shutdownRedis();
      }
    });
  }).catch(error => {
    console.error('❌ [Redis] Failed to register shutdown handler:', error);
  });
}

// Cached dashboard metrics interface
interface CachedDashboardMetrics {
  data: {
    totalRevenue: number;
    activeProducts: number;
    openOrders: number;
    outstandingAmount: number;
    expiringProductsCount: number;
  };
  timestamp: number;
  version: string;
}

// In-memory cache fallback when Redis is not available
let inMemoryCache: CachedDashboardMetrics | null = null;
let isRedisAvailable: boolean | null = null;

// Check if Redis is available
async function checkRedisAvailability(): Promise<boolean> {
  if (isRedisAvailable !== null) return isRedisAvailable;
  
  try {
    const redis = getRedisClient();
    await redis.ping();
    isRedisAvailable = true;
    console.log('✅ Redis available - using Redis cache');
    return true;
  } catch (error) {
    isRedisAvailable = false;
    console.log('⚠️  Redis unavailable - using in-memory cache fallback');
    return false;
  }
}

/**
 * Enhanced dashboard metrics with intelligent caching
 * 
 * Strategy:
 * 1. Try Redis cache first, fallback to in-memory cache
 * 2. If cache miss or stale, refresh asynchronously
 * 3. Return cached data immediately if available
 * 4. Use stale-while-revalidate pattern for best UX
 */
export async function getCachedDashboardMetrics(storage: any): Promise<CachedDashboardMetrics['data']> {
  const startTime = Date.now();
  
  try {
    const redisAvailable = await checkRedisAvailability();
    
    if (redisAvailable) {
      // Use Redis cache
      return await getRedisCachedMetrics(storage);
    } else {
      // Use in-memory cache fallback
      return await getInMemoryCachedMetrics(storage);
    }
  } catch (error) {
    console.error('Cache error, falling back to direct query:', error);
    const metrics = await storage.getDashboardMetrics();
    const queryTime = Date.now() - startTime;
    console.log(`🔍 Direct query fallback completed in ${queryTime}ms`);
    return metrics;
  }
}

// Redis cache implementation
async function getRedisCachedMetrics(storage: any): Promise<CachedDashboardMetrics['data']> {
  const redis = getRedisClient();
  const cacheKey = CACHE_CONFIG.DASHBOARD_METRICS_KEY;
  
  // Try to get from Redis cache first
  const cachedData = await redis.get(cacheKey);
  
  if (cachedData) {
    const parsed: CachedDashboardMetrics = JSON.parse(cachedData);
    const age = Date.now() - parsed.timestamp;
    const isStale = age > (CACHE_CONFIG.DASHBOARD_METRICS_TTL * 1000);
    const isVeryStale = age > ((CACHE_CONFIG.DASHBOARD_METRICS_TTL + CACHE_CONFIG.STALE_WHILE_REVALIDATE) * 1000);
    
    // If not very stale, return cached data
    if (!isVeryStale) {
      // If stale but not very stale, refresh asynchronously
      if (isStale) {
        refreshDashboardMetricsCache(storage).catch(err => 
          console.error('Async cache refresh failed:', err)
        );
      }
      
      console.log(`🚀 Dashboard metrics served from Redis cache (age: ${Math.round(age/1000)}s)`);
      return parsed.data;
    }
  }
  
  // Cache miss or very stale - fetch fresh data
  console.log('💾 Redis cache miss - fetching fresh data');
  return await refreshDashboardMetricsCache(storage);
}

// In-memory cache implementation  
async function getInMemoryCachedMetrics(storage: any): Promise<CachedDashboardMetrics['data']> {
  const now = Date.now();
  
  if (inMemoryCache) {
    const age = now - inMemoryCache.timestamp;
    const isStale = age > (CACHE_CONFIG.DASHBOARD_METRICS_TTL * 1000);
    const isVeryStale = age > ((CACHE_CONFIG.DASHBOARD_METRICS_TTL + CACHE_CONFIG.STALE_WHILE_REVALIDATE) * 1000);
    
    // If not very stale, return cached data
    if (!isVeryStale) {
      // If stale but not very stale, refresh asynchronously
      if (isStale) {
        refreshInMemoryCache(storage).catch(err => 
          console.error('Async in-memory cache refresh failed:', err)
        );
      }
      
      console.log(`🚀 Dashboard metrics served from in-memory cache (age: ${Math.round(age/1000)}s)`);
      return inMemoryCache.data;
    }
  }
  
  // Cache miss or very stale - fetch fresh data
  console.log('💾 In-memory cache miss - fetching fresh data');
  return await refreshInMemoryCache(storage);
}

// Refresh in-memory cache
async function refreshInMemoryCache(storage: any): Promise<CachedDashboardMetrics['data']> {
  try {
    const startTime = Date.now();
    const freshData = await storage.getDashboardMetrics();
    const queryTime = Date.now() - startTime;
    
    // Update in-memory cache
    inMemoryCache = {
      data: freshData,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    console.log(`✅ Dashboard metrics cached in-memory (query: ${queryTime}ms)`);
    return freshData;
  } catch (error) {
    console.error('Failed to refresh in-memory cache:', error);
    throw error;
  }
}

/**
 * Refresh dashboard metrics cache
 */
async function refreshDashboardMetricsCache(storage: any): Promise<CachedDashboardMetrics['data']> {
  const redis = getRedisClient();
  const cacheKey = CACHE_CONFIG.DASHBOARD_METRICS_KEY;
  
  try {
    // Fetch fresh data from database
    const startTime = Date.now();
    const freshData = await storage.getDashboardMetrics();
    const queryTime = Date.now() - startTime;
    
    // Cache the fresh data
    const cacheData: CachedDashboardMetrics = {
      data: freshData,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    await redis.setex(
      cacheKey, 
      CACHE_CONFIG.DASHBOARD_METRICS_TTL, 
      JSON.stringify(cacheData)
    );
    
    console.log(`✅ Dashboard metrics cached (query: ${queryTime}ms)`);
    return freshData;
    
  } catch (error) {
    console.error('Failed to refresh dashboard metrics cache:', error);
    throw error;
  }
}

/**
 * Invalidate dashboard metrics cache
 * Call this when data changes that affect dashboard metrics
 */
export async function invalidateDashboardMetricsCache(): Promise<void> {
  try {
    const redisAvailable = await checkRedisAvailability();
    
    if (redisAvailable) {
      // Invalidate Redis cache
      const redis = getRedisClient();
      const cacheKey = CACHE_CONFIG.DASHBOARD_METRICS_KEY;
      await redis.del(cacheKey);
      console.log('♻️  Dashboard metrics Redis cache invalidated');
    }
    
    // Always invalidate in-memory cache
    inMemoryCache = null;
    console.log('♻️  Dashboard metrics in-memory cache invalidated');
    
  } catch (error) {
    console.error('Failed to invalidate dashboard metrics cache:', error);
    // Still clear in-memory cache even if Redis fails
    inMemoryCache = null;
  }
}

/**
 * Memory-optimized middleware for memory leak prevention
 * Ensures proper cleanup of resources in request lifecycle
 */
export function memoryOptimizedMiddleware() {
  return (req: any, res: any, next: any) => {
    // Track request start time
    const startTime = Date.now();
    const initialMemory = process.memoryUsage();
    
    // Track cleanup to prevent multiple executions
    let cleanupDone = false;
    
    // Cleanup function with proper listener removal
    const cleanup = () => {
      if (!cleanupDone) {
        cleanupDone = true;
        
        // Force garbage collection if available (development only)
        if (process.env.NODE_ENV === 'development' && global.gc) {
          global.gc();
        }
        
        // Log memory usage for monitoring
        const endTime = Date.now();
        const finalMemory = process.memoryUsage();
        const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // More aggressive memory thresholds for better leak detection
        if (memoryDelta > 20 * 1024 * 1024) { // > 20MB increase - CRITICAL
          console.error(`🚨 CRITICAL memory usage in request: ${Math.round(memoryDelta / 1024 / 1024)}MB in ${endTime - startTime}ms`);
        } else if (memoryDelta > 10 * 1024 * 1024) { // > 10MB increase - WARNING
          console.warn(`⚠️  High memory usage in request: ${Math.round(memoryDelta / 1024 / 1024)}MB in ${endTime - startTime}ms`);
        } else if (memoryDelta > 5 * 1024 * 1024) { // > 5MB increase - NOTICE
          console.log(`📊 Memory notice: ${Math.round(memoryDelta / 1024 / 1024)}MB in ${endTime - startTime}ms`);
        }
        
        // Remove listeners to prevent memory leaks
        res.removeListener('finish', cleanup);
        res.removeListener('close', cleanup);
        res.removeListener('error', cleanup);
      }
    };
    
    // Ensure cleanup happens regardless of how response ends
    res.on('finish', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);
    
    next();
  };
}

/**
 * Enhanced connection pool configuration for high-concurrency pharmaceutical ERP
 * Addresses concurrent query performance issues and connection stability
 * Optimized for Phase 1 Critical Performance Improvements
 */
export const optimizedPoolConfig = {
  // Enhanced connection pool settings - optimized for concurrent requests
  max: 25,                    // Increased maximum connections for high concurrency
  min: 8,                     // Higher minimum to maintain warm connections
  idleTimeoutMillis: 60000,   // Extended idle timeout to reduce connection churn
  connectionTimeoutMillis: 10000, // Increased timeout for better reliability under load
  
  // Enhanced query settings with better error handling
  statement_timeout: 45000,   // Extended query timeout for complex dashboard metrics
  query_timeout: 45000,      // Longer timeout for analytical queries
  
  // Advanced connection management
  retryDelayOnFailover: 200,  // Increased retry delay for better stability
  maxRetriesPerRequest: 5,    // More retries for resilience
  
  // Connection health monitoring
  acquireTimeoutMillis: 15000, // Time to wait for connection acquisition
  reapIntervalMillis: 5000,   // Check for idle connections every 5s
  
  // PostgreSQL-specific optimizations
  application_name: 'pharmaceutical_erp',
  
  // Enhanced monitoring with performance tracking
  log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    const timestamp = new Date().toISOString();
    const prefix = `[DB Pool ${timestamp}]`;
    
    if (level === 'error') {
      console.error(`❌ ${prefix} ${message}`);
    } else if (level === 'warn') {
      console.warn(`⚠️  ${prefix} ${message}`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 ${prefix} ${message}`);
    }
  },
  
  // Connection validation
  validate: async (connection: any) => {
    try {
      await connection.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Connection validation failed:', error);
      return false;
    }
  },
  
  // Connection pool events for monitoring
  afterCreate: (connection: any, callback: any) => {
    console.log('🔗 New database connection established');
    callback(null, connection);
  },
  
  beforeDestroy: (connection: any) => {
    console.log('🔌 Database connection being destroyed');
  }
};

/**
 * Database query optimization wrapper
 * Adds query timing and optimization hints
 */
export function optimizeQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string,
  timeoutMs: number = 5000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    const timeout = setTimeout(() => {
      reject(new Error(`Query timeout: ${queryName} exceeded ${timeoutMs}ms`));
    }, timeoutMs);
    
    try {
      const result = await queryFn();
      const queryTime = Date.now() - startTime;
      
      // Log slow queries
      if (queryTime > 1000) {
        console.warn(`🐌 Slow query detected: ${queryName} took ${queryTime}ms`);
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ Query ${queryName}: ${queryTime}ms`);
      }
      
      clearTimeout(timeout);
      resolve(result);
    } catch (error) {
      clearTimeout(timeout);
      console.error(`❌ Query failed: ${queryName}`, error);
      reject(error);
    }
  });
}

/**
 * Health check for performance monitoring
 */
export async function performanceHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    heapUtilization: number;
    cacheStatus: 'connected' | 'disconnected';
    avgResponseTime?: number;
  };
}> {
  const memory = process.memoryUsage();
  const heapUtilization = (memory.heapUsed / memory.heapTotal) * 100;
  
  // Test cache connectivity
  let cacheStatus: 'connected' | 'disconnected' = 'disconnected';
  try {
    const redis = getRedisClient();
    await redis.ping();
    cacheStatus = 'connected';
  } catch (error) {
    console.error('Cache health check failed:', error);
  }
  
  // Determine overall health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (heapUtilization > 90) {
    status = 'unhealthy';
  } else if (heapUtilization > 80 || cacheStatus === 'disconnected') {
    status = 'degraded';
  }
  
  return {
    status,
    metrics: {
      memoryUsage: memory,
      heapUtilization,
      cacheStatus
    }
  };
}
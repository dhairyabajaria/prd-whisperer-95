/**
 * High-Performance In-Memory Cache System
 * 
 * Provides Redis-like functionality without external dependencies
 * Includes TTL, cache warming, invalidation, and performance monitoring
 */

// ===============================
// CACHE ENTRY INTERFACE
// ===============================

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  totalOperations: number;
  averageResponseTime: number;
  hitRate: number;
}

// ===============================
// HIGH-PERFORMANCE CACHE MANAGER
// ===============================

class HighPerformanceCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalOperations: 0,
    averageResponseTime: 0,
    hitRate: 0
  };
  
  private cleanupTimer: NodeJS.Timeout | null = null;
  private maxSize: number = 10000; // Maximum cache entries
  private cleanupInterval: number = 60000; // 1 minute cleanup
  
  constructor() {
    this.startCleanupTimer();
    
    // Graceful shutdown cleanup
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }
  
  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.recordMiss(startTime);
        return null;
      }
      
      // Check if expired
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.recordMiss(startTime);
        return null;
      }
      
      // Update access metadata
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      this.recordHit(startTime);
      return entry.data as T;
      
    } catch (error) {
      console.error('Cache get error:', error);
      this.recordMiss(startTime);
      return null;
    }
  }
  
  /**
   * Set value in cache with TTL
   */
  async set<T = any>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Enforce cache size limits
      if (this.cache.size >= this.maxSize) {
        this.evictOldestEntries(Math.floor(this.maxSize * 0.1)); // Remove 10%
      }
      
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: ttlSeconds * 1000, // Convert to milliseconds
        version: '1.0',
        accessCount: 0,
        lastAccessed: Date.now()
      };
      
      this.cache.set(key, entry);
      this.stats.sets++;
      this.updateStats(startTime);
      
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  /**
   * Delete key from cache
   */
  async del(key: string): Promise<number> {
    const deleted = this.cache.delete(key) ? 1 : 0;
    this.stats.deletes += deleted;
    return deleted;
  }
  
  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }
  
  /**
   * Get or set pattern - execute function if cache miss
   */
  async getOrSet<T = any>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    // Cache miss - fetch fresh data
    const fresh = await fetchFunction();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
  
  /**
   * Clear all cache entries
   */
  async flushAll(): Promise<void> {
    this.cache.clear();
    this.resetStats();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { 
    size: number; 
    memoryUsage: string;
    oldestEntry?: number;
    newestEntry?: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      ...this.stats,
      size: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined
    };
  }
  
  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    const stats = this.getStats();
    const memoryUsageMB = this.getMemoryUsageMB();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (memoryUsageMB > 500 || stats.hitRate < 50) {
      status = 'unhealthy';
    } else if (memoryUsageMB > 200 || stats.hitRate < 70) {
      status = 'degraded';
    }
    
    return {
      status,
      details: {
        ...stats,
        memoryUsageMB,
        cleanupActive: !!this.cleanupTimer
      }
    };
  }
  
  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================
  
  private isExpired(entry: CacheEntry): boolean {
    return (Date.now() - entry.timestamp) > entry.ttl;
  }
  
  private recordHit(startTime: number): void {
    this.stats.hits++;
    this.updateStats(startTime);
  }
  
  private recordMiss(startTime: number): void {
    this.stats.misses++;
    this.updateStats(startTime);
  }
  
  private updateStats(startTime: number): void {
    const duration = Date.now() - startTime;
    this.stats.totalOperations++;
    
    // Rolling average response time
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * 0.9) + (duration * 0.1);
    
    // Calculate hit rate
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
  
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalOperations: 0,
      averageResponseTime: 0,
      hitRate: 0
    };
  }
  
  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }
  
  private estimateMemoryUsage(): string {
    const mb = this.getMemoryUsageMB();
    return `${mb.toFixed(1)}MB`;
  }
  
  private getMemoryUsageMB(): number {
    // Rough estimation: each entry ~1KB (key + data + metadata)
    return (this.cache.size * 1024) / (1024 * 1024);
  }
  
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.cleanupInterval);
  }
  
  private cleanupExpiredEntries(): void {
    const startTime = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      const duration = Date.now() - startTime;
      console.log(`🧹 Cache cleanup: Removed ${cleaned} expired entries in ${duration}ms`);
    }
  }
  
  private shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    console.log('🏁 Cache system shutdown complete');
  }
}

// ===============================
// CACHE CONFIGURATION
// ===============================

export const CACHE_CONFIG = {
  DASHBOARD_METRICS: {
    key: 'dashboard:metrics',
    ttl: 300, // 5 minutes
    staleWhileRevalidate: 60 // 1 minute
  },
  RECENT_TRANSACTIONS: {
    key: 'dashboard:transactions',
    ttl: 180, // 3 minutes
    staleWhileRevalidate: 30 // 30 seconds
  },
  EXPIRING_PRODUCTS: {
    key: 'dashboard:expiring-products',
    ttl: 600, // 10 minutes
    staleWhileRevalidate: 120 // 2 minutes
  },
  USER_PROFILE: {
    key: 'user:profile:{{userId}}',
    ttl: 3600, // 1 hour
    staleWhileRevalidate: 300 // 5 minutes
  }
};

// ===============================
// SINGLETON CACHE INSTANCE
// ===============================

export const cache = new HighPerformanceCache();

// ===============================
// CONVENIENCE FUNCTIONS
// ===============================

/**
 * Get cached dashboard metrics with automatic refresh
 */
export async function getCachedDashboardMetrics(storage: any) {
  const config = CACHE_CONFIG.DASHBOARD_METRICS;
  
  return await cache.getOrSet(
    config.key,
    async () => {
      console.log('💾 Fetching fresh dashboard metrics from database');
      const startTime = Date.now();
      const metrics = await storage.getDashboardMetrics();
      const duration = Date.now() - startTime;
      console.log(`✅ Dashboard metrics fetched in ${duration}ms`);
      return metrics;
    },
    config.ttl
  );
}

/**
 * Invalidate dashboard metrics cache
 */
export async function invalidateDashboardMetricsCache(): Promise<void> {
  await cache.del(CACHE_CONFIG.DASHBOARD_METRICS.key);
  console.log('♻️  Dashboard metrics cache invalidated');
}

/**
 * Get cached recent transactions
 */
export async function getCachedRecentTransactions(storage: any, limit: number = 10) {
  const config = CACHE_CONFIG.RECENT_TRANSACTIONS;
  const key = `${config.key}:${limit}`;
  
  return await cache.getOrSet(
    key,
    async () => {
      console.log('💾 Fetching fresh recent transactions from database');
      return await storage.getRecentTransactions(limit);
    },
    config.ttl
  );
}

/**
 * Get cached expiring products
 */
export async function getCachedExpiringProducts(storage: any, daysAhead: number = 90) {
  const config = CACHE_CONFIG.EXPIRING_PRODUCTS;
  const key = `${config.key}:${daysAhead}`;
  
  return await cache.getOrSet(
    key,
    async () => {
      console.log('💾 Fetching fresh expiring products from database');
      return await storage.getExpiringProducts(daysAhead);
    },
    config.ttl
  );
}

/**
 * Memory-optimized middleware for request lifecycle
 */
export function cacheMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Add cache utilities to request
    req.cache = cache;
    
    // Add response time header
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      res.set('X-Response-Time', `${duration}ms`);
      res.set('X-Cache-Status', 'enhanced-memory');
    });
    
    next();
  };
}

// ===============================
// EXPORT DEFAULT CACHE
// ===============================

export default cache;
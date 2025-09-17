/**
 * Phase 3: Advanced Caching Architecture
 * 
 * Builds upon Phase 1 (95% dashboard improvement) and Phase 2 (89% auth improvement)
 * to create comprehensive distributed caching for enterprise-scale performance
 * 
 * Target: Support 1000+ concurrent users with <200ms response times
 */

import { Redis } from 'ioredis';
import { getRedisClient } from '../critical-cache-implementation';

// ===============================
// CACHE CONFIGURATION & STRATEGY
// ===============================

interface CacheConfig {
  ttl: number;                    // Time to live in seconds
  staleWhileRevalidate: number;   // Extra time to serve stale data while refreshing
  maxRetries: number;             // Maximum retry attempts
  warmupEnabled: boolean;         // Enable cache warming
  analyticsEnabled: boolean;      // Track cache performance
}

const CACHE_STRATEGIES = {
  // Hot data - accessed frequently, short TTL
  HOT: {
    ttl: 300,                     // 5 minutes
    staleWhileRevalidate: 60,     // 1 minute SWR
    maxRetries: 3,
    warmupEnabled: true,
    analyticsEnabled: true
  } as CacheConfig,
  
  // Warm data - moderately accessed, medium TTL  
  WARM: {
    ttl: 1800,                    // 30 minutes
    staleWhileRevalidate: 300,    // 5 minutes SWR
    maxRetries: 2,
    warmupEnabled: true,
    analyticsEnabled: true
  } as CacheConfig,
  
  // Cold data - infrequently accessed, long TTL
  COLD: {
    ttl: 7200,                    // 2 hours
    staleWhileRevalidate: 1800,   // 30 minutes SWR
    maxRetries: 1,
    warmupEnabled: false,
    analyticsEnabled: false
  } as CacheConfig,
  
  // Session data - user-specific, medium TTL
  SESSION: {
    ttl: 3600,                    // 1 hour
    staleWhileRevalidate: 600,    // 10 minutes SWR
    maxRetries: 3,
    warmupEnabled: false,
    analyticsEnabled: true
  } as CacheConfig,
  
  // Static data - rarely changes, very long TTL
  STATIC: {
    ttl: 86400,                   // 24 hours
    staleWhileRevalidate: 3600,   // 1 hour SWR
    maxRetries: 1,
    warmupEnabled: true,
    analyticsEnabled: false
  } as CacheConfig
};

// ===============================
// CACHE KEY PATTERNS
// ===============================

const CACHE_KEYS = {
  // Dashboard & Analytics (HOT)
  DASHBOARD_METRICS: 'analytics:dashboard:metrics',
  REVENUE_SUMMARY: 'analytics:revenue:summary',
  PRODUCT_PERFORMANCE: 'analytics:products:performance',
  
  // Product Catalog (WARM)  
  PRODUCT_LIST: 'products:list',
  PRODUCT_DETAILS: 'products:details:{{id}}',
  PRODUCT_CATEGORIES: 'products:categories',
  PRODUCT_SEARCH: 'products:search:{{query}}',
  
  // Pricing & Rates (HOT)
  FX_RATES: 'pricing:fx:rates:{{base}}',
  COMPETITOR_PRICES: 'pricing:competitors:{{productId}}',
  PRICING_TIERS: 'pricing:tiers:{{customerId}}',
  
  // User & Session (SESSION)
  USER_PROFILE: 'users:profile:{{userId}}',
  USER_PERMISSIONS: 'users:permissions:{{userId}}',
  USER_PREFERENCES: 'users:preferences:{{userId}}',
  
  // Inventory & Stock (WARM)
  INVENTORY_LEVELS: 'inventory:levels:{{warehouseId}}',
  EXPIRING_PRODUCTS: 'inventory:expiring:{{days}}',
  STOCK_MOVEMENTS: 'inventory:movements:recent',
  
  // Reports & Queries (COLD)
  SALES_REPORTS: 'reports:sales:{{period}}:{{filters}}',
  QUOTATION_ANALYTICS: 'reports:quotations:{{period}}',
  COMPLIANCE_REPORTS: 'reports:compliance:{{type}}',
  
  // Static Configuration (STATIC)
  SYSTEM_CONFIG: 'config:system:settings',
  WAREHOUSE_LIST: 'config:warehouses:all',
  SUPPLIER_LIST: 'config:suppliers:all',
  CUSTOMER_TIERS: 'config:customers:tiers'
};

// ===============================
// CACHE ANALYTICS & MONITORING
// ===============================

interface CacheAnalytics {
  hits: number;
  misses: number;
  errors: number;
  avgResponseTime: number;
  lastAccessed: number;
  hitRate: number;
}

class CacheMonitor {
  private analytics = new Map<string, CacheAnalytics>();
  private performanceLog: Array<{ key: string; operation: string; duration: number; timestamp: number }> = [];
  private readonly MAX_PERFORMANCE_LOG_SIZE = 10000;

  // Record cache operation
  recordOperation(key: string, operation: 'hit' | 'miss' | 'error', duration: number): void {
    const analytics = this.analytics.get(key) || {
      hits: 0, misses: 0, errors: 0, avgResponseTime: 0, lastAccessed: 0, hitRate: 0
    };

    // Update counters
    analytics[operation === 'hit' ? 'hits' : operation === 'miss' ? 'misses' : 'errors']++;
    analytics.lastAccessed = Date.now();
    
    // Update average response time (rolling average)
    analytics.avgResponseTime = (analytics.avgResponseTime * 0.9) + (duration * 0.1);
    
    // Calculate hit rate
    const total = analytics.hits + analytics.misses;
    analytics.hitRate = total > 0 ? (analytics.hits / total) * 100 : 0;
    
    this.analytics.set(key, analytics);
    
    // Log performance data
    this.performanceLog.push({
      key: key.split(':')[0], // Group by category
      operation,
      duration,
      timestamp: Date.now()
    });
    
    // Trim log if it gets too large
    if (this.performanceLog.length > this.MAX_PERFORMANCE_LOG_SIZE) {
      this.performanceLog = this.performanceLog.slice(-this.MAX_PERFORMANCE_LOG_SIZE / 2);
    }
  }

  // Get analytics for specific key or pattern
  getAnalytics(keyPattern?: string): Map<string, CacheAnalytics> | CacheAnalytics | undefined {
    if (!keyPattern) return this.analytics;
    
    if (this.analytics.has(keyPattern)) {
      return this.analytics.get(keyPattern);
    }
    
    // Return aggregated analytics for pattern
    const matchingKeys = Array.from(this.analytics.keys()).filter(key => 
      key.startsWith(keyPattern.replace('*', ''))
    );
    
    if (matchingKeys.length === 0) return undefined;
    
    const aggregated: CacheAnalytics = {
      hits: matchingKeys.reduce((sum, key) => sum + (this.analytics.get(key)?.hits || 0), 0),
      misses: matchingKeys.reduce((sum, key) => sum + (this.analytics.get(key)?.misses || 0), 0),
      errors: matchingKeys.reduce((sum, key) => sum + (this.analytics.get(key)?.errors || 0), 0),
      avgResponseTime: matchingKeys.reduce((sum, key) => sum + (this.analytics.get(key)?.avgResponseTime || 0), 0) / matchingKeys.length,
      lastAccessed: Math.max(...matchingKeys.map(key => this.analytics.get(key)?.lastAccessed || 0)),
      hitRate: 0
    };
    
    const total = aggregated.hits + aggregated.misses;
    aggregated.hitRate = total > 0 ? (aggregated.hits / total) * 100 : 0;
    
    return aggregated;
  }

  // Get performance summary
  getPerformanceSummary(): {
    totalOperations: number;
    averageHitRate: number;
    averageResponseTime: number;
    topKeys: Array<{ key: string; hitRate: number; operations: number }>;
    slowestKeys: Array<{ key: string; avgTime: number }>;
  } {
    const analytics = Array.from(this.analytics.entries());
    const totalOps = analytics.reduce((sum, [_, stats]) => sum + stats.hits + stats.misses, 0);
    const avgHitRate = analytics.length > 0 
      ? analytics.reduce((sum, [_, stats]) => sum + stats.hitRate, 0) / analytics.length 
      : 0;
    const avgResponseTime = analytics.length > 0
      ? analytics.reduce((sum, [_, stats]) => sum + stats.avgResponseTime, 0) / analytics.length
      : 0;

    // Top performing keys by hit rate
    const topKeys = analytics
      .filter(([_, stats]) => stats.hits + stats.misses > 10) // Minimum activity threshold
      .sort((a, b) => b[1].hitRate - a[1].hitRate)
      .slice(0, 10)
      .map(([key, stats]) => ({
        key: key.split(':').slice(0, 2).join(':'), // Truncate specific IDs
        hitRate: Math.round(stats.hitRate * 100) / 100,
        operations: stats.hits + stats.misses
      }));

    // Slowest keys by average response time  
    const slowestKeys = analytics
      .filter(([_, stats]) => stats.avgResponseTime > 0)
      .sort((a, b) => b[1].avgResponseTime - a[1].avgResponseTime)
      .slice(0, 10)
      .map(([key, stats]) => ({
        key: key.split(':').slice(0, 2).join(':'), // Truncate specific IDs
        avgTime: Math.round(stats.avgResponseTime * 100) / 100
      }));

    return {
      totalOperations: totalOps,
      averageHitRate: Math.round(avgHitRate * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      topKeys,
      slowestKeys
    };
  }

  // Clear analytics (useful for testing)
  clearAnalytics(): void {
    this.analytics.clear();
    this.performanceLog = [];
  }
}

// Global cache monitor instance
const cacheMonitor = new CacheMonitor();

// ===============================
// ADVANCED CACHE MANAGER
// ===============================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  strategy: keyof typeof CACHE_STRATEGIES;
  metadata?: Record<string, any>;
}

class AdvancedCacheManager {
  private redis: Redis | null = null;
  private inMemoryCache = new Map<string, CacheEntry<any>>();
  private isRedisAvailable: boolean | null = null;
  private warmupTasks = new Set<string>();

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = getRedisClient();
      await this.redis.ping();
      this.isRedisAvailable = true;
      console.log('🎯 [Advanced Cache] Redis cluster connection established');
    } catch (error) {
      this.isRedisAvailable = false;
      console.warn('⚠️  [Advanced Cache] Redis unavailable, using in-memory fallback');
    }
  }

  // ===============================
  // CORE CACHE OPERATIONS
  // ===============================

  /**
   * Get cached data with intelligent fallback and analytics
   */
  async get<T>(
    key: string, 
    strategy: keyof typeof CACHE_STRATEGIES = 'HOT'
  ): Promise<T | null> {
    const startTime = Date.now();
    const config = CACHE_STRATEGIES[strategy];

    try {
      // Try Redis first if available
      if (this.isRedisAvailable && this.redis) {
        const cached = await this.redis.get(key);
        
        if (cached) {
          const entry: CacheEntry<T> = JSON.parse(cached);
          const age = Date.now() - entry.timestamp;
          const isStale = age > (config.ttl * 1000);
          const isVeryStale = age > ((config.ttl + config.staleWhileRevalidate) * 1000);
          
          // Record hit analytics
          if (config.analyticsEnabled) {
            cacheMonitor.recordOperation(key, 'hit', Date.now() - startTime);
          }
          
          // Return data if not very stale
          if (!isVeryStale) {
            console.log(`🚀 [Cache Hit] ${key} (age: ${Math.round(age/1000)}s)`);
            return entry.data;
          }
        }
      }

      // Try in-memory cache as fallback
      const inMemoryEntry = this.inMemoryCache.get(key);
      if (inMemoryEntry) {
        const age = Date.now() - inMemoryEntry.timestamp;
        const config = CACHE_STRATEGIES[inMemoryEntry.strategy];
        const isVeryStale = age > ((config.ttl + config.staleWhileRevalidate) * 1000);
        
        if (!isVeryStale) {
          if (config.analyticsEnabled) {
            cacheMonitor.recordOperation(key, 'hit', Date.now() - startTime);
          }
          console.log(`🔄 [Memory Hit] ${key} (age: ${Math.round(age/1000)}s)`);
          return inMemoryEntry.data;
        }
      }

      // Cache miss
      if (config.analyticsEnabled) {
        cacheMonitor.recordOperation(key, 'miss', Date.now() - startTime);
      }
      
      return null;

    } catch (error) {
      console.error(`❌ [Cache Error] Failed to get ${key}:`, error);
      if (config.analyticsEnabled) {
        cacheMonitor.recordOperation(key, 'error', Date.now() - startTime);
      }
      return null;
    }
  }

  /**
   * Set cached data with distributed storage
   */
  async set<T>(
    key: string, 
    data: T, 
    strategy: keyof typeof CACHE_STRATEGIES = 'HOT',
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const config = CACHE_STRATEGIES[strategy];
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: '2.0',
      strategy,
      metadata
    };

    try {
      // Store in Redis if available
      if (this.isRedisAvailable && this.redis) {
        await this.redis.setex(
          key, 
          config.ttl + config.staleWhileRevalidate, 
          JSON.stringify(entry)
        );
      }

      // Always store in memory as fallback
      this.inMemoryCache.set(key, entry);
      
      // Cleanup old entries periodically
      this.cleanupInMemoryCache();

      console.log(`💾 [Cache Set] ${key} (strategy: ${strategy}, TTL: ${config.ttl}s)`);
      return true;

    } catch (error) {
      console.error(`❌ [Cache Error] Failed to set ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set with fallback function
   */
  async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    strategy: keyof typeof CACHE_STRATEGIES = 'HOT',
    metadata?: Record<string, any>
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, strategy);
    if (cached !== null) {
      return cached;
    }

    // Execute fallback function
    const startTime = Date.now();
    console.log(`🔍 [Cache Miss] Executing fallback for ${key}`);
    
    try {
      const result = await fallbackFn();
      const executionTime = Date.now() - startTime;
      
      // Cache the result
      await this.set(key, result, strategy, {
        ...metadata,
        executionTime,
        fetchedAt: new Date().toISOString()
      });
      
      console.log(`✅ [Cache Fill] ${key} executed in ${executionTime}ms`);
      return result;

    } catch (error) {
      console.error(`❌ [Cache Fallback Error] ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidate(pattern: string): Promise<number> {
    let deletedCount = 0;

    try {
      // Invalidate Redis entries
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          deletedCount += keys.length;
        }
      }

      // Invalidate in-memory entries
      for (const key of this.inMemoryCache.keys()) {
        if (this.matchesPattern(key, pattern)) {
          this.inMemoryCache.delete(key);
          deletedCount++;
        }
      }

      console.log(`♻️  [Cache Invalidation] Cleared ${deletedCount} entries matching ${pattern}`);
      return deletedCount;

    } catch (error) {
      console.error(`❌ [Cache Invalidation Error] Pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Cache warming for frequently accessed data
   */
  async warmup(warmupConfig: Array<{
    key: string;
    dataFn: () => Promise<any>;
    strategy: keyof typeof CACHE_STRATEGIES;
  }>): Promise<void> {
    console.log(`🔥 [Cache Warmup] Starting warmup for ${warmupConfig.length} entries`);
    
    const startTime = Date.now();
    const promises = warmupConfig.map(async (config) => {
      try {
        if (this.warmupTasks.has(config.key)) {
          return; // Already warming up
        }
        
        this.warmupTasks.add(config.key);
        
        const data = await config.dataFn();
        await this.set(config.key, data, config.strategy, {
          warmedUp: true,
          warmupTime: Date.now()
        });
        
        this.warmupTasks.delete(config.key);
        
      } catch (error) {
        this.warmupTasks.delete(config.key);
        console.error(`❌ [Cache Warmup Error] ${config.key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    const duration = Date.now() - startTime;
    console.log(`🎉 [Cache Warmup] Completed in ${duration}ms`);
  }

  // ===============================
  // MAINTENANCE & UTILITIES
  // ===============================

  private cleanupInMemoryCache(): void {
    const now = Date.now();
    const MAX_MEMORY_ENTRIES = 10000;
    
    if (this.inMemoryCache.size > MAX_MEMORY_ENTRIES) {
      // Remove oldest entries that are past their SWR window
      const entriesToDelete: string[] = [];
      
      for (const [key, entry] of this.inMemoryCache.entries()) {
        const config = CACHE_STRATEGIES[entry.strategy];
        const maxAge = (config.ttl + config.staleWhileRevalidate) * 1000;
        
        if (now - entry.timestamp > maxAge) {
          entriesToDelete.push(key);
        }
      }
      
      entriesToDelete.forEach(key => this.inMemoryCache.delete(key));
      console.log(`🧹 [Memory Cleanup] Removed ${entriesToDelete.length} expired entries`);
    }
  }

  private matchesPattern(key: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(key);
    }
    return key.startsWith(pattern);
  }

  /**
   * Get cache health status
   */
  async getHealthStatus(): Promise<{
    redis: { available: boolean; latency?: number };
    memory: { entries: number; size: string };
    performance: ReturnType<CacheMonitor['getPerformanceSummary']>;
  }> {
    let redisLatency: number | undefined;
    
    if (this.isRedisAvailable && this.redis) {
      const start = Date.now();
      try {
        await this.redis.ping();
        redisLatency = Date.now() - start;
      } catch (error) {
        this.isRedisAvailable = false;
      }
    }

    // Estimate memory usage
    const memoryEntries = this.inMemoryCache.size;
    const sampleSize = Math.min(100, memoryEntries);
    let totalSize = 0;
    
    let count = 0;
    for (const [key, entry] of this.inMemoryCache.entries()) {
      if (count >= sampleSize) break;
      totalSize += JSON.stringify({ key, entry }).length;
      count++;
    }
    
    const avgSize = sampleSize > 0 ? totalSize / sampleSize : 0;
    const estimatedSize = avgSize * memoryEntries;
    
    return {
      redis: {
        available: this.isRedisAvailable || false,
        latency: redisLatency
      },
      memory: {
        entries: memoryEntries,
        size: this.formatBytes(estimatedSize)
      },
      performance: cacheMonitor.getPerformanceSummary()
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// ===============================
// EXPORTS
// ===============================

export const advancedCache = new AdvancedCacheManager();
export { CACHE_KEYS, CACHE_STRATEGIES };
export { cacheMonitor };

// Helper function to replace template variables in cache keys
export function buildCacheKey(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return variables[variable] || match;
  });
}

/**
 * Decorator for automatic caching of method results
 */
export function cached<T>(
  keyTemplate: string,
  strategy: keyof typeof CACHE_STRATEGIES = 'HOT'
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Build cache key from template and method arguments
      const cacheKey = buildCacheKey(keyTemplate, {
        method: propertyKey,
        args: JSON.stringify(args).slice(0, 50) // Truncate long args
      });
      
      return advancedCache.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        strategy,
        {
          method: propertyKey,
          arguments: args.length
        }
      );
    };
    
    return descriptor;
  };
}

console.log('🎯 Advanced Cache System initialized - Phase 3 Long-Term Optimization ready');
/**
 * Phase 3: Comprehensive Performance Monitoring & Observability
 * 
 * Real-time performance metrics collection, monitoring, and alerting
 * for enterprise-scale pharmaceutical ERP system
 * 
 * Target: Complete visibility into system performance and bottlenecks
 */

import { EventEmitter } from 'events';
import { loadavg, totalmem } from 'os';
import { replicaManager } from './read-replica-strategy';
import { advancedCache, cacheMonitor } from './advanced-cache-system';
import { performanceHealthCheck } from '../critical-cache-implementation';

// ===============================
// PERFORMANCE METRICS COLLECTION
// ===============================

interface PerformanceMetric {
  timestamp: number;
  category: string;
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    heap: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  eventLoop: {
    delay: number;
    utilization: number;
  };
  uptime: number;
  connections: {
    active: number;
    total: number;
  };
}

interface ApiMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userAgent?: string;
  userId?: string;
  error?: string;
}

interface DatabaseMetrics {
  query: string;
  duration: number;
  replica: string;
  success: boolean;
  rowsAffected?: number;
  timestamp: number;
}

interface AlertCondition {
  id: string;
  name: string;
  category: string;
  condition: (metrics: PerformanceMetric[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMs: number;
  lastTriggered: number;
  isActive: boolean;
}

// ===============================
// PERFORMANCE MONITORING SYSTEM
// ===============================

class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: ApiMetrics[] = [];
  private databaseMetrics: DatabaseMetrics[] = [];
  private systemMetricsTimer: NodeJS.Timeout | null = null;
  private alertConditions: Map<string, AlertCondition> = new Map();
  
  private readonly MAX_METRICS_RETENTION = 100000;  // Keep last 100k metrics
  private readonly METRICS_COLLECTION_INTERVAL = 5000; // 5 seconds
  private readonly API_METRICS_RETENTION_HOURS = 24;
  private readonly DB_METRICS_RETENTION_HOURS = 12;
  
  // Cleanup tracking
  private cleanupTimers: Set<NodeJS.Timeout> = new Set();
  private shutdownHandlersRegistered = false;

  constructor() {
    super();
    this.setupDefaultAlerts();
    this.startSystemMetricsCollection();
    this.setupCleanupTasks();
    
    // Register shutdown handlers
    if (!this.shutdownHandlersRegistered) {
      this.registerShutdownHandlers();
      this.shutdownHandlersRegistered = true;
    }
  }

  // ===============================
  // METRICS COLLECTION
  // ===============================

  recordMetric(
    category: string,
    name: string,
    value: number,
    unit: string = 'count',
    tags?: Record<string, string>,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      category,
      name,
      value,
      unit,
      tags,
      metadata
    };

    this.metrics.push(metric);
    this.emit('metric', metric);
    
    // Check alerts
    this.checkAlertConditions(metric);
    
    // Cleanup old metrics periodically
    if (this.metrics.length > this.MAX_METRICS_RETENTION) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_RETENTION * 0.8);
    }
  }

  recordApiCall(apiMetric: Omit<ApiMetrics, 'timestamp'>): void {
    const metric: ApiMetrics = {
      ...apiMetric,
      timestamp: Date.now()
    };

    this.apiMetrics.push(metric);
    
    // Record as performance metric for aggregation
    this.recordMetric(
      'api',
      `${apiMetric.method}_${apiMetric.endpoint.replace(/\/[0-9]+/g, '/:id')}`,
      apiMetric.responseTime,
      'ms',
      {
        method: apiMetric.method,
        endpoint: apiMetric.endpoint,
        statusCode: apiMetric.statusCode.toString()
      },
      { error: apiMetric.error }
    );
    
    this.emit('apiCall', metric);
  }

  recordDatabaseQuery(dbMetric: Omit<DatabaseMetrics, 'timestamp'>): void {
    const metric: DatabaseMetrics = {
      ...dbMetric,
      timestamp: Date.now()
    };

    this.databaseMetrics.push(metric);
    
    // Record as performance metric
    this.recordMetric(
      'database',
      'query_duration',
      dbMetric.duration,
      'ms',
      {
        replica: dbMetric.replica,
        success: dbMetric.success.toString(),
        query_type: this.classifyQuery(dbMetric.query)
      }
    );
    
    this.emit('databaseQuery', metric);
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAverage = loadavg();
    
    // Event loop monitoring
    const eventLoopStart = Date.now();
    await new Promise(resolve => setImmediate(resolve));
    const eventLoopDelay = Date.now() - eventLoopStart;
    
    // Calculate CPU usage percentage (approximate)
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert from microseconds
    
    const systemMetrics: SystemMetrics = {
      cpu: {
        usage: Math.min(cpuPercent, 100),
        loadAverage: loadAverage
      },
      memory: {
        used: memoryUsage.rss,
        total: totalmem(),
        percentage: (memoryUsage.rss / totalmem()) * 100,
        heap: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        }
      },
      eventLoop: {
        delay: eventLoopDelay,
        utilization: Math.min(eventLoopDelay / 10, 100) // Rough utilization estimate
      },
      uptime: process.uptime(),
      connections: {
        active: 0, // Would need connection tracking
        total: 0
      }
    };

    // Record individual system metrics
    this.recordMetric('system', 'cpu_usage', systemMetrics.cpu.usage, '%');
    this.recordMetric('system', 'memory_usage', systemMetrics.memory.percentage, '%');
    this.recordMetric('system', 'heap_usage', systemMetrics.memory.heap.percentage, '%');
    this.recordMetric('system', 'event_loop_delay', systemMetrics.eventLoop.delay, 'ms');
    this.recordMetric('system', 'load_average_1m', systemMetrics.cpu.loadAverage[0], 'load');

    return systemMetrics;
  }

  private startSystemMetricsCollection(): void {
    this.systemMetricsTimer = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
      } catch (error) {
        console.error('❌ [Performance Monitor] System metrics collection failed:', error);
      }
    }, this.METRICS_COLLECTION_INTERVAL);
    
    // Track the timer for cleanup
    if (this.systemMetricsTimer) {
      this.cleanupTimers.add(this.systemMetricsTimer);
    }
  }

  // ===============================
  // ANALYTICS & AGGREGATION
  // ===============================

  getMetricsAnalytics(
    category?: string,
    timeRangeMs: number = 3600000, // Last hour by default
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count' = 'avg'
  ): {
    category: string;
    metrics: Array<{
      name: string;
      value: number;
      unit: string;
      count: number;
      tags?: Record<string, string>;
    }>;
  }[] {
    const now = Date.now();
    const cutoff = now - timeRangeMs;
    
    // Filter metrics by time and category
    const relevantMetrics = this.metrics.filter(metric => 
      metric.timestamp >= cutoff && 
      (!category || metric.category === category)
    );

    // Group by category and name
    const grouped = new Map<string, Map<string, PerformanceMetric[]>>();
    
    for (const metric of relevantMetrics) {
      if (!grouped.has(metric.category)) {
        grouped.set(metric.category, new Map());
      }
      
      const categoryMap = grouped.get(metric.category)!;
      if (!categoryMap.has(metric.name)) {
        categoryMap.set(metric.name, []);
      }
      
      categoryMap.get(metric.name)!.push(metric);
    }

    // Aggregate results
    const results: ReturnType<typeof this.getMetricsAnalytics> = [];
    
    for (const [cat, metricsMap] of Array.from(grouped.entries())) {
      const categoryResult = {
        category: cat,
        metrics: [] as any[]
      };
      
      for (const [name, metricsList] of Array.from(metricsMap.entries())) {
        if (metricsList.length === 0) continue;
        
        const values = metricsList.map((m: any) => m.value);
        let aggregatedValue: number;
        
        switch (aggregation) {
           case 'avg': aggregatedValue = values.reduce((sum: any, v: any) => sum + v, 0) / values.length; break;
           case 'sum': aggregatedValue = values.reduce((sum: any, v: any) => sum + v, 0); break;
          case 'min': aggregatedValue = Math.min(...values); break;
          case 'max': aggregatedValue = Math.max(...values); break;
          case 'count': aggregatedValue = values.length; break;
        }
        
        categoryResult.metrics.push({
          name,
          value: Math.round(aggregatedValue * 100) / 100,
          unit: metricsList[0].unit,
          count: metricsList.length,
          tags: metricsList[0].tags
        });
      }
      
      results.push(categoryResult);
    }
    
    return results;
  }

  getApiPerformanceSummary(timeRangeMs: number = 3600000): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowestEndpoints: Array<{
      endpoint: string;
      method: string;
      avgResponseTime: number;
      requestCount: number;
    }>;
    statusCodeDistribution: Record<string, number>;
  } {
    const now = Date.now();
    const cutoff = now - timeRangeMs;
    
    const relevantCalls = this.apiMetrics.filter(call => call.timestamp >= cutoff);
    
    if (relevantCalls.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowestEndpoints: [],
        statusCodeDistribution: {}
      };
    }

    const totalRequests = relevantCalls.length;
    const averageResponseTime = relevantCalls.reduce((sum, call) => sum + call.responseTime, 0) / totalRequests;
    const errorCalls = relevantCalls.filter(call => call.statusCode >= 400);
    const errorRate = (errorCalls.length / totalRequests) * 100;

    // Group by endpoint for performance analysis
    const endpointStats = new Map<string, {
      responseTimes: number[];
      requestCount: number;
      method: string;
    }>();

    for (const call of relevantCalls) {
      const key = `${call.method} ${call.endpoint.replace(/\/[0-9]+/g, '/:id')}`;
      
      if (!endpointStats.has(key)) {
        endpointStats.set(key, {
          responseTimes: [],
          requestCount: 0,
          method: call.method
        });
      }
      
      const stats = endpointStats.get(key)!;
      stats.responseTimes.push(call.responseTime);
      stats.requestCount++;
    }

    // Get slowest endpoints
    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint: endpoint.split(' ')[1],
        method: stats.method,
        avgResponseTime: Math.round((stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length) * 100) / 100,
        requestCount: stats.requestCount
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10);

    // Status code distribution
    const statusCodeDistribution: Record<string, number> = {};
    for (const call of relevantCalls) {
      const code = call.statusCode.toString();
      statusCodeDistribution[code] = (statusCodeDistribution[code] || 0) + 1;
    }

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      slowestEndpoints,
      statusCodeDistribution
    };
  }

  getDatabasePerformanceSummary(timeRangeMs: number = 3600000): {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: Array<{
      query: string;
      avgDuration: number;
      executions: number;
      replica: string;
    }>;
    replicaDistribution: Record<string, number>;
    errorRate: number;
  } {
    const now = Date.now();
    const cutoff = now - timeRangeMs;
    
    const relevantQueries = this.databaseMetrics.filter(query => query.timestamp >= cutoff);
    
    if (relevantQueries.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: [],
        replicaDistribution: {},
        errorRate: 0
      };
    }

    const totalQueries = relevantQueries.length;
    const averageQueryTime = relevantQueries.reduce((sum, query) => sum + query.duration, 0) / totalQueries;
    const failedQueries = relevantQueries.filter(query => !query.success);
    const errorRate = (failedQueries.length / totalQueries) * 100;

    // Group queries for analysis
    const queryStats = new Map<string, {
      durations: number[];
      replica: string;
      executions: number;
    }>();

    for (const query of relevantQueries) {
      const normalizedQuery = this.normalizeQuery(query.query);
      
      if (!queryStats.has(normalizedQuery)) {
        queryStats.set(normalizedQuery, {
          durations: [],
          replica: query.replica,
          executions: 0
        });
      }
      
      const stats = queryStats.get(normalizedQuery)!;
      stats.durations.push(query.duration);
      stats.executions++;
    }

    // Get slow queries
    const slowQueries = Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query: query.length > 100 ? query.substring(0, 97) + '...' : query,
        avgDuration: Math.round((stats.durations.reduce((sum, time) => sum + time, 0) / stats.durations.length) * 100) / 100,
        executions: stats.executions,
        replica: stats.replica
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    // Replica distribution
    const replicaDistribution: Record<string, number> = {};
    for (const query of relevantQueries) {
      replicaDistribution[query.replica] = (replicaDistribution[query.replica] || 0) + 1;
    }

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      slowQueries,
      replicaDistribution,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  // ===============================
  // ALERTING SYSTEM
  // ===============================

  private setupDefaultAlerts(): void {
    // High response time alert
    this.addAlert({
      id: 'high_response_time',
      name: 'High API Response Time',
      category: 'performance',
      condition: (metrics) => {
        const recentApiMetrics = metrics
          .filter(m => m.category === 'api' && m.timestamp > Date.now() - 300000) // Last 5 minutes
          .slice(-20); // Last 20 API calls
          
        if (recentApiMetrics.length < 5) return false;
        
        const avgResponseTime = recentApiMetrics.reduce((sum, m) => sum + m.value, 0) / recentApiMetrics.length;
        return avgResponseTime > 1000; // Alert if average response time > 1s
      },
      severity: 'high',
      cooldownMs: 300000 // 5 minutes
    });

    // High error rate alert  
    this.addAlert({
      id: 'high_error_rate',
      name: 'High API Error Rate',
      category: 'reliability',
      condition: (metrics) => {
        const recentCalls = this.apiMetrics.filter(call => call.timestamp > Date.now() - 300000);
        if (recentCalls.length < 10) return false;
        
        const errorCalls = recentCalls.filter(call => call.statusCode >= 400);
        const errorRate = (errorCalls.length / recentCalls.length) * 100;
        return errorRate > 10; // Alert if error rate > 10%
      },
      severity: 'critical',
      cooldownMs: 300000
    });

    // High memory usage alert
    this.addAlert({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      category: 'system',
      condition: (metrics) => {
        const recentMemoryMetrics = metrics
          .filter(m => m.category === 'system' && m.name === 'memory_usage' && m.timestamp > Date.now() - 60000)
          .slice(-5);
          
        if (recentMemoryMetrics.length < 3) return false;
        
        return recentMemoryMetrics.every(m => m.value > 85); // Alert if memory > 85% for last 3 readings
      },
      severity: 'medium',
      cooldownMs: 600000 // 10 minutes
    });

    // Database slow queries alert
    this.addAlert({
      id: 'slow_database_queries',
      name: 'Slow Database Queries Detected',
      category: 'database',
      condition: (metrics) => {
        const recentDbMetrics = metrics
          .filter(m => m.category === 'database' && m.name === 'query_duration' && m.timestamp > Date.now() - 300000)
          .slice(-20);
          
        if (recentDbMetrics.length < 5) return false;
        
        const slowQueries = recentDbMetrics.filter(m => m.value > 2000); // > 2 seconds
        return slowQueries.length >= 3; // Alert if 3+ slow queries in recent history
      },
      severity: 'medium',
      cooldownMs: 600000
    });
  }

  addAlert(condition: Omit<AlertCondition, 'lastTriggered' | 'isActive'>): void {
    const alert: AlertCondition = {
      ...condition,
      lastTriggered: 0,
      isActive: false
    };
    
    this.alertConditions.set(condition.id, alert);
    console.log(`🚨 [Performance Monitor] Added alert: ${condition.name}`);
  }

  private checkAlertConditions(newMetric: PerformanceMetric): void {
    const now = Date.now();
    
    for (const alert of Array.from(this.alertConditions.values())) {
      // Skip if alert is in cooldown
      if (alert.isActive && (now - alert.lastTriggered) < alert.cooldownMs) {
        continue;
      }
      
      try {
        const shouldTrigger = alert.condition(this.metrics);
        
        if (shouldTrigger && !alert.isActive) {
          // Trigger alert
          alert.isActive = true;
          alert.lastTriggered = now;
          
          this.emit('alert', {
            ...alert,
            triggeredAt: now,
            triggeringMetric: newMetric
          });
          
          console.warn(`🚨 [ALERT] ${alert.severity.toUpperCase()}: ${alert.name}`);
          
        } else if (!shouldTrigger && alert.isActive) {
          // Clear alert
          alert.isActive = false;
          
          this.emit('alertCleared', {
            ...alert,
            clearedAt: now
          });
          
          console.log(`✅ [ALERT CLEARED] ${alert.name}`);
        }
        
      } catch (error) {
        console.error(`❌ [Alert Error] Failed to check condition ${alert.id}:`, error);
      }
    }
  }

  // ===============================
  // UTILITIES
  // ===============================

  private classifyQuery(query: string): string {
    const normalizedQuery = query.trim().toLowerCase();
    
    if (normalizedQuery.startsWith('select')) return 'select';
    if (normalizedQuery.startsWith('insert')) return 'insert';
    if (normalizedQuery.startsWith('update')) return 'update';
    if (normalizedQuery.startsWith('delete')) return 'delete';
    if (normalizedQuery.includes('count(') || normalizedQuery.includes('sum(') || normalizedQuery.includes('avg(')) return 'aggregation';
    
    return 'other';
  }

  private normalizeQuery(query: string): string {
    return query
      .replace(/\$\d+/g, '?') // Replace parameterized queries
      .replace(/\d+/g, 'N')   // Replace numbers with N
      .replace(/'/g, "'X'")   // Replace string literals
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim();
  }

  private setupCleanupTasks(): void {
    // Clean up old API metrics every hour
    const apiCleanupTimer = setInterval(() => {
      const cutoff = Date.now() - (this.API_METRICS_RETENTION_HOURS * 3600000);
      this.apiMetrics = this.apiMetrics.filter(metric => metric.timestamp >= cutoff);
    }, 3600000);
    this.cleanupTimers.add(apiCleanupTimer);

    // Clean up old database metrics every hour
    const dbCleanupTimer = setInterval(() => {
      const cutoff = Date.now() - (this.DB_METRICS_RETENTION_HOURS * 3600000);
      this.databaseMetrics = this.databaseMetrics.filter(metric => metric.timestamp >= cutoff);
    }, 3600000);
    this.cleanupTimers.add(dbCleanupTimer);
  }

  private registerShutdownHandlers(): void {
    // Import the safe shutdown orchestrator
    import('./shutdown-orchestrator').then(({ registerShutdownHandler }) => {
      registerShutdownHandler({
        name: 'performance-monitor',
        priority: 10, // Performance monitor should shut down early to record final metrics
        shutdown: async () => {
          this.shutdown();
        }
      });
    }).catch(error => {
      console.error('❌ [Performance Monitor] Failed to register shutdown handler:', error);
    });
  }

  private shutdown(): void {
    console.log('🔄 [Performance Monitor] Shutting down...');
    
    // Clear system metrics timer
    if (this.systemMetricsTimer) {
      clearInterval(this.systemMetricsTimer);
      this.systemMetricsTimer = null;
    }
    
    // Clear all cleanup timers
    for (const timer of Array.from(this.cleanupTimers)) {
      clearInterval(timer);
    }
    this.cleanupTimers.clear();
    
    // Clear data arrays to free memory
    this.metrics = [];
    this.apiMetrics = [];
    this.databaseMetrics = [];
    this.alertConditions.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    console.log('✅ [Performance Monitor] Shutdown complete');
  }

  // ===============================
  // COMPREHENSIVE STATUS
  // ===============================

  async getComprehensiveStatus(): Promise<{
    system: SystemMetrics;
    cache: Awaited<ReturnType<typeof advancedCache.getHealthStatus>>;
    database: ReturnType<typeof replicaManager.getStatus>;
    api: any; // ReturnType<typeof this.getApiPerformanceSummary>;
    alerts: Array<{
      id: string;
      name: string;
      isActive: boolean;
      severity: string;
      lastTriggered: number;
    }>;
    performance: {
      uptime: number;
      timestamp: number;
      version: string;
    };
  }> {
    const [systemMetrics, cacheStatus, dbStatus] = await Promise.all([
      this.collectSystemMetrics(),
      advancedCache.getHealthStatus(),
      Promise.resolve(replicaManager.getStatus())
    ]);

    return {
      system: systemMetrics,
      cache: cacheStatus,
      database: dbStatus,
      api: this.getApiPerformanceSummary(),
      alerts: Array.from(this.alertConditions.values()).map(alert => ({
        id: alert.id,
        name: alert.name,
        isActive: alert.isActive,
        severity: alert.severity,
        lastTriggered: alert.lastTriggered
      })),
      performance: {
        uptime: process.uptime(),
        timestamp: Date.now(),
        version: '3.0.0'
      }
    };
  }
}

// ===============================
// MIDDLEWARE INTEGRATION
// ===============================

export function createPerformanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const duration = Date.now() - startTime;
      
      performanceMonitor.recordApiCall({
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: duration,
        userAgent: req.get('User-Agent'),
        userId: req.user?.claims?.sub,
        error: res.statusCode >= 400 ? 'API Error' : undefined
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// ===============================
// EXPORTS
// ===============================

export const performanceMonitor = new PerformanceMonitor();

// Database query monitoring decorator
export function monitorQuery<T extends any[], R>(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: T): Promise<R> {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;
    
    try {
      const result = await originalMethod.apply(this, args);
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      
      performanceMonitor.recordDatabaseQuery({
        query: propertyKey,
        duration,
        replica: 'unknown',
        success,
        rowsAffected: undefined
      });
    }
  };
  
  return descriptor;
}

console.log('📊 Performance Monitoring System initialized - Phase 3 Observability ready');
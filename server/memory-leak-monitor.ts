/**
 * MEMORY LEAK MONITORING & DETECTION SYSTEM
 * 
 * Critical production monitoring to detect and alert on memory leaks
 * Target: Prevent 17.96MB growth, maintain <2MB during load testing
 */

interface MemoryMetrics {
  timestamp: number;
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  heapUtilization: number;
}

interface LeakAlert {
  type: 'heap_growth' | 'memory_spike' | 'connection_leak' | 'timer_leak';
  severity: 'warning' | 'critical';
  message: string;
  metrics: MemoryMetrics;
  timestamp: number;
}

class MemoryLeakMonitor {
  private memoryHistory: MemoryMetrics[] = [];
  private readonly MAX_HISTORY = 100;
  private readonly MONITOR_INTERVAL = 30000; // 30 seconds
  private readonly CRITICAL_GROWTH_MB = 10; // 10MB growth triggers critical alert
  private readonly WARNING_GROWTH_MB = 5;   // 5MB growth triggers warning
  
  private monitoringTimer: NodeJS.Timeout | null = null;
  private initialMemory: MemoryMetrics | null = null;
  private shutdownHandlersRegistered = false;

  constructor() {
    this.startMonitoring();
    this.registerShutdownHandlers();
  }

  private startMonitoring(): void {
    console.log('🔍 [Memory Monitor] Starting memory leak detection...');
    
    // Capture initial memory baseline
    this.initialMemory = this.captureMemoryMetrics();
    this.memoryHistory.push(this.initialMemory);
    
    this.monitoringTimer = setInterval(() => {
      try {
        this.performMemoryCheck();
      } catch (error) {
        console.error('❌ [Memory Monitor] Error during memory check:', error);
      }
    }, this.MONITOR_INTERVAL);
  }

  private captureMemoryMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      heapUtilization: (memUsage.heapUsed / memUsage.heapTotal) * 100
    };
  }

  private performMemoryCheck(): void {
    const currentMetrics = this.captureMemoryMetrics();
    this.memoryHistory.push(currentMetrics);
    
    // Trim history to prevent memory leaks in the monitor itself
    if (this.memoryHistory.length > this.MAX_HISTORY) {
      this.memoryHistory = this.memoryHistory.slice(-this.MAX_HISTORY);
    }
    
    // Check for memory growth patterns
    this.checkMemoryGrowth(currentMetrics);
    this.checkHeapUtilization(currentMetrics);
    this.checkMemorySpikes(currentMetrics);
  }

  private checkMemoryGrowth(current: MemoryMetrics): void {
    if (!this.initialMemory || this.memoryHistory.length < 5) return;
    
    const growthMB = (current.heapUsed - this.initialMemory.heapUsed) / 1024 / 1024;
    const rssMB = current.rss / 1024 / 1024;
    
    if (growthMB > this.CRITICAL_GROWTH_MB) {
      this.triggerAlert({
        type: 'heap_growth',
        severity: 'critical',
        message: `CRITICAL MEMORY LEAK DETECTED: ${growthMB.toFixed(2)}MB heap growth (target: <2MB). RSS: ${rssMB.toFixed(2)}MB`,
        metrics: current,
        timestamp: Date.now()
      });
    } else if (growthMB > this.WARNING_GROWTH_MB) {
      this.triggerAlert({
        type: 'heap_growth',
        severity: 'warning',
        message: `Memory growth warning: ${growthMB.toFixed(2)}MB heap growth. RSS: ${rssMB.toFixed(2)}MB`,
        metrics: current,
        timestamp: Date.now()
      });
    }
  }

  private checkHeapUtilization(current: MemoryMetrics): void {
    if (current.heapUtilization > 90) {
      this.triggerAlert({
        type: 'memory_spike',
        severity: 'critical',
        message: `CRITICAL: High heap utilization ${current.heapUtilization.toFixed(1)}% - potential memory pressure`,
        metrics: current,
        timestamp: Date.now()
      });
    }
  }

  private checkMemorySpikes(current: MemoryMetrics): void {
    if (this.memoryHistory.length < 3) return;
    
    const recent = this.memoryHistory.slice(-3);
    const avgPrevious = recent.slice(0, 2).reduce((sum, m) => sum + m.heapUsed, 0) / 2;
    const spike = ((current.heapUsed - avgPrevious) / avgPrevious) * 100;
    
    if (spike > 50) { // 50% spike in heap usage
      this.triggerAlert({
        type: 'memory_spike',
        severity: 'warning',
        message: `Memory spike detected: ${spike.toFixed(1)}% increase in heap usage`,
        metrics: current,
        timestamp: Date.now()
      });
    }
  }

  private triggerAlert(alert: LeakAlert): void {
    const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
    console.log(`${icon} [MEMORY LEAK ALERT] ${alert.message}`);
    
    // In a production environment, this would integrate with monitoring services
    // like Datadog, New Relic, or send to alerting systems
    if (alert.severity === 'critical') {
      console.log('🚑 [EMERGENCY] Consider immediate investigation - memory leak detected');
    }
  }

  public getMemoryStats(): {
    current: MemoryMetrics;
    growthFromBaseline: number;
    trendAnalysis: string;
    recommendations: string[];
  } {
    const current = this.captureMemoryMetrics();
    const growthMB = this.initialMemory 
      ? (current.heapUsed - this.initialMemory.heapUsed) / 1024 / 1024 
      : 0;
    
    let trend = 'stable';
    const recommendations: string[] = [];
    
    if (this.memoryHistory.length >= 5) {
      const recent5 = this.memoryHistory.slice(-5);
      const isIncreasing = recent5.every((m, i) => 
        i === 0 || m.heapUsed >= recent5[i - 1].heapUsed
      );
      
      if (isIncreasing) {
        trend = 'increasing';
        recommendations.push('Memory continuously increasing - investigate potential leaks');
      }
    }
    
    if (current.heapUtilization > 80) {
      recommendations.push('High heap utilization - consider garbage collection or heap optimization');
    }
    
    if (growthMB > 2) {
      recommendations.push('Memory growth exceeds 2MB target - immediate investigation required');
    }
    
    return {
      current,
      growthFromBaseline: growthMB,
      trendAnalysis: trend,
      recommendations
    };
  }

  private registerShutdownHandlers(): void {
    if (this.shutdownHandlersRegistered) return;
    
    import('./shutdown-orchestrator').then(({ registerShutdownHandler }) => {
      registerShutdownHandler({
        name: 'memory-leak-monitor',
        priority: 5, // Shut down very early to capture final metrics
        shutdown: async () => {
          this.shutdown();
        }
      });
    }).catch(error => {
      console.error('❌ [Memory Monitor] Failed to register shutdown handler:', error);
    });
    
    this.shutdownHandlersRegistered = true;
  }

  private shutdown(): void {
    console.log('🔄 [Memory Monitor] Shutting down...');
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    // Final memory report
    if (this.initialMemory) {
      const final = this.captureMemoryMetrics();
      const totalGrowth = (final.heapUsed - this.initialMemory.heapUsed) / 1024 / 1024;
      console.log(`📊 [Memory Monitor] Final Report: ${totalGrowth.toFixed(2)}MB heap growth during session`);
      
      if (totalGrowth > 2) {
        console.log('⚠️  [Memory Monitor] WARNING: Memory growth exceeded 2MB target');
      } else {
        console.log('✅ [Memory Monitor] Memory growth within acceptable limits');
      }
    }
    
    console.log('✅ [Memory Monitor] Shutdown complete');
  }

  /**
   * Memory profiling for high-usage operations
   * Use this to wrap operations that might use significant memory
   */
  public async profileOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      warnThresholdMB?: number;
      criticalThresholdMB?: number;
      enableGC?: boolean;
    } = {}
  ): Promise<T> {
    const { 
      warnThresholdMB = 10, 
      criticalThresholdMB = 20, 
      enableGC = false 
    } = options;
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    console.log(`🔍 [Memory Profile] Starting: ${operationName}`);
    
    try {
      const result = await operation();
      
      // Force garbage collection if enabled (development)
      if (enableGC && process.env.NODE_ENV === 'development' && global.gc) {
        global.gc();
      }
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const memoryDelta = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024; // MB
      const duration = endTime - startTime;
      
      const icon = memoryDelta > criticalThresholdMB ? '🚨' : 
                   memoryDelta > warnThresholdMB ? '⚠️' : '✅';
      
      console.log(`${icon} [Memory Profile] ${operationName}: ${memoryDelta.toFixed(2)}MB in ${duration}ms`);
      
      if (memoryDelta > criticalThresholdMB) {
        console.error(`🚨 CRITICAL MEMORY USAGE in ${operationName}: ${memoryDelta.toFixed(2)}MB`);
        this.triggerAlert({
          type: 'memory_spike',
          severity: 'critical',
          message: `Critical memory usage in ${operationName}: ${memoryDelta.toFixed(2)}MB`,
          metrics: this.captureMemoryMetrics(),
          timestamp: Date.now()
        });
      } else if (memoryDelta > warnThresholdMB) {
        console.warn(`⚠️  HIGH MEMORY USAGE in ${operationName}: ${memoryDelta.toFixed(2)}MB`);
      }
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const memoryDelta = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;
      
      console.error(`❌ [Memory Profile] ${operationName} FAILED: ${memoryDelta.toFixed(2)}MB in ${endTime - startTime}ms`);
      throw error;
    }
  }

  /**
   * Enhanced middleware with memory profiling capabilities
   */
  public get middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      const initialMemory = process.memoryUsage();
      const operationName = `${req.method} ${req.path}`;
      
      let cleanupDone = false;
      
      const cleanup = () => {
        if (!cleanupDone) {
          cleanupDone = true;
          
          // Force garbage collection if available (development only)
          if (process.env.NODE_ENV === 'development' && global.gc) {
            global.gc();
          }
          
          const endTime = Date.now();
          const finalMemory = process.memoryUsage();
          const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;
          const memoryDeltaMB = memoryDelta / 1024 / 1024;
          
          // Enhanced memory thresholds
          if (memoryDelta > 20 * 1024 * 1024) { // > 20MB increase - CRITICAL
            console.error(`🚨 CRITICAL memory usage in ${operationName}: ${memoryDeltaMB.toFixed(2)}MB in ${endTime - startTime}ms`);
            this.triggerAlert({
              type: 'memory_spike',
              severity: 'critical',
              message: `Critical memory usage in request ${operationName}: ${memoryDeltaMB.toFixed(2)}MB`,
              metrics: this.captureMemoryMetrics(),
              timestamp: Date.now()
            });
          } else if (memoryDelta > 10 * 1024 * 1024) { // > 10MB increase - WARNING
            console.warn(`⚠️  High memory usage in ${operationName}: ${memoryDeltaMB.toFixed(2)}MB in ${endTime - startTime}ms`);
          } else if (memoryDelta > 5 * 1024 * 1024) { // > 5MB increase - NOTICE
            console.log(`📊 Memory notice for ${operationName}: ${memoryDeltaMB.toFixed(2)}MB in ${endTime - startTime}ms`);
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
}

// Export singleton instance
export const memoryLeakMonitor = new MemoryLeakMonitor();

console.log('🔍 Memory Leak Monitor initialized - Active monitoring for production leak detection');
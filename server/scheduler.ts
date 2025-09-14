import { storage } from "./storage";
import { log } from "./vite";

interface SchedulerConfig {
  refreshIntervalHours: number;
  retryAttempts: number;
  retryDelayMs: number;
  enabled: boolean;
}

interface SchedulerStatus {
  isRunning: boolean;
  nextRefreshAt?: Date;
  lastRefreshAt?: Date;
  lastRefreshSuccess?: boolean;
  lastRefreshError?: string;
  totalRefreshes: number;
  totalErrors: number;
  config: SchedulerConfig;
}

class FxRateScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: SchedulerConfig;
  private status: SchedulerStatus;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      refreshIntervalHours: parseFloat(process.env.FX_REFRESH_INTERVAL_HOURS || '6'),
      retryAttempts: parseInt(process.env.FX_RETRY_ATTEMPTS || '3'),
      retryDelayMs: parseInt(process.env.FX_RETRY_DELAY_MS || '30000'), // 30 seconds
      enabled: process.env.FX_SCHEDULER_ENABLED !== 'false' // enabled by default
    };

    this.status = {
      isRunning: false,
      totalRefreshes: 0,
      totalErrors: 0,
      config: this.config
    };

    // Validate configuration
    if (this.config.refreshIntervalHours <= 0) {
      log('Warning: FX_REFRESH_INTERVAL_HOURS must be positive, defaulting to 6 hours');
      this.config.refreshIntervalHours = 6;
    }

    if (this.config.retryAttempts < 0) {
      log('Warning: FX_RETRY_ATTEMPTS must be non-negative, defaulting to 3');
      this.config.retryAttempts = 3;
    }

    log(`FX Rate Scheduler initialized - Refresh interval: ${this.config.refreshIntervalHours}h, Retry attempts: ${this.config.retryAttempts}, Enabled: ${this.config.enabled}`);
  }

  /**
   * Start the scheduler
   */
  start(): boolean {
    if (this.isRunning) {
      log('FX Rate Scheduler is already running');
      return false;
    }

    if (!this.config.enabled) {
      log('FX Rate Scheduler is disabled by configuration');
      return false;
    }

    try {
      const intervalMs = this.config.refreshIntervalHours * 60 * 60 * 1000; // Convert hours to milliseconds
      
      this.intervalId = setInterval(async () => {
        await this.performScheduledRefresh();
      }, intervalMs);

      this.isRunning = true;
      this.status.isRunning = true;
      this.status.nextRefreshAt = new Date(Date.now() + intervalMs);
      
      log(`FX Rate Scheduler started - Next refresh in ${this.config.refreshIntervalHours} hours (${this.status.nextRefreshAt.toISOString()})`);

      // Perform initial refresh after a short delay to avoid startup conflicts
      setTimeout(async () => {
        log('Performing initial FX rate refresh...');
        await this.performScheduledRefresh();
      }, 5000); // 5 second delay

      return true;
    } catch (error) {
      log(`Failed to start FX Rate Scheduler: ${error}`);
      return false;
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): boolean {
    if (!this.isRunning) {
      log('FX Rate Scheduler is not running');
      return false;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.status.isRunning = false;
    this.status.nextRefreshAt = undefined;
    
    log('FX Rate Scheduler stopped');
    return true;
  }

  /**
   * Get current scheduler status
   */
  getStatus(): SchedulerStatus {
    return { ...this.status };
  }

  /**
   * Update scheduler configuration and restart if running
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): boolean {
    try {
      const wasRunning = this.isRunning;
      
      if (wasRunning) {
        this.stop();
      }

      // Update configuration
      this.config = { ...this.config, ...newConfig };
      this.status.config = this.config;
      
      log(`FX Rate Scheduler configuration updated: ${JSON.stringify(newConfig)}`);

      if (wasRunning && this.config.enabled) {
        return this.start();
      }

      return true;
    } catch (error) {
      log(`Failed to update FX Rate Scheduler configuration: ${error}`);
      return false;
    }
  }

  /**
   * Trigger an immediate refresh (for testing or manual triggering)
   */
  async triggerImmediateRefresh(): Promise<boolean> {
    log('Triggering immediate FX rate refresh...');
    return await this.performScheduledRefresh();
  }

  /**
   * Perform the scheduled refresh with retry logic
   */
  private async performScheduledRefresh(): Promise<boolean> {
    const startTime = Date.now();
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= this.config.retryAttempts + 1; attempt++) {
      try {
        log(`FX rate refresh attempt ${attempt}/${this.config.retryAttempts + 1}`);
        
        const result = await storage.refreshFxRates();
        const duration = Date.now() - startTime;
        
        // Update status on success
        this.status.lastRefreshAt = new Date();
        this.status.lastRefreshSuccess = true;
        this.status.lastRefreshError = undefined;
        this.status.totalRefreshes++;
        
        // Update next refresh time
        if (this.isRunning && this.intervalId) {
          const intervalMs = this.config.refreshIntervalHours * 60 * 60 * 1000;
          this.status.nextRefreshAt = new Date(Date.now() + intervalMs);
        }

        log(`FX rate refresh completed successfully in ${duration}ms - Updated ${result.length} rates. Next refresh: ${this.status.nextRefreshAt?.toISOString() || 'N/A'}`);
        
        return true;

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        log(`FX rate refresh attempt ${attempt} failed: ${lastError}`);

        // If this is not the last attempt, wait before retrying
        if (attempt <= this.config.retryAttempts) {
          log(`Retrying in ${this.config.retryDelayMs / 1000} seconds...`);
          await this.delay(this.config.retryDelayMs);
        }
      }
    }

    // All attempts failed
    const duration = Date.now() - startTime;
    this.status.lastRefreshAt = new Date();
    this.status.lastRefreshSuccess = false;
    this.status.lastRefreshError = lastError;
    this.status.totalErrors++;

    log(`FX rate refresh failed after ${this.config.retryAttempts + 1} attempts in ${duration}ms. Error: ${lastError}`);
    
    return false;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get scheduler statistics for monitoring
   */
  getStatistics(): {
    uptime: string;
    successRate: string;
    avgRefreshInterval: string;
    nextRefresh: string;
    isHealthy: boolean;
  } {
    const successRate = this.status.totalRefreshes > 0 
      ? ((this.status.totalRefreshes - this.status.totalErrors) / this.status.totalRefreshes * 100).toFixed(1)
      : 'N/A';

    const isHealthy = this.config.enabled && this.isRunning && 
      (this.status.totalRefreshes === 0 || this.status.lastRefreshSuccess !== false);

    return {
      uptime: this.isRunning ? 'Running' : 'Stopped',
      successRate: `${successRate}%`,
      avgRefreshInterval: `${this.config.refreshIntervalHours}h`,
      nextRefresh: this.status.nextRefreshAt?.toISOString() || 'N/A',
      isHealthy
    };
  }
}

// Create and export singleton instance
export const fxRateScheduler = new FxRateScheduler();
// Quotations Query Pre-warmer
// Eliminates cold start delays by warming up common query patterns on startup

import { getStorage } from './storage';
import { advancedCache } from './advanced-cache-system';

export class QuotationsPrewarmer {
  private static instance: QuotationsPrewarmer;
  private isWarmedUp = false;
  private warmupPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): QuotationsPrewarmer {
    if (!QuotationsPrewarmer.instance) {
      QuotationsPrewarmer.instance = new QuotationsPrewarmer();
    }
    return QuotationsPrewarmer.instance;
  }

  async warmupQuotationsQueries(): Promise<void> {
    // Prevent multiple simultaneous warmups
    if (this.warmupPromise) {
      return this.warmupPromise;
    }

    if (this.isWarmedUp) {
      console.log('🔥 [Quotations Prewarmer] Already warmed up');
      return;
    }

    this.warmupPromise = this._performWarmup();
    await this.warmupPromise;
    this.isWarmedUp = true;
    this.warmupPromise = null;
  }

  private async _performWarmup(): Promise<void> {
    const startTime = Date.now();
    console.log('🔥 [Quotations Prewarmer] Starting query warmup to eliminate cold start delays...');

    try {
      const storage = await getStorage();

      // Common query patterns to pre-warm (most frequently accessed)
      const warmupPatterns = [
        { limit: 100, status: undefined, description: 'Default query (all quotations)' },
        { limit: 10, status: undefined, description: 'Limited results' },
        { limit: 100, status: 'draft', description: 'Draft quotations' },
        { limit: 100, status: 'sent', description: 'Sent quotations' },
        { limit: 20, status: 'draft', description: 'Recent drafts' },
        { limit: 50, status: 'sent', description: 'Recent sent' },
      ];

      const warmupResults = await Promise.allSettled(
        warmupPatterns.map(async (pattern) => {
          const patternStartTime = Date.now();
          
          try {
            // Execute the query to populate cache
            await storage.getQuotations(pattern.limit, pattern.status, 0);
            
            const duration = Date.now() - patternStartTime;
            console.log(`  ✅ [Warmup] ${pattern.description}: ${duration}ms`);
            
            return { pattern, duration, success: true };
          } catch (error) {
            console.warn(`  ⚠️ [Warmup] ${pattern.description} failed:`, error);
            return { pattern, duration: 0, success: false, error };
          }
        })
      );

      // Calculate warmup statistics
      const successful = warmupResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = warmupResults.length - successful;
      const totalTime = Date.now() - startTime;
      
      console.log('🔥 [Quotations Prewarmer] Warmup completed:');
      console.log(`   ✅ Successfully warmed: ${successful}/${warmupResults.length} patterns`);
      console.log(`   ❌ Failed: ${failed}/${warmupResults.length} patterns`);
      console.log(`   ⏱️ Total warmup time: ${totalTime}ms`);
      
      if (successful > 0) {
        console.log('   🚀 Cold start delays eliminated - subsequent queries will be fast!');
      }

      // Warm up connection pool as well
      await this._warmupConnectionPool();

    } catch (error) {
      console.error('❌ [Quotations Prewarmer] Warmup failed:', error);
      throw error;
    }
  }

  private async _warmupConnectionPool(): Promise<void> {
    console.log('🔌 [Quotations Prewarmer] Warming up database connection pool...');
    
    try {
      const storage = await getStorage();
      // Execute a simple query to ensure connections are established
      await storage.getUsers(undefined, 1, 0);
      console.log('   ✅ Connection pool warmed up');
    } catch (error) {
      console.warn('   ⚠️ Connection pool warmup failed:', error);
    }
  }

  // Method to check if warmup is complete
  isPrewarmed(): boolean {
    return this.isWarmedUp;
  }

  // Method to get warmup status
  getWarmupStatus(): { isWarmedUp: boolean; isInProgress: boolean } {
    return {
      isWarmedUp: this.isWarmedUp,
      isInProgress: this.warmupPromise !== null
    };
  }

  // Reset warmup state (useful for testing)
  reset(): void {
    this.isWarmedUp = false;
    this.warmupPromise = null;
  }
}

// Export singleton instance
export const quotationsPrewarmer = QuotationsPrewarmer.getInstance();
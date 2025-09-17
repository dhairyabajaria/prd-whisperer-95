/**
 * Central Shutdown Orchestrator
 * 
 * Coordinates safe shutdown across all application systems without breaking
 * other modules' signal handlers. Uses process.once() with global flags
 * to prevent handler conflicts and ensure data integrity.
 * 
 * CRITICAL: This replaces unsafe process.removeAllListeners() pattern
 */

export interface ShutdownHandler {
  name: string;
  priority: number; // Lower numbers shut down first
  shutdown: () => Promise<void>;
}

// ===============================
// GLOBAL SHUTDOWN ORCHESTRATOR
// ===============================

class SafeShutdownOrchestrator {
  private handlers: Map<string, ShutdownHandler> = new Map();
  private isShuttingDown = false;
  private shutdownComplete = false;

  /**
   * Register a shutdown handler with priority
   * Safe to call multiple times - will not duplicate handlers
   */
  register(handler: ShutdownHandler): void {
    if (this.isShuttingDown) {
      console.warn(`⚠️  [Shutdown] Cannot register ${handler.name} - shutdown in progress`);
      return;
    }

    this.handlers.set(handler.name, handler);
    console.log(`📋 [Shutdown] Registered handler: ${handler.name} (priority: ${handler.priority})`);
  }

  /**
   * Unregister a shutdown handler
   */
  unregister(name: string): void {
    if (this.handlers.delete(name)) {
      console.log(`🗑️  [Shutdown] Unregistered handler: ${name}`);
    }
  }

  /**
   * Execute coordinated shutdown of all registered handlers
   */
  async executeShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.log(`⏳ [Shutdown] Already in progress for ${signal}`);
      return;
    }

    this.isShuttingDown = true;
    console.log(`🔄 [Shutdown] Starting coordinated shutdown for ${signal}`);
    const startTime = Date.now();

    try {
      // Sort handlers by priority (lower numbers first)
      const sortedHandlers = Array.from(this.handlers.values())
        .sort((a, b) => a.priority - b.priority);

      console.log(`📋 [Shutdown] Executing ${sortedHandlers.length} handlers in priority order:`);
      sortedHandlers.forEach(h => console.log(`   ${h.priority}: ${h.name}`));

      // Execute shutdowns sequentially by priority
      for (const handler of sortedHandlers) {
        try {
          const handlerStart = Date.now();
          console.log(`🔄 [Shutdown] Stopping ${handler.name}...`);
          
          await Promise.race([
            handler.shutdown(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Timeout after 5s`)), 5000)
            )
          ]);
          
          const handlerTime = Date.now() - handlerStart;
          console.log(`✅ [Shutdown] ${handler.name} stopped (${handlerTime}ms)`);
        } catch (error) {
          console.error(`❌ [Shutdown] ${handler.name} failed:`, error);
          // Continue with other handlers even if one fails
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`🎉 [Shutdown] Coordinated shutdown completed (${totalTime}ms)`);
      this.shutdownComplete = true;

    } catch (error) {
      console.error('❌ [Shutdown] Critical error during shutdown:', error);
    } finally {
      // Exit gracefully after all handlers complete
      const exitCode = this.shutdownComplete ? 0 : 1;
      console.log(`👋 [Shutdown] Exiting with code ${exitCode}`);
      process.exit(exitCode);
    }
  }

  /**
   * Get current shutdown status
   */
  getStatus(): {
    isShuttingDown: boolean;
    shutdownComplete: boolean;
    registeredHandlers: string[];
  } {
    return {
      isShuttingDown: this.isShuttingDown,
      shutdownComplete: this.shutdownComplete,
      registeredHandlers: Array.from(this.handlers.keys())
    };
  }
}

// Global singleton instance
const shutdownOrchestrator = new SafeShutdownOrchestrator();

// ===============================
// SAFE SIGNAL HANDLER REGISTRATION
// ===============================

/**
 * Safely register global process signal handlers
 * Uses process.once() and global flags to prevent conflicts
 */
function initializeGlobalShutdownHandlers(): void {
  // Use global flag to prevent duplicate registration
  if (globalThis.__appShutdownRegistered) {
    return;
  }

  console.log('🛡️  [Shutdown] Registering safe global signal handlers');

  // Register handlers using process.once() to prevent conflicts
  process.once('SIGTERM', () => {
    shutdownOrchestrator.executeShutdown('SIGTERM').catch(error => {
      console.error('❌ [Shutdown] SIGTERM handler failed:', error);
      process.exit(1);
    });
  });

  process.once('SIGINT', () => {
    shutdownOrchestrator.executeShutdown('SIGINT').catch(error => {
      console.error('❌ [Shutdown] SIGINT handler failed:', error);
      process.exit(1);
    });
  });

  process.once('beforeExit', () => {
    if (!shutdownOrchestrator.getStatus().isShuttingDown) {
      shutdownOrchestrator.executeShutdown('beforeExit').catch(error => {
        console.error('❌ [Shutdown] beforeExit handler failed:', error);
      });
    }
  });

  // Handle uncaught exceptions gracefully
  process.once('uncaughtException', (error) => {
    console.error('❌ [Shutdown] Uncaught exception:', error);
    shutdownOrchestrator.executeShutdown('uncaughtException').catch(() => {
      process.exit(1);
    });
  });

  process.once('unhandledRejection', (reason, promise) => {
    console.error('❌ [Shutdown] Unhandled rejection at:', promise, 'reason:', reason);
    shutdownOrchestrator.executeShutdown('unhandledRejection').catch(() => {
      process.exit(1);
    });
  });

  // Set global flag to prevent duplicate registration
  globalThis.__appShutdownRegistered = true;
  console.log('✅ [Shutdown] Global signal handlers registered successfully');
}

// ===============================
// PUBLIC API
// ===============================

/**
 * Register a shutdown handler with the orchestrator
 */
export function registerShutdownHandler(handler: ShutdownHandler): void {
  shutdownOrchestrator.register(handler);
  
  // Initialize global handlers on first registration
  initializeGlobalShutdownHandlers();
}

/**
 * Unregister a shutdown handler
 */
export function unregisterShutdownHandler(name: string): void {
  shutdownOrchestrator.unregister(name);
}

/**
 * Get shutdown orchestrator status
 */
export function getShutdownStatus(): ReturnType<SafeShutdownOrchestrator['getStatus']> {
  return shutdownOrchestrator.getStatus();
}

/**
 * Force shutdown (for emergency use)
 */
export function forceShutdown(reason: string = 'manual'): void {
  console.warn(`⚠️  [Shutdown] Force shutdown requested: ${reason}`);
  shutdownOrchestrator.executeShutdown(`force_${reason}`).catch(error => {
    console.error('❌ [Shutdown] Force shutdown failed:', error);
    process.exit(1);
  });
}

// Extend global type for TypeScript
declare global {
  var __appShutdownRegistered: boolean;
}

export default shutdownOrchestrator;
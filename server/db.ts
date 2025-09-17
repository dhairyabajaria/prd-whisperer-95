import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
// getDatabaseUrlAsync removed - now using direct process.env.DATABASE_URL per integration
import { optimizedPoolConfig } from "../critical-cache-implementation";

neonConfig.webSocketConstructor = ws;

// Initialize variables first
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let shutdownHandlersRegistered = false;

async function initializeDatabase(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 [DB] Starting enhanced database initialization (attempt ${attempt}/${maxRetries})...`);
        
        // Enhanced DATABASE_URL access with fallback strategies for Replit
        let databaseUrl = process.env.DATABASE_URL;
        
        console.log('🔍 [DB] Initial DATABASE_URL analysis:', {
          exists: 'DATABASE_URL' in process.env,
          hasValue: !!(databaseUrl && databaseUrl.trim().length > 0),
          length: databaseUrl ? databaseUrl.length : 0,
          isEmpty: databaseUrl === ''
        });
        
        // If DATABASE_URL is empty, try to construct from PG components
        if (!databaseUrl || databaseUrl.trim() === '') {
          console.log('🔧 [DB] DATABASE_URL empty, constructing from PG components...');
          const { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
          
          if (PGHOST && PGPORT && PGDATABASE && PGUSER && PGPASSWORD &&
              PGHOST.trim() && PGPORT.trim() && PGDATABASE.trim() && PGUSER.trim() && PGPASSWORD.trim()) {
            databaseUrl = `postgresql://${PGUSER.trim()}:${PGPASSWORD.trim()}@${PGHOST.trim()}:${PGPORT.trim()}/${PGDATABASE.trim()}?sslmode=require`;
            console.log('✅ [DB] Successfully constructed DATABASE_URL from PG components');
          }
        }
        
        if (!databaseUrl || databaseUrl.trim() === '') {
          throw new Error('DATABASE_URL must be set. Check Replit database provisioning and secrets configuration.');
        }
        
        console.log('🚀 [DB] Creating optimized database connection with enhanced pool config...');
        const poolConfig = {
          connectionString: databaseUrl,
          ...optimizedPoolConfig,
          // Neon-specific optimizations for better connection handling
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
          // Enhanced error handling
          acquireTimeoutMillis: optimizedPoolConfig.acquireTimeoutMillis || 15000,
          // Better connection management
          allowExitOnIdle: false,
          // Connection validation
          idleTimeoutMillis: optimizedPoolConfig.idleTimeoutMillis || 60000
        };
        
        console.log(`[DB Pool] Configured with max=${optimizedPoolConfig.max}, min=${optimizedPoolConfig.min} connections`);
        const newPool = new Pool(poolConfig);
        
        // Enhanced connection event monitoring
        newPool.on('connect', (client) => {
          console.log('🔗 [DB Pool] New client connected to pool');
        });
        
        newPool.on('error', (err, client) => {
          console.error('❌ [DB Pool] Unexpected error on idle client:', err);
        });
        
        newPool.on('acquire', () => {
          console.log('🎯 [DB Pool] Client acquired from pool');
        });
        
        // Note: 'release' event not supported by neon pool, removing to fix LSP error
        
        // Create the drizzle instance
        const newDb = drizzle({ client: newPool, schema });
        
        // Enhanced connection testing with retry logic
        console.log('🧪 [DB] Testing database connection with enhanced validation...');
        
        // Test basic connectivity
        await newPool.query('SELECT 1 as test');
        
        // Test schema access
        await newPool.query('SELECT tablename FROM pg_tables WHERE schemaname = $1 LIMIT 1', ['public']);
        
        // Test connection pool health
        await testConnectionPoolHealth(newPool);
        
        console.log('✅ [DB] Database connection test successful!');
        
        // Set globals after successful test
        pool = newPool;
        db = newDb;
        isInitialized = true;
        
        // Register shutdown handlers only once
        if (!shutdownHandlersRegistered) {
          registerShutdownHandlers();
          shutdownHandlersRegistered = true;
        }
        
        // Start connection pool monitoring
        startConnectionPoolMonitoring();
        
        console.log('🎉 [DB] Database initialization completed successfully!');
        return; // Success - exit retry loop
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ [DB] Database initialization failed (attempt ${attempt}/${maxRetries}):`, error);
        
        // Clean up on failure
        if (pool) {
          try {
            await pool.end();
          } catch (cleanupError) {
            console.error('❌ [DB] Error cleaning up pool:', cleanupError);
          }
          pool = null;
          db = null;
          isInitialized = false;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`⏳ [DB] Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    // All retries exhausted
    console.error('💥 [DB] All database initialization attempts failed. Last error:', lastError);
    
    // Reset initialization promise to allow future retry
    initializationPromise = null;
    
    throw lastError || new Error('Database initialization failed after all retries');
  })();

  return initializationPromise;
}

// Connection pool health testing function
async function testConnectionPoolHealth(testPool: Pool): Promise<void> {
  console.log('🔍 [DB] Testing connection pool health...');
  
  try {
    // Test multiple concurrent connections
    const promises = Array.from({ length: 5 }, (_, i) => 
      testPool.query(`SELECT ${i + 1} as connection_test`)
    );
    
    const results = await Promise.all(promises);
    console.log(`✅ [DB] Connection pool health test passed: ${results.length} concurrent queries successful`);
    
  } catch (error) {
    console.error('❌ [DB] Connection pool health test failed:', error);
    throw error;
  }
}

// MEMORY LEAK FIX: Connection pool monitoring with proper cleanup
let poolMonitoringInterval: NodeJS.Timeout | null = null;

function startConnectionPoolMonitoring(): void {
  console.log('📊 [DB] Starting connection pool monitoring...');
  
  // Clear any existing interval to prevent multiple timers
  if (poolMonitoringInterval) {
    clearInterval(poolMonitoringInterval);
    poolMonitoringInterval = null;
  }
  
  poolMonitoringInterval = setInterval(() => {
    if (pool) {
      const totalCount = pool.totalCount;
      const idleCount = pool.idleCount;
      const waitingCount = pool.waitingCount;
      
      console.log(`📊 [DB Pool Status] Total: ${totalCount}, Idle: ${idleCount}, Waiting: ${waitingCount}`);
      
      // Alert on potential issues
      if (waitingCount > 10) {
        console.warn(`⚠️  [DB Pool] High waiting queue detected: ${waitingCount} waiting connections`);
      }
      
      if (totalCount >= optimizedPoolConfig.max * 0.9) {
        console.warn(`⚠️  [DB Pool] Near connection limit: ${totalCount}/${optimizedPoolConfig.max} connections used`);
      }
    } else {
      // Pool no longer exists, stop monitoring
      console.log('📊 [DB] Pool no longer exists, stopping monitoring');
      stopConnectionPoolMonitoring();
    }
  }, 30000); // Monitor every 30 seconds
}

// MEMORY LEAK FIX: Function to stop monitoring and clear timer
function stopConnectionPoolMonitoring(): void {
  if (poolMonitoringInterval) {
    clearInterval(poolMonitoringInterval);
    poolMonitoringInterval = null;
    console.log('📊 [DB] Connection pool monitoring stopped');
  }
}

// TEMPORARILY DISABLED: Complex database initialization causing startup failures
// Will re-enable after basic connectivity is working
// 
// // Start async database initialization
// console.log('🔧 [DB] Starting enhanced database initialization...');
// 
// // Start initialization immediately (async)
// initializeDatabase()
//   .then(() => {
//     console.log('🎊 [DB] Database initialization completed successfully!');
//   })
//   .catch((error) => {
//     console.error('💥 [DB] Database initialization failed completely:', error);
//   });

// MEMORY LEAK FIX: Enhanced shutdown function with timer cleanup
async function shutdownDatabase(): Promise<void> {
  console.log('🔄 [DB] Starting database shutdown sequence...');
  
  // CRITICAL: Stop monitoring timer first to prevent memory leaks
  stopConnectionPoolMonitoring();
  
  if (pool) {
    console.log('🔄 [DB] Shutting down database connection pool...');
    try {
      // Wait for active connections to finish
      const activeConnections = pool.totalCount;
      if (activeConnections > 0) {
        console.log(`🔄 [DB] Waiting for ${activeConnections} active connections to close...`);
        // Give connections 5 seconds to close gracefully
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      await pool.end();
      console.log('✅ [DB] Database connection pool closed successfully');
    } catch (error) {
      console.error('❌ [DB] Error closing database pool:', error);
      // Force close connections if graceful shutdown fails
      try {
        await pool.end({ force: true } as any);
        console.log('✅ [DB] Database connection pool force closed');
      } catch (forceError) {
        console.error('❌ [DB] Error force closing database pool:', forceError);
      }
    }
    pool = null;
    db = null;
    isInitialized = false;
    initializationPromise = null;
  }
  
  console.log('✅ [DB] Database shutdown sequence completed');
}

// Register shutdown handlers to prevent connection leaks
function registerShutdownHandlers(): void {
  // Import the safe shutdown orchestrator
  import('./shutdown-orchestrator').then(({ registerShutdownHandler }) => {
    registerShutdownHandler({
      name: 'database',
      priority: 50, // Database should shut down last to ensure data integrity
      shutdown: async () => {
        console.log('🔄 [DB] Shutting down database from orchestrator...');
        await shutdownDatabase();
      }
    });
  }).catch(error => {
    console.error('❌ [DB] Failed to register shutdown handler:', error);
  });
}

export { pool, db, shutdownDatabase };

// For backward compatibility with existing code
export async function getDb() {
  // If already initialized, return immediately
  if (isInitialized && db) {
    return db;
  }
  
  // If not initialized, wait for initialization to complete
  if (initializationPromise) {
    try {
      await initializationPromise;
      if (db) {
        return db;
      }
    } catch (error) {
      console.error('Database initialization failed during getDb():', error);
      // Reset promise to allow retry after failure
      initializationPromise = null;
    }
  }
  
  // Try to initialize if not already attempted
  if (!initializationPromise) {
    try {
      await initializeDatabase();
      if (db) {
        return db;
      }
    } catch (error) {
      console.error('Database initialization failed during getDb() retry:', error);
    }
  }
  
  throw new Error("Database connection not available. Check DATABASE_URL and initialization logs.");
}
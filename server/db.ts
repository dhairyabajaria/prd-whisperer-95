import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { getDatabaseUrlAsync } from "./secretLoader";
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
    try {
      console.log('🚀 [DB] Starting enhanced database initialization...');
      
      // Use the working getDatabaseUrlAsync from secretLoader.ts
      const databaseUrl = await getDatabaseUrlAsync();
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL could not be obtained from any source. Please check your database configuration.');
      }
      
      console.log('🚀 [DB] Creating optimized database connection with enhanced pool config...');
      const poolConfig = {
        connectionString: databaseUrl,
        ...optimizedPoolConfig,
        // Neon-specific optimizations
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
      };
      
      console.log(`[DB Pool] Configured with max=${optimizedPoolConfig.max}, min=${optimizedPoolConfig.min} connections`);
      const newPool = new Pool(poolConfig);
      const newDb = drizzle({ client: newPool, schema });
      
      // Test the connection
      console.log('🧪 [DB] Testing database connection...');
      await newPool.query('SELECT 1 as test');
      
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
      
      console.log('🎉 [DB] Database initialization completed successfully!');
      
    } catch (error) {
      console.error('❌ [DB] Database initialization failed:', error);
      
      // Clean up on failure and reset initialization promise
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
      
      // Reset initialization promise to allow retry
      initializationPromise = null;
      
      throw error;
    }
  })();

  return initializationPromise;
}

// Start async database initialization
console.log('🔧 [DB] Starting enhanced database initialization...');

// Start initialization immediately (async)
initializeDatabase()
  .then(() => {
    console.log('🎊 [DB] Database initialization completed successfully!');
  })
  .catch((error) => {
    console.error('💥 [DB] Database initialization failed completely:', error);
  });

// Proper shutdown function
async function shutdownDatabase(): Promise<void> {
  if (pool) {
    console.log('🔄 [DB] Shutting down database connection pool...');
    try {
      await pool.end();
      console.log('✅ [DB] Database connection pool closed successfully');
    } catch (error) {
      console.error('❌ [DB] Error closing database pool:', error);
    }
    pool = null;
    db = null;
    isInitialized = false;
    initializationPromise = null;
  }
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
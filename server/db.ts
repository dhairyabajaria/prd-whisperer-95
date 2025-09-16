import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { getDatabaseUrlAsync, debugSecretSources } from "./secretLoader";

neonConfig.webSocketConstructor = ws;

// Initialize variables first
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

async function initializeDatabase(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('🚀 [DB] Starting enhanced database initialization...');
      
      // Debug secret sources for troubleshooting
      debugSecretSources();
      
      // Get DATABASE_URL using robust secret loading
      const databaseUrl = await getDatabaseUrlAsync();
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL could not be obtained after trying all methods');
      }
      
      console.log('🚀 [DB] Creating database connection...');
      const newPool = new Pool({ connectionString: databaseUrl });
      const newDb = drizzle({ client: newPool, schema });
      
      // Test the connection
      console.log('🧪 [DB] Testing database connection...');
      await newPool.query('SELECT 1 as test');
      
      console.log('✅ [DB] Database connection test successful!');
      
      // Set globals after successful test
      pool = newPool;
      db = newDb;
      isInitialized = true;
      
      console.log('🎉 [DB] Database initialization completed successfully!');
      
    } catch (error) {
      console.error('❌ [DB] Database initialization failed:', error);
      
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
      
      throw error;
    }
  })();

  return initializationPromise;
}

// Start async database initialization
console.log('🔧 [DB] Starting enhanced database initialization with retry logic...');

// Start initialization immediately (async)
initializeDatabase()
  .then(() => {
    console.log('🎊 [DB] Database initialization completed successfully!');
  })
  .catch((error) => {
    console.error('💥 [DB] Database initialization failed completely:', error);
  });

export { pool, db };

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
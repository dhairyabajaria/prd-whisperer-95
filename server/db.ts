import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Initialize variables first
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Enhanced secret loading that tries multiple approaches
 * @param key The secret key to load
 * @returns The secret value or null if not found
 */
async function loadSecret(key: string): Promise<string | null> {
  // First try direct process.env access
  const envValue = process.env[key];
  if (envValue && envValue.trim().length > 0) {
    return envValue.trim();
  }
  
  // Try to read from Replit's secret file system if it exists
  try {
    const { readFileSync, existsSync } = require('fs');
    const secretPath = `/tmp/replitdb/${key}`;
    if (existsSync(secretPath)) {
      const secretValue = readFileSync(secretPath, 'utf8').trim();
      if (secretValue && secretValue.length > 0) {
        console.log(`✅ [DB] Found ${key} in replitdb`);
        return secretValue;
      }
    }
  } catch (error) {
    // Ignore file reading errors
  }
  
  // Try reading environment files that might contain secrets
  try {
    const { readFileSync, existsSync } = require('fs');
    const envFile = '.env';
    if (existsSync(envFile)) {
      const envContent = readFileSync(envFile, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const [envKey, ...valueParts] = line.split('=');
        if (envKey?.trim() === key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          if (value && value.length > 0) {
            console.log(`✅ [DB] Found ${key} in .env file`);
            return value;
          }
        }
      }
    }
  } catch (error) {
    // Ignore file reading errors
  }
  
  return null;
}

async function initializeDatabase(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('🚀 [DB] Starting enhanced database initialization...');
      
      // Try to get DATABASE_URL from multiple sources
      let databaseUrl = await loadSecret('DATABASE_URL');
      
      // If direct DATABASE_URL not found, try to construct from PG components
      if (!databaseUrl) {
        console.log('🔧 [DB] DATABASE_URL not found, trying to construct from PG components...');
        const [pgHost, pgPort, pgDatabase, pgUser, pgPassword] = await Promise.all([
          loadSecret('PGHOST'),
          loadSecret('PGPORT'),  
          loadSecret('PGDATABASE'),
          loadSecret('PGUSER'),
          loadSecret('PGPASSWORD')
        ]);
        
        if (pgHost && pgPort && pgDatabase && pgUser && pgPassword) {
          databaseUrl = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=require`;
          console.log('✅ [DB] Successfully constructed DATABASE_URL from components');
        }
      }
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL could not be obtained from any source. Please check your database configuration.');
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
console.log('🔧 [DB] Starting enhanced database initialization...');

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
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

// Async retry-based secret loading for Replit environment
async function getReplitSecretAsync(
  key: string, 
  maxRetries = 5, 
  delayMs = 1000
): Promise<string | undefined> {
  console.log(`🔍 [DB] Attempting to load secret: ${key}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const value = process.env[key];
    
    if (value && value.trim().length > 0) {
      console.log(`✅ [DB] Found ${key} on attempt ${attempt} (${value.length} chars)`);
      return value.trim();
    }
    
    console.log(`⏳ [DB] Attempt ${attempt}/${maxRetries}: ${key} empty or missing, waiting ${delayMs}ms...`);
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      // Exponential backoff
      delayMs = Math.min(delayMs * 1.5, 5000);
    }
  }
  
  console.log(`❌ [DB] Failed to load secret ${key} after ${maxRetries} attempts`);
  return undefined;
}

// Enhanced DATABASE_URL construction with retry logic
async function getDatabaseUrlAsync(): Promise<string | undefined> {
  console.log('🔍 [DB] Attempting to get DATABASE_URL...');
  
  // First try direct access with retries
  let databaseUrl = await getReplitSecretAsync('DATABASE_URL');
  
  if (databaseUrl) {
    return databaseUrl;
  }
  
  // Fallback: try to construct from PG components
  console.log('🔧 [DB] Trying to construct DATABASE_URL from PG components...');
  
  const [pgHost, pgPort, pgDatabase, pgUser, pgPassword] = await Promise.all([
    getReplitSecretAsync('PGHOST'),
    getReplitSecretAsync('PGPORT'),
    getReplitSecretAsync('PGDATABASE'),
    getReplitSecretAsync('PGUSER'),
    getReplitSecretAsync('PGPASSWORD'),
  ]);
  
  if (pgHost && pgPort && pgDatabase && pgUser && pgPassword) {
    databaseUrl = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=require`;
    console.log(`✅ [DB] Constructed DATABASE_URL from components`);
    return databaseUrl;
  }
  
  console.log('❌ [DB] Unable to get DATABASE_URL via any method');
  return undefined;
}

async function initializeDatabase(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('🚀 [DB] Starting database initialization...');
      
      // Get DATABASE_URL using async retry logic
      const databaseUrl = await getDatabaseUrlAsync();
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL could not be obtained after retries');
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
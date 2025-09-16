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

function initializeDatabase(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise<void>((resolve, reject) => {
    try {
      console.log('🚀 Creating database connection...');
      
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
        throw new Error('DATABASE_URL is not set or empty');
      }

      const newPool = new Pool({ connectionString: process.env.DATABASE_URL });
      const newDb = drizzle({ client: newPool, schema });
      
      // Test the connection before setting the globals
      newPool.query('SELECT 1 as test').then(() => {
        console.log('✅ Database connection test successful!');
        // Only set globals after successful test
        pool = newPool;
        db = newDb;
        isInitialized = true;
        resolve();
      }).catch((error) => {
        console.error('❌ Database connection test failed:', error);
        // Clean up the failed connection
        newPool.end().catch(() => {});
        reject(error);
      });
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      reject(error);
    }
  });

  return initializationPromise;
}

// Simple database connection as per Replit integration blueprint
console.log('🔧 Database initialization starting...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
  console.error('❌ DATABASE_URL must be set. Did you forget to provision a database?');
  console.log('Available DATABASE env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
  
  // Try a short delay and check again (for Replit timing issues)
  setTimeout(() => {
    console.log('🔄 Retrying DATABASE_URL after delay...');
    console.log('DATABASE_URL after delay:', !!process.env.DATABASE_URL, process.env.DATABASE_URL?.length || 0);
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
      console.log('✅ DATABASE_URL now available, reinitializing...');
      initializeDatabase().catch((error) => {
        console.error('❌ Delayed database initialization failed:', error);
      });
    }
  }, 2000);
} else {
  initializeDatabase().catch((error) => {
    console.error('❌ Initial database initialization failed:', error);
  });
}

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
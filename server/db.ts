import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Allow application to start even without DATABASE_URL for debugging
const isDevelopment = process.env.NODE_ENV === 'development';
let db: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

// Replit-specific function to access secrets at runtime
async function getReplitSecret(key: string): Promise<string | undefined> {
  // Method 1: Direct process.env access
  let value = process.env[key];
  if (value && value.trim() !== '') return value;
  
  // Method 2: Try reading from file system (Replit sometimes stores secrets as files)
  try {
    const fs = require('fs');
    const secretPath = `/tmp/secrets/${key}`;
    if (fs.existsSync(secretPath)) {
      value = fs.readFileSync(secretPath, 'utf8').trim();
      if (value) return value;
    }
  } catch (e) {
    // Ignore file system errors
  }
  
  // Method 3: Check if available but empty, try forcing reload
  if (Object.prototype.hasOwnProperty.call(process.env, key)) {
    // Key exists but might be empty - try accessing in next tick
    await new Promise(resolve => setTimeout(resolve, 100));
    value = process.env[key];
    if (value && value.trim() !== '') return value;
  }
  
  return undefined;
}

// Try to initialize database connection with Replit-specific handling
async function initializeDatabase() {
  try {
    console.log('Database initialization (Replit-aware):');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
    
    let databaseUrl = await getReplitSecret('DATABASE_URL');
    
    // If still not found, try constructing from PG components
    if (!databaseUrl) {
      console.log('DATABASE_URL not found, trying PG components...');
      const pgHost = await getReplitSecret('PGHOST');
      const pgPort = await getReplitSecret('PGPORT');
      const pgDatabase = await getReplitSecret('PGDATABASE');
      const pgUser = await getReplitSecret('PGUSER');
      const pgPassword = await getReplitSecret('PGPASSWORD');
      
      console.log('PG components availability:', {
        PGHOST: !!pgHost,
        PGPORT: !!pgPort,
        PGDATABASE: !!pgDatabase,
        PGUSER: !!pgUser,
        PGPASSWORD: !!pgPassword
      });
      
      if (pgHost && pgPort && pgDatabase && pgUser && pgPassword) {
        databaseUrl = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=require`;
        console.log('✅ Constructed DATABASE_URL from PG components');
      }
    }

    if (databaseUrl && databaseUrl.trim() !== '') {
      console.log('✅ Initializing database connection');
      pool = new Pool({ connectionString: databaseUrl });
      db = drizzle({ client: pool, schema });
      console.log('✅ Database connection initialized successfully');
      
      // Test connection
      await db.execute(sql`SELECT 1`);
      console.log('✅ Database connection test successful');
    } else {
      console.log('⚠️ DATABASE_URL not available - database operations will fail at runtime');
      console.log('Available env vars with DATABASE/PG:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PG')));
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('Application will continue without database connection');
  }
}

// Initialize database asynchronously 
initializeDatabase();

export { pool, db };

// For backward compatibility with existing code
export async function getDb() {
  if (!db) {
    throw new Error("DATABASE_URL must be set and valid. Database connection not available.");
  }
  return db;
}
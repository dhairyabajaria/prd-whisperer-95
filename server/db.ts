import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import fs from "fs";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Simplified database connection as per Replit integration blueprint
let db: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

// Helper function to get Replit secrets (similar to storage.ts)
async function getReplitSecret(key: string): Promise<string | undefined> {
  // Method 1: Direct process.env access
  let value = process.env[key];
  if (value && value.trim() !== '') {
    return value;
  }
  
  // Method 2: Check with slight delay (Replit environment loading)
  await new Promise(resolve => setTimeout(resolve, 100));
  value = process.env[key];
  if (value && value.trim() !== '') {
    return value;
  }
  
  // Method 3: File system access for secrets
  try {
    const secretPath = `/tmp/secrets/${key}`;
    if (fs.existsSync(secretPath)) {
      value = fs.readFileSync(secretPath, 'utf8').trim();
      if (value) {
        return value;
      }
    }
  } catch (e) {
    // File system approach not available
  }
  
  return undefined;
}

// Async database initialization
async function initializeDatabase() {
  console.log('🔧 Database initialization:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
  
  // In Replit, DATABASE_URL might be empty but PG components should be available
  // Try direct construction from PG environment variables first
  let databaseUrl = '';
  
  // First attempt: Direct environment variable access
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    databaseUrl = process.env.DATABASE_URL;
    console.log('✅ Found DATABASE_URL via process.env');
  } else {
    console.log('🔍 DATABASE_URL empty, constructing from PG components...');
    
    // Try to construct from PG components
    const pgHost = process.env.PGHOST;
    const pgPort = process.env.PGPORT;
    const pgDatabase = process.env.PGDATABASE;
    const pgUser = process.env.PGUSER;
    const pgPassword = process.env.PGPASSWORD;
    
    console.log('PG Components status:', {
      PGHOST: pgHost ? `${pgHost.substring(0, 10)}...` : 'empty',
      PGPORT: pgPort || 'empty',
      PGDATABASE: pgDatabase || 'empty', 
      PGUSER: pgUser || 'empty',
      PGPASSWORD: pgPassword ? 'set' : 'empty'
    });
    
    if (pgHost && pgPort && pgDatabase && pgUser && pgPassword) {
      databaseUrl = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=require`;
      console.log('✅ Successfully constructed DATABASE_URL from PG components');
    } else {
      // If PG components are also empty, try secret loading with delay
      console.log('⏳ PG components empty, trying async secret loading...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Give more time for env loading
      
      const secretHost = await getReplitSecret('PGHOST');
      const secretPort = await getReplitSecret('PGPORT');
      const secretDatabase = await getReplitSecret('PGDATABASE');
      const secretUser = await getReplitSecret('PGUSER');
      const secretPassword = await getReplitSecret('PGPASSWORD');
      
      if (secretHost && secretPort && secretDatabase && secretUser && secretPassword) {
        databaseUrl = `postgresql://${secretUser}:${secretPassword}@${secretHost}:${secretPort}/${secretDatabase}?sslmode=require`;
        console.log('✅ Successfully constructed DATABASE_URL from secrets');
      }
    }
  }

  if (!databaseUrl) {
    console.error('❌ Unable to construct DATABASE_URL. Database connection failed.');
    console.log('Available env vars with DATABASE/PG:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PG')));
    return;
  }

  try {
    console.log('🚀 Initializing database connection...');
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle({ client: pool, schema });
    
    // Test the connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection initialized and tested successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('Database URL format check:', databaseUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  }
}

// Initialize database connection asynchronously
initializeDatabase();

export { pool, db };

// For backward compatibility with existing code
export async function getDb() {
  if (!db) {
    throw new Error("DATABASE_URL must be set and valid. Database connection not available.");
  }
  return db;
}
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


// Enhanced secret access for database connection (matching storage.ts)
async function getReplitSecret(key: string): Promise<string | undefined> {
  // Try direct process.env access first
  let value = process.env[key];
  if (value && value.trim() !== '') {
    return value;
  }
  
  // Try with progressive delays for Replit environment loading
  for (const delay of [100, 500, 1000, 2000]) {
    await new Promise(resolve => setTimeout(resolve, delay));
    value = process.env[key];
    if (value && value.trim() !== '') {
      console.log(`✅ Found ${key} via delayed access (${delay}ms delay)`);
      return value;
    }
  }
  
  return undefined;
}

// Async database initialization with enhanced secret access
async function initializeDatabase() {
  console.log('🔧 Database initialization:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
  
  let databaseUrl = '';
  
  // Method 1: Direct DATABASE_URL access
  databaseUrl = await getReplitSecret('DATABASE_URL') || '';
  
  // Method 2: Construct from PG components if DATABASE_URL not found
  if (!databaseUrl) {
    console.log('🔍 DATABASE_URL not found, constructing from PG components...');
    
    const pgHost = await getReplitSecret('PGHOST');
    const pgPort = await getReplitSecret('PGPORT');
    const pgDatabase = await getReplitSecret('PGDATABASE');
    const pgUser = await getReplitSecret('PGUSER');
    const pgPassword = await getReplitSecret('PGPASSWORD');
    
    console.log('PG Components retrieved:', {
      PGHOST: pgHost ? `${pgHost.substring(0, 10)}...` : 'empty',
      PGPORT: pgPort || 'empty',
      PGDATABASE: pgDatabase || 'empty', 
      PGUSER: pgUser || 'empty',
      PGPASSWORD: pgPassword ? 'set' : 'empty'
    });
    
    if (pgHost && pgPort && pgDatabase && pgUser && pgPassword) {
      databaseUrl = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=require`;
      console.log('✅ Successfully constructed DATABASE_URL from PG components');
    }
  }

  if (!databaseUrl) {
    console.error('❌ Unable to access DATABASE_URL or construct from components. Database connection failed.');
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
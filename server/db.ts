import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Simplified database connection as per Replit integration blueprint
let db: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

// Initialize database connection
console.log('Database initialization:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL must be set. Did you forget to provision a database?');
  console.log('Available env vars with DATABASE/PG:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PG')));
} else {
  try {
    console.log('✅ Initializing database connection');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('✅ Database connection initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

export { pool, db };

// For backward compatibility with existing code
export async function getDb() {
  if (!db) {
    throw new Error("DATABASE_URL must be set and valid. Database connection not available.");
  }
  return db;
}
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Lazy database initialization with circuit breaker
let dbInstance: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<ReturnType<typeof drizzle>> | null = null;
let lastFailure = 0;
let attempts = 0;
const MAX_ATTEMPTS = 3;
const COOLDOWN_MS = 30000;

export async function getDb() {
  // Return existing instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Check circuit breaker cooldown
  if (attempts >= MAX_ATTEMPTS && Date.now() - lastFailure < COOLDOWN_MS) {
    throw new Error("Database temporarily unavailable; retry later");
  }

  // Try different possible environment variable names for PostgreSQL DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.DB_URL ||
                     process.env.POSTGRES_URL;
  
  // Helper function to safely log database connection info without credentials
  const getSafeDbInfo = (url: string | undefined) => {
    if (!url) return 'not set';
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}${urlObj.pathname}`;
    } catch {
      return 'present but invalid format';
    }
  };
  
  console.log('Available DB env vars:', Object.keys(process.env).filter(key => 
    key.includes('DATABASE') || key.includes('DB') || key.includes('POSTGRES') || key.includes('NEON')
  ));
  console.log('DATABASE_URL:', getSafeDbInfo(process.env.DATABASE_URL));
  console.log('Selected database:', getSafeDbInfo(databaseUrl));
  
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  // Coalesce concurrent callers
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const pool = new Pool({ connectionString: databaseUrl });
      const db = drizzle({ client: pool, schema });
      
      // Test connectivity
      await db.execute(sql`select 1`);
      
      // Success: reset counters and store instance
      dbInstance = db;
      attempts = 0;
      lastFailure = 0;
      initPromise = null;
      
      return db;
    } catch (error) {
      // Failure: update circuit breaker state
      attempts++;
      lastFailure = Date.now();
      initPromise = null;
      
      console.error(`Database connection failed (attempt ${attempts}/${MAX_ATTEMPTS}):`, error);
      
      throw error;
    }
  })();

  return initPromise;
}
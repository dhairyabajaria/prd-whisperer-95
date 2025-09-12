import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// Circuit breaker state
let lastFailureTime = 0;
let failureCount = 0;
let connectionAttemptInProgress = false;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Calculate backoff delay with exponential growth but bounded
function getBackoffDelay(failureCount: number): number {
  if (failureCount === 0) return 0;
  
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, then cap at 30s
  const baseDelay = Math.min(Math.pow(2, failureCount - 1) * 1000, 30000);
  
  // Add jitter to prevent thundering herd
  return baseDelay + Math.random() * 1000;
}

// Check if we should attempt connection based on circuit breaker state
function shouldAttemptConnection(): boolean {
  if (failureCount === 0) return true;
  
  const backoffDelay = getBackoffDelay(failureCount);
  const timeSinceFailure = Date.now() - lastFailureTime;
  
  return timeSinceFailure >= backoffDelay;
}

async function attemptConnection(isFirstCall: boolean = false): Promise<ReturnType<typeof drizzle>> {
  // If connection attempt already in progress, wait briefly and return existing db if available
  if (connectionAttemptInProgress) {
    await sleep(100);
    if (db) return db;
    throw new Error('Database connection attempt in progress');
  }

  connectionAttemptInProgress = true;
  
  try {
    // For first call, use shorter timeout to avoid request stalls
    // For retry calls, use longer timeout for better reliability
    const maxRetries = isFirstCall ? 20 : 50; // 5s vs 12.5s
    const retryDelay = 250;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (process.env.DATABASE_URL) {
        console.log('Database URL found, initializing connection...');
        
        try {
          pool = new Pool({ connectionString: process.env.DATABASE_URL });
          const newDb = drizzle({ client: pool, schema });
          
          // Test the connection
          await pool.query('SELECT 1');
          
          // Success - reset circuit breaker state
          db = newDb;
          failureCount = 0;
          lastFailureTime = 0;
          console.log('Database connection established successfully');
          return db;
        } catch (connectionError) {
          console.error('Database connection test failed:', connectionError);
          // Clean up failed connection
          if (pool) {
            try { pool.end(); } catch {}
            pool = null;
          }
          throw connectionError;
        }
      }
      
      if (attempt === 0) {
        console.log('DATABASE_URL not yet available, retrying...');
      }
      
      await sleep(retryDelay);
    }
    
    throw new Error('DATABASE_URL not available after retries');
    
  } catch (error) {
    // Update circuit breaker state on failure
    failureCount++;
    lastFailureTime = Date.now();
    
    const backoffDelay = getBackoffDelay(failureCount);
    console.error(`Database connection failed (attempt ${failureCount}). Next retry in ${Math.round(backoffDelay/1000)}s:`, error);
    
    throw error;
  } finally {
    connectionAttemptInProgress = false;
  }
}

export async function getDb() {
  // Return cached connection if available
  if (db) {
    return db;
  }
  
  // Check circuit breaker state
  if (!shouldAttemptConnection()) {
    const backoffDelay = getBackoffDelay(failureCount);
    const timeRemaining = Math.max(0, backoffDelay - (Date.now() - lastFailureTime));
    throw new Error(`Database connection in backoff. Retry in ${Math.round(timeRemaining/1000)}s`);
  }
  
  // Attempt connection (this is the first call if we get here)
  return attemptConnection(true);
}

// Warmup function for optional non-blocking initialization
export function warmupDb() {
  setTimeout(() => {
    getDb().catch(err => {
      console.log('DB warmup failed (non-fatal):', err.message);
    });
  }, 0);
}

// Force retry function for manual recovery
export async function forceRetryConnection(): Promise<ReturnType<typeof drizzle>> {
  // Reset circuit breaker state and force a new connection attempt
  failureCount = 0;
  lastFailureTime = 0;
  
  // Clear existing connection to force recreation
  if (pool) {
    try { pool.end(); } catch {}
    pool = null;
  }
  db = null;
  
  console.log('Forcing database connection retry...');
  return attemptConnection(false);
}
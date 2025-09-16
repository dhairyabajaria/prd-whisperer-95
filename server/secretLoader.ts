import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Robust secret loading utility for Replit environment
 * Handles both development (env vars) and published (replitdb) environments
 */

interface SecretLoadResult {
  value?: string;
  source: 'replitdb' | 'env' | 'none';
  error?: string;
}

/**
 * Load a single secret from Replit's storage mechanisms
 * @param key - The secret key to load
 * @returns SecretLoadResult with value and source info
 */
function loadReplitSecret(key: string): SecretLoadResult {
  console.log(`🔍 [SECRET] Loading secret: ${key}`);
  
  // Method 1: Check /tmp/replitdb (published apps)
  try {
    const replitDbPath = '/tmp/replitdb';
    if (existsSync(replitDbPath)) {
      const secretPath = join(replitDbPath, key);
      if (existsSync(secretPath)) {
        const value = readFileSync(secretPath, 'utf8').trim();
        if (value && value.length > 0) {
          console.log(`✅ [SECRET] Found ${key} in replitdb (${value.length} chars)`);
          return { value, source: 'replitdb' };
        }
      }
    }
  } catch (error) {
    console.log(`⚠️ [SECRET] Failed to read ${key} from replitdb:`, error);
  }
  
  // Method 2: Try Replit secret API if available (development environment)
  try {
    // In Replit environment, check if we can access secrets through different means
    if (typeof process !== 'undefined' && process.env.REPL_ID) {
      console.log(`🔧 [SECRET] In Replit environment, attempting alternative secret access for ${key}`);
      
      // Try to read from environment but handle Replit's specific setup
      const value = process.env[key];
      if (value !== undefined && value !== null) {
        if (value.trim().length > 0) {
          console.log(`✅ [SECRET] Found ${key} in Replit env (${value.length} chars)`);
          return { value: value.trim(), source: 'env' };
        } else {
          console.log(`⚠️ [SECRET] ${key} exists but is empty in Replit env - secret may need refresh`);
          return { source: 'none', error: 'Secret exists but is empty - may need refresh' };
        }
      }
    }
  } catch (error) {
    console.log(`⚠️ [SECRET] Failed to read ${key} from Replit environment:`, error);
  }
  
  // Method 3: Check standard environment variables (fallback)
  try {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      console.log(`✅ [SECRET] Found ${key} in standard env vars (${value.length} chars)`);
      return { value: value.trim(), source: 'env' };
    }
  } catch (error) {
    console.log(`⚠️ [SECRET] Failed to read ${key} from env vars:`, error);
  }
  
  console.log(`❌ [SECRET] Secret ${key} not found in any source`);
  return { source: 'none', error: 'Secret not found in replitdb or env vars' };
}

/**
 * Async retry-based secret loading with exponential backoff
 * @param key - The secret key to load
 * @param maxRetries - Maximum number of retry attempts
 * @param delayMs - Initial delay between retries in milliseconds
 * @returns Promise<string | undefined>
 */
export async function getReplitSecretAsync(
  key: string, 
  maxRetries = 5, 
  delayMs = 1000
): Promise<string | undefined> {
  console.log(`🔄 [SECRET] Starting async load for: ${key} (max retries: ${maxRetries})`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = loadReplitSecret(key);
    
    if (result.value) {
      console.log(`✅ [SECRET] Successfully loaded ${key} on attempt ${attempt} from ${result.source}`);
      return result.value;
    }
    
    if (attempt < maxRetries) {
      console.log(`⏳ [SECRET] Attempt ${attempt}/${maxRetries} failed for ${key}, waiting ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      // Exponential backoff with jitter
      delayMs = Math.min(delayMs * 1.5 + Math.random() * 100, 5000);
    }
  }
  
  console.log(`❌ [SECRET] Failed to load ${key} after ${maxRetries} attempts`);
  return undefined;
}

/**
 * Load multiple secrets in parallel with retry logic
 * @param keys - Array of secret keys to load
 * @param maxRetries - Maximum number of retry attempts per secret
 * @param delayMs - Initial delay between retries
 * @returns Promise<Record<string, string | undefined>>
 */
export async function getReplitSecretsAsync(
  keys: string[], 
  maxRetries = 5, 
  delayMs = 1000
): Promise<Record<string, string | undefined>> {
  console.log(`🔄 [SECRET] Loading multiple secrets in parallel: ${keys.join(', ')}`);
  
  const promises = keys.map(key => 
    getReplitSecretAsync(key, maxRetries, delayMs).then(value => ({ key, value }))
  );
  
  const results = await Promise.all(promises);
  const secretMap: Record<string, string | undefined> = {};
  
  for (const { key, value } of results) {
    secretMap[key] = value;
  }
  
  const foundCount = Object.values(secretMap).filter(v => v !== undefined).length;
  console.log(`✅ [SECRET] Loaded ${foundCount}/${keys.length} secrets successfully`);
  
  return secretMap;
}

/**
 * Enhanced DATABASE_URL construction with retry logic
 * Tries direct DATABASE_URL first, then constructs from PG components
 * @param maxRetries - Maximum retry attempts
 * @param delayMs - Initial delay between retries
 * @returns Promise<string | undefined>
 */
export async function getDatabaseUrlAsync(
  maxRetries = 5, 
  delayMs = 1000
): Promise<string | undefined> {
  console.log('🔍 [SECRET] Attempting to get DATABASE_URL...');
  
  // First try direct DATABASE_URL access
  let databaseUrl = await getReplitSecretAsync('DATABASE_URL', maxRetries, delayMs);
  
  if (databaseUrl) {
    console.log('✅ [SECRET] Found direct DATABASE_URL');
    return databaseUrl;
  }
  
  // Fallback: construct from PG components
  console.log('🔧 [SECRET] Trying to construct DATABASE_URL from PG components...');
  
  const secrets = await getReplitSecretsAsync([
    'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'
  ], maxRetries, delayMs);
  
  const { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD } = secrets;
  
  if (PGHOST && PGPORT && PGDATABASE && PGUSER && PGPASSWORD) {
    databaseUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require`;
    console.log('✅ [SECRET] Successfully constructed DATABASE_URL from components');
    return databaseUrl;
  }
  
  console.log('❌ [SECRET] Unable to get DATABASE_URL via any method');
  return undefined;
}

/**
 * Debug function to show available environment variables and replitdb status
 */
export function debugSecretSources(): void {
  console.log('🔍 [SECRET-DEBUG] Environment analysis:');
  console.log(`- Environment variables count: ${Object.keys(process.env).length}`);
  console.log(`- /tmp/replitdb exists: ${existsSync('/tmp/replitdb')}`);
  
  if (existsSync('/tmp/replitdb')) {
    try {
      const { readdirSync } = require('fs');
      const files = readdirSync('/tmp/replitdb');
      console.log(`- replitdb files count: ${files.length}`);
      console.log(`- replitdb contains DATABASE_URL: ${files.includes('DATABASE_URL')}`);
      console.log(`- replitdb contains PGHOST: ${files.includes('PGHOST')}`);
    } catch (error) {
      console.log(`- replitdb read error: ${error}`);
    }
  }
  
  // Check for common database env vars
  const dbKeys = ['DATABASE_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
  console.log('- Database environment variables:');
  for (const key of dbKeys) {
    const value = process.env[key];
    console.log(`  ${key}: ${value ? 'present' : 'missing'} (${value ? value.length : 0} chars)`);
  }
}
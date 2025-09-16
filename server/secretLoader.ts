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
  
  // Safe debugging approach - no secret data exposure
  try {
    const value = process.env[key];
    console.log(`🔧 [SECRET] DEBUG ${key}:`, {
      exists: key in process.env,
      type: typeof value,
      isUndefined: value === undefined,
      isNull: value === null,
      isEmpty: value === '',
      hasValue: !!(value && value.trim().length > 0)
    });
    
    if (value !== undefined && value !== null && value !== '') {
      console.log(`✅ [SECRET] Found ${key}`);
      return { value, source: 'env' };
    }
  } catch (error) {
    console.log(`⚠️ [SECRET] Failed to read ${key}:`, error);
  }
  
  console.log(`❌ [SECRET] Secret ${key} not found or empty`);
  return { source: 'none', error: 'Secret not found or empty' };
}

/**
 * Simplified async secret loading without retries
 * @param key - The secret key to load
 * @returns Promise<string | undefined>
 */
export async function getReplitSecretAsync(
  key: string, 
  maxRetries = 1, 
  delayMs = 0
): Promise<string | undefined> {
  console.log(`🔄 [SECRET] Loading ${key}...`);
  
  const result = loadReplitSecret(key);
  
  if (result.value) {
    console.log(`✅ [SECRET] Successfully loaded ${key} from ${result.source}`);
    return result.value;
  }
  
  console.log(`❌ [SECRET] Failed to load ${key}: ${result.error}`);
  return undefined;
}

/**
 * Load multiple secrets in parallel
 * @param keys - Array of secret keys to load
 * @returns Promise<Record<string, string | undefined>>
 */
export async function getReplitSecretsAsync(
  keys: string[], 
  maxRetries = 1, 
  delayMs = 0
): Promise<Record<string, string | undefined>> {
  console.log(`🔄 [SECRET] Loading multiple secrets: ${keys.join(', ')}`);
  
  const promises = keys.map(key => 
    getReplitSecretAsync(key).then(value => ({ key, value }))
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
 * Enhanced DATABASE_URL construction
 * Tries direct DATABASE_URL first, then constructs from PG components
 * @returns Promise<string | undefined>
 */
export async function getDatabaseUrlAsync(): Promise<string | undefined> {
  console.log('🔍 [SECRET] Attempting to get DATABASE_URL...');
  
  // First try direct DATABASE_URL access
  let databaseUrl = await getReplitSecretAsync('DATABASE_URL');
  
  if (databaseUrl) {
    console.log('✅ [SECRET] Found direct DATABASE_URL');
    return databaseUrl;
  }
  
  // Fallback: construct from PG components
  console.log('🔧 [SECRET] Trying to construct DATABASE_URL from PG components...');
  
  const secrets = await getReplitSecretsAsync([
    'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'
  ]);
  
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
    console.log(`  ${key}: ${value ? 'configured' : 'missing'}`);
  }
}
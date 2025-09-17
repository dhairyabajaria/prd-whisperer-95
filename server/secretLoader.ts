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
  
  // Try to access secrets through Replit's runtime environment
  // In Replit, secrets are available through process.env but may need refresh
  try {
    // Direct process.env access - Replit automatically loads secrets here
    const envValue = process.env[key];
    console.log(`🔧 [SECRET] DEBUG ${key}:`, {
      exists: key in process.env,
      type: typeof envValue,
      isUndefined: envValue === undefined,
      isNull: envValue === null,
      isEmpty: envValue === '',
      hasValue: !!(envValue && envValue.trim().length > 0)
    });
    
    if (envValue && envValue.trim().length > 0) {
      console.log(`✅ [SECRET] Found ${key} in process.env`);
      return { value: envValue.trim(), source: 'env' };
    }
    
    // If process.env shows empty but secret exists, try refreshing
    if (envValue === '' && key in process.env) {
      console.log(`⚠️ [SECRET] ${key} exists but is empty - checking alternative sources`);
    }
  } catch (error) {
    console.log(`⚠️ [SECRET] Failed to read ${key} from process.env:`, error);
  }
  
  // Try to read from Replit's secret file system if it exists
  try {
    const secretPath = `/tmp/replitdb/${key}`;
    if (existsSync(secretPath)) {
      const secretValue = readFileSync(secretPath, 'utf8').trim();
      if (secretValue && secretValue.length > 0) {
        console.log(`✅ [SECRET] Found ${key} in replitdb`);
        return { value: secretValue, source: 'replitdb' };
      }
    }
  } catch (error) {
    console.log(`⚠️ [SECRET] Failed to read ${key} from replitdb:`, error);
  }
  
  // Try reading environment files that might contain secrets
  try {
    const envFile = '.env';
    if (existsSync(envFile)) {
      const envContent = readFileSync(envFile, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const [envKey, ...valueParts] = line.split('=');
        if (envKey?.trim() === key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          console.log(`🔧 [SECRET] .env file parsing - ${key}: length=${value.length}, hasValue=${!!(value && value.length > 0)}`);
          if (value && value.length > 0) {
            console.log(`✅ [SECRET] Found ${key} in .env file`);
            return { value, source: 'env' };
          }
        }
      }
    }
  } catch (error) {
    console.log(`⚠️ [SECRET] Failed to read ${key} from .env file:`, error);
  }
  
  console.log(`❌ [SECRET] Secret ${key} not found or empty in any source`);
  return { source: 'none', error: 'Secret not found or empty in any source' };
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
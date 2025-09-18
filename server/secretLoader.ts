import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Robust secret loading utility for Replit environment
 * Handles secrets via Replit Integrations (javascript_database, javascript_openai)
 * With development fallback to .env files
 */

interface SecretLoadResult {
  value?: string;
  source: 'replit_integration' | 'env_file' | 'none';
  error?: string;
}

/**
 * Load a single secret from Replit's integration mechanisms with enhanced fallback
 * @param key - The secret key to load
 * @returns SecretLoadResult with value and source info
 */
function loadReplitSecret(key: string): SecretLoadResult {
  console.log(`🔍 [SECRET] Loading secret: ${key}`);
  
  // PRIMARY: Try to access secrets through Replit's integration system
  // Replit Integrations (javascript_database, javascript_openai) inject secrets into process.env
  try {
    const envValue = process.env[key];
    console.log(`🔧 [SECRET] DEBUG ${key}:`, {
      exists: key in process.env,
      type: typeof envValue,
      isUndefined: envValue === undefined,
      isNull: envValue === null,
      isEmpty: envValue === '',
      length: envValue ? envValue.length : 0,
      trimLength: envValue ? envValue.trim().length : 0,
      hasValue: !!(envValue && envValue.trim().length > 0),
      startsWithCorrectFormat: envValue && (
        (key === 'OPENAI_API_KEY' && envValue.startsWith('sk-')) ||
        (key === 'DATABASE_URL' && envValue.startsWith('postgresql://')) ||
        key.startsWith('PG')
      )
    });
    
    // CRITICAL FIX: Treat empty strings as "missing" since Replit integrations 
    // should provide non-empty values when properly configured
    if (envValue && envValue.trim().length > 0) {
      console.log(`✅ [SECRET] Found ${key} via Replit Integration`);
      return { value: envValue.trim(), source: 'replit_integration' };
    }
    
    // Special handling for DATABASE_URL when integration provides empty value
    if (key === 'DATABASE_URL' && envValue === '' && key in process.env) {
      console.log(`🔧 [SECRET] DATABASE_URL is empty in integration - attempting advanced fallback...`);
      return { source: 'none', error: 'DATABASE_URL integration misconfigured - empty value' };
    }
    
    // Log if secret exists but is empty (integration misconfiguration)
    if (envValue === '' && key in process.env) {
      console.log(`⚠️ [SECRET] ${key} exists but is empty - possible integration misconfiguration`);
    }
  } catch (error) {
    console.log(`⚠️ [SECRET] Failed to read ${key} from Replit Integration:`, error);
  }
  
  // FALLBACK: Development environment - read from .env file
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
            return { value, source: 'env_file' };
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
export async function getReplitSecretAsync(key: string): Promise<string | undefined> {
  const result = loadReplitSecret(key);
  
  if (result.value) {
    console.log(`✅ [SECRET] Found ${key} from ${result.source}`);
    return result.value;
  }
  
  console.log(`⚠️  [SECRET] ${key} not available`);
  return undefined;
}

/**
 * Load multiple secrets in parallel
 * @param keys - Array of secret keys to load
 * @returns Promise<Record<string, string | undefined>>
 */
export async function getReplitSecretsAsync(keys: string[]): Promise<Record<string, string | undefined>> {
  const promises = keys.map(async key => {
    if (key === 'DATABASE_URL') {
      const value = await getDatabaseUrlAsync();
      return { key, value };
    } else {
      const value = await getReplitSecretAsync(key);
      return { key, value };
    }
  });
  
  const results = await Promise.all(promises);
  const secretMap: Record<string, string | undefined> = {};
  
  for (const { key, value } of results) {
    secretMap[key] = value;
  }
  
  return secretMap;
}

/**
 * Simplified DATABASE_URL loading for Replit Integration
 * @returns Promise<string | undefined>
 */
export async function getDatabaseUrlAsync(): Promise<string | undefined> {
  console.log('🔍 [SECRET] Loading DATABASE_URL...');
  
  // Primary: Check process.env.DATABASE_URL (populated by Replit integrations)
  const rawDatabaseUrl = process.env.DATABASE_URL;
  
  if (rawDatabaseUrl && rawDatabaseUrl.trim().length > 0) {
    console.log('✅ [SECRET] DATABASE_URL found and valid');
    return rawDatabaseUrl.trim();
  }
  
  console.log('⚠️  [SECRET] DATABASE_URL not available - using memory storage');
  return undefined;
}

/**
 * Simple debug function to show Replit Integration status
 */
export function debugSecretSources(): void {
  const databaseUrl = process.env.DATABASE_URL;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  console.log('🔍 [SECRET] Integration status:');
  console.log(`  DATABASE_URL: ${databaseUrl ? 'configured' : 'missing'}`);
  console.log(`  OPENAI_API_KEY: ${openaiKey ? 'configured' : 'missing'}`);
}
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
 * Load a single secret from Replit's integration mechanisms
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
  
  const promises = keys.map(async key => {
    // CRITICAL FIX: Route DATABASE_URL to enhanced loading function with emergency fallback
    if (key === 'DATABASE_URL') {
      console.log('🔀 [SECRET] Routing DATABASE_URL to enhanced loader...');
      const value = await getDatabaseUrlAsync();
      return { key, value };
    } else {
      // For all other keys, use standard loading
      const value = await getReplitSecretAsync(key);
      return { key, value };
    }
  });
  
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
 * Enhanced DATABASE_URL loading for Replit Integration
 * The javascript_database integration provides DATABASE_URL directly via process.env
 * @returns Promise<string | undefined>
 */
export async function getDatabaseUrlAsync(): Promise<string | undefined> {
  console.log('🔍 [SECRET] Attempting to get DATABASE_URL from javascript_database integration...');
  
  // The javascript_database integration provides DATABASE_URL directly
  let databaseUrl = await getReplitSecretAsync('DATABASE_URL');
  
  if (databaseUrl) {
    console.log('✅ [SECRET] Found DATABASE_URL via javascript_database integration');
    return databaseUrl;
  }
  
  // Fallback: construct from PG components (if individual components available)
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
  
  // EMERGENCY FALLBACK: Replit's PostgreSQL setup when integration fails
  console.log('🚑 [SECRET] EMERGENCY FALLBACK: Using Replit PostgreSQL connection patterns...');
  console.log('⚠️  [SECRET] This indicates javascript_database integration needs reconfiguration');
  
  // Try multiple Replit PostgreSQL connection patterns
  const fallbackPatterns = [
    // Pattern 1: Replit development database with socket
    'postgresql://postgres@/postgres?host=/run/postgresql',
    // Pattern 2: Default Replit database
    'postgresql://postgres:@localhost/postgres',
    // Pattern 3: Replit with unix socket
    'postgresql:///postgres?host=/run/postgresql&user=postgres',
    // Pattern 4: Standard development pattern
    'postgresql://postgres:password@localhost:5432/postgres'
  ];
  
  for (let i = 0; i < fallbackPatterns.length; i++) {
    const testUrl = fallbackPatterns[i];
    const index = i;
    try {
      console.log(`🔧 [SECRET] Testing fallback pattern ${index + 1}: ${testUrl.replace(/password/g, '***')}`);
      
      // Test if this fallback URL can create a connection pool
      const { Pool } = await import('@neondatabase/serverless');
      const testPool = new Pool({ connectionString: testUrl });
      
      // Test basic connectivity
      try {
        await testPool.query('SELECT 1 as test');
        console.log(`✅ [SECRET] Emergency fallback pattern ${index + 1} connection test successful!`);
        console.log('📝 [SECRET] Using emergency fallback - please reconfigure javascript_database integration');
        return testUrl;
      } catch (connError) {
        const errorMessage = connError instanceof Error ? connError.message : String(connError);
        console.log(`❌ [SECRET] Pattern ${index + 1} connection failed: ${errorMessage}`);
        await testPool.end().catch(() => {}); // Clean up failed pool
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ [SECRET] Pattern ${index + 1} pool creation failed: ${errorMessage}`);
    }
  }
  
  console.error('❌ [SECRET] All emergency fallback patterns failed');
  
  console.log('❌ [SECRET] Unable to get DATABASE_URL via any method. Check javascript_database integration configuration.');
  return undefined;
}

/**
 * Debug function to show Replit Integration status and environment variables
 */
export function debugSecretSources(): void {
  console.log('🔍 [SECRET-DEBUG] Replit Integration analysis:');
  console.log(`- Environment variables count: ${Object.keys(process.env).length}`);
  
  // Check for Replit Integration secrets
  const integrationSecrets = ['DATABASE_URL', 'OPENAI_API_KEY'];
  console.log('- Replit Integration secrets:');
  for (const key of integrationSecrets) {
    const value = process.env[key];
    const hasValue = !!(value && value.trim().length > 0);
    console.log(`  ${key}: ${hasValue ? 'configured' : 'missing/empty'} ${hasValue ? '' : '(check integration setup)'}`);
  }
  
  // Check for fallback database env vars
  const dbKeys = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
  console.log('- Fallback database environment variables:');
  for (const key of dbKeys) {
    const value = process.env[key];
    const hasValue = !!(value && value.trim().length > 0);
    console.log(`  ${key}: ${hasValue ? 'configured' : 'missing/empty'}`);
  }
  
  // Check .env file
  const envFileExists = existsSync('.env');
  console.log(`- .env file exists: ${envFileExists}`);
  if (envFileExists) {
    console.log('  (fallback for development environment)');
  }
}
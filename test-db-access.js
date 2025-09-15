#!/usr/bin/env node

console.log('=== Database Environment Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

const dbVars = ['DATABASE_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];

console.log('Environment Variables:');
dbVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.length} characters - ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: not found or empty`);
  }
});

console.log('');
console.log('All process.env keys that contain DATABASE or PG:');
const relevantKeys = Object.keys(process.env).filter(key => 
  key.includes('DATABASE') || key.includes('PG')
);
console.log(relevantKeys);

// Try to construct DATABASE_URL from components if needed
if (!process.env.DATABASE_URL) {
  console.log('');
  console.log('Attempting to construct DATABASE_URL from PG components...');
  const pgHost = process.env.PGHOST;
  const pgPort = process.env.PGPORT;
  const pgDatabase = process.env.PGDATABASE;
  const pgUser = process.env.PGUSER;
  const pgPassword = process.env.PGPASSWORD;
  
  if (pgHost && pgPort && pgDatabase && pgUser && pgPassword) {
    const constructedUrl = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=require`;
    console.log('✅ Successfully constructed DATABASE_URL:', constructedUrl.substring(0, 50) + '...');
  } else {
    console.log('❌ Cannot construct DATABASE_URL - missing components');
  }
} else {
  console.log('✅ DATABASE_URL is available directly');
}
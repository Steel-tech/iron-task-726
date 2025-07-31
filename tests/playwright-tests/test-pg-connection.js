// Test PostgreSQL connection directly
const DATABASE_URL = "postgresql://postgres:AB7XcyTB9B6Sp9pe@db.fjoscpvmmcvbgnwxsysp.supabase.co:5432/postgres";

console.log('Testing direct PostgreSQL connection...');
console.log('URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

// Try with different SSL configurations
const testConfigs = [
  { name: 'No SSL', url: DATABASE_URL },
  { name: 'SSL Required', url: DATABASE_URL + '?sslmode=require' },
  { name: 'SSL No Verify', url: DATABASE_URL + '?sslmode=no-verify' },
  { name: 'SSL Disable', url: DATABASE_URL + '?sslmode=disable' }
];

async function testConnection(config) {
  console.log(`\nTrying ${config.name}...`);
  
  try {
    // Use node's built-in https to test the connection
    const url = new URL(config.url.replace('postgresql://', 'https://').replace(':5432', ''));
    const https = require('https');
    
    const options = {
      hostname: url.hostname,
      port: 5432,
      method: 'GET',
      timeout: 5000
    };
    
    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        console.log(`✓ Host is reachable (status: ${res.statusCode})`);
        resolve(true);
      });
      
      req.on('error', (err) => {
        console.log(`✗ Connection failed: ${err.message}`);
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.log('✗ Connection timeout');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
    return false;
  }
}

// Test HTTPS connectivity to Supabase API
console.log('\nFirst, testing Supabase API connectivity...');
const https = require('https');
https.get('https://fjoscpvmmcvbgnwxsysp.supabase.co/rest/v1/', (res) => {
  console.log(`✅ Supabase API is reachable (status: ${res.statusCode})`);
  
  // Now test database connections
  console.log('\nTesting database connection options...');
  console.log('\n⚠️  Note: The database might be behind a firewall.');
  console.log('   You may need to check:');
  console.log('   1. Supabase Dashboard → Settings → Database');
  console.log('   2. Look for "Connection Pooling" section');
  console.log('   3. Try the "Connection string" from there instead');
}).on('error', (err) => {
  console.error('✗ Cannot reach Supabase API:', err.message);
});
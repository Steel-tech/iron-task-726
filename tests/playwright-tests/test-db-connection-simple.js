#!/usr/bin/env node
require('dotenv').config({ path: './api/.env' });

console.log('🔍 Testing Supabase Database Connection\n');

// Check environment variables
const dbUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

// Parse connection details
const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!urlParts) {
  console.error('❌ Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = urlParts;

console.log('📊 Connection Details:');
console.log(`  Host: ${host}`);
console.log(`  Port: ${port}`);
console.log(`  Database: ${database}`);
console.log(`  User: ${user}`);
console.log(`  Password: ${password.substring(0, 4)}... (hidden)`);
console.log(`  Supabase URL: ${supabaseUrl || 'Not set'}`);

console.log('\n🚀 Next Steps:');
console.log('1. Go to https://app.supabase.com');
console.log('2. Find your project and click on it');
console.log('3. If you see a "Restore" button, click it to unpause your project');
console.log('4. Wait 2-3 minutes for the database to come online');
console.log('5. Run the following command to test:');
console.log('   cd api && npx prisma db pull');
console.log('\n📝 Alternative: Create a new Supabase project');
console.log('If the project cannot be restored, you may need to:');
console.log('1. Create a new Supabase project');
console.log('2. Update the .env file with new credentials');
console.log('3. Run migrations: cd api && npx prisma migrate deploy');

// Try to ping the host
const { exec } = require('child_process');
console.log(`\n🏓 Pinging ${host}...`);
exec(`ping -c 1 ${host}`, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Host is not reachable - Project is likely paused');
  } else {
    console.log('✅ Host is reachable');
  }
});
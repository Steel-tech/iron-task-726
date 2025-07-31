// Test Supabase database connection
require('dotenv').config({ path: '.env.supabase' });
const { Client } = require('pg');

async function testDatabaseConnection() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DATABASE_URL,
  });

  try {
    console.log('🔍 Testing database connection...');
    await client.connect();
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('⏰ Server time:', result.rows[0].now);
    
    // Check if we have any tables
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    
    console.log('\n📊 Existing tables in database:');
    if (tables.rows.length === 0) {
      console.log('   No tables found (empty database)');
    } else {
      tables.rows.forEach(row => {
        console.log(`   - ${row.tablename}`);
      });
    }
    
    await client.end();
    
    console.log('\n✅ Database connection test passed!');
    console.log('\n🚀 Ready to run migration!');
    console.log('Next steps:');
    console.log('1. Stop Docker: docker-compose down');
    console.log('2. Run migration: ./scripts/migrate-to-supabase.sh');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your database password is correct');
    console.log('2. Ensure your Supabase project is active');
    console.log('3. Check network connectivity');
    await client.end();
    process.exit(1);
  }
}

testDatabaseConnection();

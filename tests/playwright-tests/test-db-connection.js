// Quick database connection test
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: './api/.env' });

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Database URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    // Simple query to test connection
    await prisma.$connect();
    console.log('✅ Connected to database!');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('⏰ Database time:', result[0].current_time);
    
    // Check if we have any tables
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
      LIMIT 5;
    `;
    
    console.log('\n📊 Tables in database:');
    if (tables.length === 0) {
      console.log('   No tables found (empty database)');
      console.log('   This is expected for a new Supabase project');
    } else {
      tables.forEach(t => console.log(`   - ${t.tablename}`));
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Connection test successful!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if your Supabase project is active');
    console.log('2. Verify the database password is correct');
    console.log('3. Check network connectivity');
    console.log('4. Try resetting the database password in Supabase dashboard');
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
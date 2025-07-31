#!/usr/bin/env node

/**
 * Comprehensive Supabase Database Test
 * Tests both Supabase client and Prisma connections
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fjoscpvmmcvbgnwxsysp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3NjcHZtbWN2Ymdud3hzeXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDcwMzMsImV4cCI6MjA2Nzc4MzAzM30.GFfazb2vdG5mQMmwXxhVflng_6Ir4vksdN7GDAxpXp0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseAPI() {
  console.log('🔗 Testing Supabase API connection...');
  
  try {
    // Test basic connection with companies table
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase API Error:', error.message);
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('💡 The database schema has not been set up yet.');
        console.error('   Please run the SUPABASE_SETUP_SCRIPT.sql in your Supabase dashboard.');
        return false;
      }
      return false;
    } else {
      console.log('✅ Supabase API connection successful!');
      console.log(`   Found ${data.length} companies`);
      if (data.length > 0) {
        console.log(`   Sample company: ${data[0].name}`);
      }
      return true;
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    return false;
  }
}

async function testPrismaConnection() {
  console.log('🔗 Testing Prisma database connection...');
  
  try {
    // Try to load Prisma client
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Prisma connected successfully!');
    
    // Test companies table
    const companies = await prisma.companies.findMany({ take: 1 });
    console.log(`   Found ${companies.length} companies via Prisma`);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('💡 Update your DATABASE_URL with the correct password in api/.env');
    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('💡 Run the SUPABASE_SETUP_SCRIPT.sql in your Supabase dashboard');
    }
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 FSW Iron Task - Database Connection Tests\n');
  
  const supabaseOK = await testSupabaseAPI();
  console.log('');
  const prismaOK = await testPrismaConnection();
  
  console.log('\n📊 Test Results:');
  console.log(`Supabase API: ${supabaseOK ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Prisma ORM:   ${prismaOK ? '✅ PASS' : '❌ FAIL'}`);
  
  if (supabaseOK && prismaOK) {
    console.log('\n🎉 All tests passed! Your database is ready for FSW Iron Task.');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above before proceeding.');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/fjoscpvmmcvbgnwxsysp');
    console.log('2. Open SQL Editor');
    console.log('3. Run the SUPABASE_SETUP_SCRIPT.sql file');
    console.log('4. Update DATABASE_URL in api/.env with correct password');
    console.log('5. Run this test again: node test-supabase-connection.js');
    
    process.exit(1);
  }
}

runAllTests();
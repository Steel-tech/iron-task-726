// Verify Supabase connection and create initial tables
require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyAndSetup() {
  console.log('🔍 Verifying Supabase connection...\n');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('test_connection')
      .select('*')
      .limit(1);
    
    if (error && error.code !== '42P01') {
      throw error;
    }
    
    console.log('✅ Connected to Supabase successfully!');
    console.log(`📍 Project: ${supabaseUrl}\n`);
    
    // Check current tables
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables', {}, {
      get: true,
      head: false,
      count: null
    }).single();
    
    if (!tablesError) {
      console.log('📊 Current tables:', tables);
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('1. The connection is working!');
    console.log('2. Now we need to create the database schema.');
    console.log('3. Run: cd api && npx prisma migrate dev --name init');
    console.log('\nThis will create all the tables in your Supabase database.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the Supabase URL is correct');
      console.log('3. Make sure your project is active in Supabase dashboard');
    }
  }
}

verifyAndSetup();
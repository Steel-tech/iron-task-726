// Quick Supabase connection test
require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR-PROJECT-REF')) {
  log('❌ Missing or invalid Supabase credentials in .env.supabase', 'red');
  log('\nPlease update .env.supabase with your actual Supabase project details:', 'yellow');
  log('1. Go to your Supabase dashboard', 'yellow');
  log('2. Navigate to Settings > API', 'yellow');
  log('3. Copy your Project URL and Anon Key', 'yellow');
  log('\nSee SUPABASE_CREDENTIALS_GUIDE.md for detailed instructions\n', 'blue');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  log('🔍 Testing Supabase connection...\n', 'bright');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('_test_').select('*').limit(1);
    
    if (error && error.code !== '42P01') { // 42P01 = table doesn't exist (expected)
      throw error;
    }
    
    log('✅ Successfully connected to Supabase!', 'green');
    log(`📍 Project URL: ${supabaseUrl}`, 'blue');
    
    // Check if we can access auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!authError) {
      log('✅ Auth service is accessible', 'green');
    }
    
    log('\n🎉 Your Supabase connection is working!', 'bright');
    log('\nNext step: Run the migration helper:', 'yellow');
    log('node supabase-migration-helper.js\n', 'blue');
    
  } catch (error) {
    log(`❌ Connection failed: ${error.message}`, 'red');
    log('\nTroubleshooting:', 'yellow');
    log('1. Verify your Supabase URL and keys are correct', 'yellow');
    log('2. Check if your project is active in Supabase dashboard', 'yellow');
    log('3. Ensure you have internet connectivity', 'yellow');
    log('4. Try regenerating your API keys in Supabase dashboard\n', 'yellow');
    process.exit(1);
  }
}

testConnection();
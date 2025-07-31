const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tsljqirdxxaysoqmxgoy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzbGpxaXJkeHhheXNvcW14Z295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDY4MDQsImV4cCI6MjA2ODI4MjgwNH0.T-8DwKP0JN5k48Kac6veNXkvZTRJlx5V1fBQe3JDfrE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase API connection...');
  
  try {
    // Test if we can query the users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase API Error:', error.message);
      console.log('Error details:', error);
      
      // Try to list tables
      console.log('\nTrying to check if tables exist...');
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables', {});
        
      if (tablesError) {
        console.log('Tables check also failed:', tablesError.message);
      }
    } else {
      console.log('✅ Supabase API connection successful!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection();
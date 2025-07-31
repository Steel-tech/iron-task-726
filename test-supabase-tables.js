const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tsljqirdxxaysoqmxgoy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzbGpxaXJkeHhheXNvcW14Z295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcwNjgwNCwiZXhwIjoyMDY4MjgyODA0fQ.dYMDtE8j7zltMMP3022fWUhxx9H-3MgpnPbhNIKcEqk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('Checking Supabase tables...\n');
  
  // List of tables we expect to exist
  const tables = [
    'companies',
    'users', 
    'projects',
    'media',
    'comments',
    'tags',
    'labels'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: exists (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\nTrying to query companies directly...');
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*');
    
  if (companiesError) {
    console.log('Error querying companies:', companiesError);
  } else {
    console.log('Companies found:', companies?.length || 0);
    if (companies && companies.length > 0) {
      console.log('First company:', companies[0]);
    }
  }
}

checkTables();
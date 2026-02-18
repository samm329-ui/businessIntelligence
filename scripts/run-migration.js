require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SQL_FILE = 'd:\\ProjectEBITA\\upgrade\\upgrade 2\\schema_v4.sql';

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    console.log('Connected to Supabase\n');

    let sql = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Remove comment lines 
    sql = sql.replace(/^--.*$/gm, '');
    
    // Save SQL to a file for easy copy-paste
    const outputFile = path.join(__dirname, 'migration.sql');
    fs.writeFileSync(outputFile, sql);
    console.log(`SQL file loaded and saved to: ${outputFile}\n`);

    // Try to execute using the pg-api approach via fetch
    console.log('Attempting to execute SQL via Supabase REST API...\n');
    
    const statements = sql.split(';').filter(s => s.trim().length > 10);
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt.length < 20) continue; // Skip very short statements
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: stmt })
        });
        
        if (response.ok) {
          successCount++;
          console.log(`Statement ${i + 1}: OK`);
        } else {
          const errText = await response.text();
          if (!errText.includes('already exists') && !errText.includes('duplicate')) {
            console.log(`Statement ${i + 1}: FAILED - ${errText.substring(0, 100)}`);
            failCount++;
          } else {
            console.log(`Statement ${i + 1}: SKIPPED (already exists)`);
            successCount++;
          }
        }
      } catch (e) {
        // RPC may not exist, try alternative
        console.log(`Statement ${i + 1}: Could not execute via RPC`);
      }
    }
    
    console.log(`\nMigration complete: ${successCount} succeeded, ${failCount} failed`);
    console.log('Note: If RPC failed, please copy scripts/migration.sql to Supabase SQL Editor');
    
  } catch (err) {
    console.error('Migration failed:', err.message);
    console.log('\nPlease run the SQL manually in Supabase SQL Editor:');
    console.log('File: scripts/migration.sql');
    process.exit(1);
  }
}

runMigration();

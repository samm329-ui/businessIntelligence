#!/usr/bin/env node
/**
 * Database Setup Verification Script
 * 
 * Run this after running the SQL migration to verify everything is set up correctly
 * Usage: node scripts/verify-database.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const requiredTables = [
  'parent_companies',
  'brands',
  'data_sources',
  'data_lineage',
  'validation_rules',
  'validation_results',
  'cross_source_comparison',
  'ai_analysis',
  'ai_citations',
  'error_logs',
  'entity_resolution_log',
  'kpi_formulas',
  'audit_trail'
];

const requiredViews = [
  'company_full_profile',
  'brand_company_mapping',
  'data_quality_dashboard',
  'error_monitoring',
  'ai_hallucination_report'
];

async function verifyDatabase() {
  console.log('🔍 Verifying Database Setup...\n');

  // Check connection
  try {
    const { data, error } = await supabase.from('companies').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Supabase URL is correct in .env.local');
    console.error('2. API keys are correct');
    console.error('3. Project is active at: https://supabase.com/dashboard/project/bbpvgxlsnnvabesngbof');
    process.exit(1);
  }

  // Check tables
  console.log('\n📊 Checking Tables...');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (tablesError) {
    console.error('❌ Error fetching tables:', tablesError.message);
    process.exit(1);
  }

  const existingTables = tables.map(t => t.table_name);
  let tablesOk = true;

  for (const table of requiredTables) {
    if (existingTables.includes(table)) {
      console.log(`  ✅ ${table}`);
    } else {
      console.log(`  ❌ ${table} - NOT FOUND`);
      tablesOk = false;
    }
  }

  // Check views
  console.log('\n👁️  Checking Views...');
  const { data: views, error: viewsError } = await supabase
    .from('information_schema.views')
    .select('table_name')
    .eq('table_schema', 'public');

  if (viewsError) {
    console.error('❌ Error fetching views:', viewsError.message);
    process.exit(1);
  }

  const existingViews = views.map(v => v.table_name);
  let viewsOk = true;

  for (const view of requiredViews) {
    if (existingViews.includes(view)) {
      console.log(`  ✅ ${view}`);
    } else {
      console.log(`  ❌ ${view} - NOT FOUND`);
      viewsOk = false;
    }
  }

  // Check seed data
  console.log('\n🌱 Checking Seed Data...');
  
  const { data: dataSources, error: dsError } = await supabase
    .from('data_sources')
    .select('count');
  
  if (!dsError && dataSources && dataSources.length > 0) {
    console.log(`  ✅ Data sources: ${dataSources.length} entries`);
  } else {
    console.log('  ⚠️  No data sources found (run migration)');
  }

  const { data: kpiFormulas, error: kpiError } = await supabase
    .from('kpi_formulas')
    .select('count');
  
  if (!kpiError && kpiFormulas && kpiFormulas.length > 0) {
    console.log(`  ✅ KPI formulas: ${kpiFormulas.length} entries`);
  } else {
    console.log('  ⚠️  No KPI formulas found (run migration)');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (tablesOk && viewsOk) {
    console.log('✅ DATABASE SETUP COMPLETE!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000/api/health');
    console.log('3. Test the application');
    process.exit(0);
  } else {
    console.log('❌ DATABASE SETUP INCOMPLETE');
    console.log('\nPlease run the migration:');
    console.log('1. Open: https://supabase.com/dashboard/project/bbpvgxlsnnvabesngbof');
    console.log('2. Go to: SQL Editor');
    console.log('3. Run: scripts/setup-database.sql');
    process.exit(1);
  }
}

verifyDatabase();

#!/usr/bin/env tsx
/**
 * ZIP CODE DATABASE SEEDING SCRIPT
 * =================================
 * 
 * Downloads and imports all 42,000+ US ZIP codes to the database
 * 
 * DATA SOURCE: 
 * - SimpleMaps: https://simplemaps.com/data/us-zips (free basic version)
 * - Or manually download CSV from: https://www.unitedstateszipcodes.org/zip-code-database/
 * 
 * USAGE:
 * 1. Download CSV file to: ./data/zip_codes.csv
 * 2. Run: npx tsx scripts/seed-zip-codes.ts
 * 3. Verify: Check Supabase dashboard for zip_codes table
 * 
 * CSV FORMAT EXPECTED:
 * zip,city,state_id,state_name,lat,lng,county
 * 00501,Holtsville,NY,New York,40.8154,-73.0451,Suffolk County
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

// ============================================================================
// CONFIG
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const CSV_FILE_PATH = path.join(__dirname, '../data/zip_codes.csv');
const BATCH_SIZE = 1000; // Insert 1000 ZIP codes at a time

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// TYPES
// ============================================================================

interface ZipCodeCSVRow {
  zip: string;
  city: string;
  state_id: string;      // 2-letter state code
  state_name: string;
  lat: string;
  lng: string;
  county?: string;
  timezone?: string;
}

interface ZipCodeDBRow {
  zip_code: string;
  city: string;
  state_code: string;
  state_name: string;
  latitude: number | null;
  longitude: number | null;
  county: string | null;
  timezone: string | null;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function seedZipCodes() {
  console.log('🚀 ZIP Code Database Seeding Started');
  console.log('=====================================\n');

  // Step 1: Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error('❌ CSV file not found at:', CSV_FILE_PATH);
    console.log('\n📥 Download ZIP code data:');
    console.log('   Option 1: https://simplemaps.com/data/us-zips (free)');
    console.log('   Option 2: https://www.unitedstateszipcodes.org/zip-code-database/');
    console.log('\n📂 Save as: ./data/zip_codes.csv');
    console.log('\n📋 Expected CSV format:');
    console.log('   zip,city,state_id,state_name,lat,lng,county');
    console.log('   00501,Holtsville,NY,New York,40.8154,-73.0451,Suffolk County\n');
    process.exit(1);
  }

  // Step 2: Read and parse CSV
  console.log('📖 Reading CSV file...');
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ZipCodeCSVRow[];

  console.log(`✅ Parsed ${records.length.toLocaleString()} ZIP codes\n`);

  // Step 3: Transform data
  console.log('🔄 Transforming data...');
  const zipCodes: ZipCodeDBRow[] = records.map(row => ({
    zip_code: row.zip.padStart(5, '0'), // Ensure 5 digits (e.g., "00501")
    city: row.city,
    state_code: row.state_id,
    state_name: row.state_name,
    latitude: row.lat ? parseFloat(row.lat) : null,
    longitude: row.lng ? parseFloat(row.lng) : null,
    county: row.county || null,
    timezone: row.timezone || null,
  }));

  console.log(`✅ Transformed ${zipCodes.length.toLocaleString()} records\n`);

  // Step 4: Insert in batches
  console.log('💾 Inserting into database...');
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < zipCodes.length; i += BATCH_SIZE) {
    const batch = zipCodes.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(zipCodes.length / BATCH_SIZE);

    try {
      const { data, error } = await supabase
        .from('zip_codes')
        .upsert(batch, {
          onConflict: 'zip_code',
          ignoreDuplicates: false, // Update if exists
        });

      if (error) {
        console.error(`❌ Batch ${batchNum}/${totalBatches} failed:`, error.message);
        errors += batch.length;
      } else {
        inserted += batch.length;
        process.stdout.write(`\r✅ Progress: ${batchNum}/${totalBatches} batches (${inserted.toLocaleString()} records)`);
      }
    } catch (err) {
      console.error(`\n❌ Batch ${batchNum}/${totalBatches} exception:`, err);
      errors += batch.length;
    }
  }

  console.log('\n\n=====================================');
  console.log('✅ Seeding Complete!');
  console.log(`📊 Total records: ${zipCodes.length.toLocaleString()}`);
  console.log(`✅ Inserted: ${inserted.toLocaleString()}`);
  console.log(`❌ Errors: ${errors.toLocaleString()}`);
  console.log('=====================================\n');

  // Step 5: Verify sample records
  console.log('🔍 Verifying sample records...\n');
  
  const sampleZips = ['94102', '10001', '60601', '90001', '33101'];
  
  for (const zip of sampleZips) {
    const { data, error } = await supabase
      .from('zip_codes')
      .select('zip_code, city, state_code, state_name')
      .eq('zip_code', zip)
      .single();

    if (data) {
      console.log(`✅ ${zip}: ${data.city}, ${data.state_code} (${data.state_name})`);
    } else {
      console.log(`❌ ${zip}: Not found (${error?.message})`);
    }
  }

  console.log('\n🎉 Done! ZIP code database is ready.');
  console.log('💡 Test in your app: Enter ZIP 94102 in Step 1\n');
}

// ============================================================================
// RUN
// ============================================================================

seedZipCodes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });

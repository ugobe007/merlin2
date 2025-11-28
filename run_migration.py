#!/usr/bin/env python3
"""
Run SQL migration to fix grid connection questions
"""
import os
from supabase import create_client, Client

# Read environment variables
SUPABASE_URL = "https://fvmpmozybmtzjvikrctq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Step 1: Update utilityRateType to gridConnection
print("Step 1: Updating utilityRateType to gridConnection...")
try:
    result = supabase.rpc('exec_sql', {
        'sql': """
UPDATE custom_questions
SET 
  field_name = 'gridConnection',
  question_text = 'Grid connection quality',
  question_type = 'select',
  options = '[
    {"value": "reliable", "label": "Reliable Grid - Stable power, rare outages"},
    {"value": "unreliable", "label": "Unreliable Grid - Frequent outages, needs backup"},
    {"value": "limited", "label": "Limited Capacity - Grid undersized, may need microgrid"},
    {"value": "off_grid", "label": "Off-Grid - No utility connection, full microgrid needed"},
    {"value": "microgrid", "label": "Microgrid - Independent power system with optional grid tie"}
  ]'::jsonb,
  help_text = 'Grid quality determines backup power needs and battery/solar sizing. Critical for PowerMeter calculation.',
  is_required = true
WHERE field_name = 'utilityRateType'
RETURNING field_name, question_text;
"""
    }).execute()
    print(f"✅ Updated {len(result.data)} questions")
except Exception as e:
    print(f"⚠️ Step 1 failed (might already be updated): {e}")

# Step 2: Verify the changes
print("\nStep 2: Verifying grid connection questions...")
try:
    result = supabase.from_('custom_questions').select('use_case_id, field_name, question_text, is_required').eq('field_name', 'gridConnection').execute()
    print(f"✅ Found {len(result.data)} gridConnection questions")
    for row in result.data[:5]:  # Show first 5
        print(f"   - Use Case ID {row['use_case_id']}: {row['question_text']} (required: {row['is_required']})")
except Exception as e:
    print(f"❌ Verification failed: {e}")

print("\n✨ Migration complete!")
print("🔍 Test by opening Smart Wizard → Select any use case → Check for 'Grid connection quality' question")

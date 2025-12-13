#!/bin/bash
# ============================================================================
# Deploy Industry-Specific Questions - All 5 Use Cases
# December 12, 2025
# ============================================================================

set -e  # Exit on error

echo "============================================================================"
echo "DEPLOYING INDUSTRY-SPECIFIC QUESTIONS"
echo "5 use cases: EV Charging, Hospital, Warehouse, Manufacturing, Data Center"
echo "============================================================================"
echo ""

# Database connection (use your actual connection string)
DB_URL="${DATABASE_URL:-}"

if [ -z "$DB_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  echo "Export your Supabase connection string:"
  echo "  export DATABASE_URL='postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
  exit 1
fi

echo "✅ Database connection configured"
echo ""

# Function to run migration and verify
deploy_migration() {
  local use_case=$1
  local file=$2
  
  echo "============================================================================"
  echo "DEPLOYING: $use_case"
  echo "File: $file"
  echo "============================================================================"
  
  # Run migration
  psql "$DB_URL" -f "database/migrations/$file"
  
  if [ $? -eq 0 ]; then
    echo "✅ $use_case migration completed successfully"
  else
    echo "❌ $use_case migration FAILED"
    exit 1
  fi
  
  echo ""
}

# Deploy each use case in order
deploy_migration "EV Charging Hub" "20251212_fix_ev_charging_questions.sql"
deploy_migration "Hospital" "20251212_fix_hospital_questions.sql"
deploy_migration "Warehouse" "20251212_fix_warehouse_questions.sql"
deploy_migration "Manufacturing" "20251212_fix_manufacturing_questions.sql"
deploy_migration "Data Center" "20251212_fix_data_center_questions.sql"

echo "============================================================================"
echo "✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY"
echo "============================================================================"
echo ""
echo "Summary:"
echo "  - EV Charging Hub: 16 questions"
echo "  - Hospital: 19 questions"
echo "  - Warehouse: 17 questions"
echo "  - Manufacturing: 19 questions"
echo "  - Data Center: 18 questions"
echo "  - TOTAL: 89 new industry-specific questions"
echo ""
echo "Gas Station (16 questions) already deployed Dec 12, 2025"
echo ""
echo "Next steps:"
echo "  1. Test each use case in StreamlinedWizard"
echo "  2. Verify quote generation with calculateQuote()"
echo "  3. Production testing with Vineet"
echo ""

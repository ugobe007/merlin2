#!/bin/bash
# Apply Office Building Questions Update
# Run this to update the database with the new streamlined questions

echo "🔄 Applying Office Building questions update..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "❌ VITE_SUPABASE_URL not set in environment"
  echo "Please set up your Supabase connection details"
  exit 1
fi

# Apply migration via Supabase SQL Editor
echo "📝 Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "   https://supabase.com/dashboard/project/YOUR_PROJECT/sql"
echo ""
echo "   File: database/migrations/update_office_questions.sql"
echo ""
echo "Or, if you have psql configured with Supabase:"
echo ""
echo "   psql \$DATABASE_URL -f database/migrations/update_office_questions.sql"
echo ""
echo "✅ This will:"
echo "   - Remove old office building questions"
echo "   - Add 13 new streamlined questions"
echo "   - Improve user experience"
echo ""

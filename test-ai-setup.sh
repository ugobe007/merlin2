#!/bin/bash

# Test AI Data Collection System Setup
# Run this to verify everything is configured correctly

echo "🔍 Checking AI Data Collection System..."
echo ""

# Check if Supabase service file exists
if [ -f "src/services/supabase.ts" ]; then
    echo "✅ Supabase client file exists"
else
    echo "❌ Missing: src/services/supabase.ts"
    exit 1
fi

# Check if AI collection service exists
if [ -f "src/services/aiDataCollectionService.ts" ]; then
    echo "✅ AI Data Collection service exists"
else
    echo "❌ Missing: src/services/aiDataCollectionService.ts"
    exit 1
fi

# Check if migration SQL exists
if [ -f "database/supabase_migration.sql" ]; then
    echo "✅ Database migration SQL exists"
else
    echo "❌ Missing: database/supabase_migration.sql"
    exit 1
fi

# Check if EnergyNewsTicker is updated
if grep -q "import { supabase }" "src/components/EnergyNewsTicker.tsx"; then
    echo "✅ Ticker component updated with live data"
else
    echo "❌ Ticker component not updated"
    exit 1
fi

# Check if main.tsx initializes service
if grep -q "initializeAIDataCollection" "src/main.tsx"; then
    echo "✅ Main app initializes AI service"
else
    echo "❌ Main app not initializing AI service"
    exit 1
fi

# Check for environment variables
if [ -f ".env.local" ]; then
    if grep -q "VITE_SUPABASE_URL" ".env.local" && grep -q "VITE_SUPABASE_ANON_KEY" ".env.local"; then
        echo "✅ Environment variables configured"
    else
        echo "⚠️  .env.local exists but missing Supabase variables"
        echo "   Add:"
        echo "   VITE_SUPABASE_URL=https://your-project.supabase.co"
        echo "   VITE_SUPABASE_ANON_KEY=your-anon-key"
    fi
else
    echo "⚠️  No .env.local file found"
    echo "   Create one with:"
    echo "   VITE_SUPABASE_URL=https://your-project.supabase.co"
    echo "   VITE_SUPABASE_ANON_KEY=your-anon-key"
fi

# Check if @supabase/supabase-js is installed
if grep -q "@supabase/supabase-js" "package.json"; then
    echo "✅ Supabase package installed"
else
    echo "❌ Missing @supabase/supabase-js package"
    echo "   Run: npm install @supabase/supabase-js"
    exit 1
fi

echo ""
echo "─────────────────────────────────────────────"
echo "✅ All files in place!"
echo ""
echo "Next steps:"
echo "1. Create Supabase account at https://supabase.com"
echo "2. Create new project"
echo "3. Run migration: database/supabase_migration.sql"
echo "4. Add credentials to .env.local"
echo "5. Run: npm run dev"
echo ""
echo "📖 See AI_DATA_SETUP_GUIDE.md for detailed instructions"
echo "─────────────────────────────────────────────"

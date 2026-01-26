#!/bin/bash

# Google Places API Setup Script
# Run this after implementing the business lookup feature

set -e  # Exit on error

echo "🚀 Setting up Google Places API integration..."
echo ""

# Check Node version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Error: Node.js 18+ required. Current version: $(node --version)"
  echo "   Please upgrade Node.js: https://nodejs.org/"
  exit 1
fi
echo "✅ Node.js $(node --version) detected"
echo ""

# Install dependencies
echo "📦 Installing required dependencies..."
npm install express concurrently
echo "✅ Dependencies installed"
echo ""

# Create server/.env file
echo "🔐 Setting up environment variables..."
if [ ! -f "server/.env" ]; then
  cat > server/.env << 'EOF'
# Google Maps API Key
# Get your key from: https://console.cloud.google.com/apis/credentials
# Required APIs: Places API (New), Maps JavaScript API, Geocoding API
GOOGLE_MAPS_API_KEY=your_google_api_key_here

# Optional: Set custom port (default: 3001)
# PORT=3001
EOF
  echo "✅ Created server/.env file"
  echo "⚠️  IMPORTANT: Edit server/.env and add your Google Maps API key"
else
  echo "ℹ️  server/.env already exists (not overwriting)"
fi
echo ""

# Check if GOOGLE_MAPS_API_KEY is set
if grep -q "your_google_api_key_here" server/.env 2>/dev/null; then
  echo "⚠️  WARNING: Default API key detected in server/.env"
  echo "   Please replace 'your_google_api_key_here' with your actual Google API key"
  echo ""
fi

# Deploy database migration
echo "🗄️  Database migration status:"
echo "   Location: database/migrations/20260122_business_lookup_cache.sql"
echo "   Status: Ready to deploy"
echo ""
echo "   To deploy to Supabase:"
echo "   1. Go to https://supabase.com/dashboard"
echo "   2. Select your project"
echo "   3. Go to SQL Editor"
echo "   4. Copy contents of 20260122_business_lookup_cache.sql"
echo "   5. Paste and click 'Run'"
echo ""

# Fix industry images
echo "🖼️  Industry image fix available:"
echo "   Location: database/migrations/20260122_fix_industry_images.sql"
echo "   Purpose: Fixes broken images in Step 3 industry selection"
echo "   Deploy this to Supabase using the same method as above"
echo ""

# Check if dev scripts are configured
if grep -q "dev:backend" package.json; then
  echo "✅ Development scripts configured"
else
  echo "⚠️  Development scripts not found in package.json"
  echo "   This should have been added automatically"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete! Next steps:"
echo ""
echo "1️⃣  Add your Google Maps API key to server/.env"
echo "   Get your key: https://console.cloud.google.com/apis/credentials"
echo ""
echo "2️⃣  Enable required APIs in Google Cloud Console:"
echo "   • Places API (New)"
echo "   • Maps JavaScript API"
echo "   • Geocoding API"
echo ""
echo "3️⃣  Deploy database migrations to Supabase:"
echo "   • 20260122_business_lookup_cache.sql (business lookup cache)"
echo "   • 20260122_fix_industry_images.sql (fixes Step 3 images)"
echo ""
echo "4️⃣  Start the application:"
echo "   npm run dev"
echo ""
echo "5️⃣  Test the feature:"
echo "   • Navigate to WizardV7 Step 1"
echo "   • Enter ZIP: 89052"
echo "   • Business Name: WOW Car Wash"
echo "   • Click 'Find My Business'"
echo "   • Select a candidate"
echo "   • Verify business card appears"
echo ""
echo "📖 Full documentation: GOOGLE_PLACES_SETUP.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

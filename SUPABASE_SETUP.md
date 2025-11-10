# Supabase Setup Guide for Merlin Pricing System

This guide will help you set up Supabase backend for the Merlin pricing system with daily price validation and configuration management.

## 🏗️ Database Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Choose your organization and project name
4. Select a region close to your users
5. Generate a strong database password

### 2. Run Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `docs/supabase_pricing_schema.sql`
3. Paste and run the SQL to create all tables and functions

The schema creates:
- `pricing_configurations` - Stores complete pricing configurations
- `daily_price_data` - Daily price validation data from market sources
- `pricing_alerts` - Pricing alerts and notifications
- `system_configuration` - Application-wide configuration settings

### 3. Get API Credentials

1. Go to Settings > API in your Supabase dashboard
2. Copy your **Project URL** and **anon public key**

## 🔑 Environment Configuration

### 1. Create Environment File

Create a `.env` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# Optional: Service Role Key for advanced operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ Important:** Add `.env` to your `.gitignore` file to prevent credentials from being committed.

### 2. Environment Variables Explanation

- **VITE_SUPABASE_URL**: Your unique Supabase project URL
- **VITE_SUPABASE_ANON_KEY**: Public anonymous key for client-side operations
- **SUPABASE_SERVICE_ROLE_KEY**: (Optional) Service role key for server-side operations

## 🚀 Features Enabled

### 1. Real-Time Price Configuration Sync
- ✅ Upload local configurations to Supabase
- ✅ Download configurations from Supabase
- ✅ Automatic configuration backup
- ✅ Version control and audit trails

### 2. Daily Price Validation Storage
- ✅ Store daily NREL ATB 2024 validation results
- ✅ Market intelligence data from Bloomberg, Wood Mackenzie
- ✅ Vendor-specific pricing updates (Dynapower, Sinexcel, Great Power, Mainspring)
- ✅ Price deviation alerts and market trend analysis

### 3. Automated Daily Sync Service
- ✅ Runs daily at 6:00 AM UTC
- ✅ Validates pricing against multiple market sources
- ✅ Updates vendor pricing data
- ✅ Backs up configurations
- ✅ Processes and cleans up alerts

### 4. Admin Dashboard Integration
- ✅ Real-time database connectivity status
- ✅ Sync controls (upload/download configurations)
- ✅ Manual daily sync execution
- ✅ Database statistics and health monitoring
- ✅ Alert management and resolution

## 📊 Database Functions

### Size-Weighted BESS Pricing Calculation

The database includes a PostgreSQL function for calculating size-weighted BESS pricing:

```sql
SELECT calculate_bess_pricing(8.5); -- For 8.5 MWh system
-- Returns: ~$130/kWh (interpolated between 2MWh @ $155/kWh and 15MWh @ $105/kWh)
```

### Market Data Queries

```sql
-- Get recent price trends
SELECT * FROM daily_price_data 
WHERE price_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY price_date DESC;

-- Get pricing alerts
SELECT * FROM pricing_alerts 
WHERE resolved_at IS NULL
ORDER BY triggered_at DESC;

-- Get configuration history
SELECT name, version, updated_at, updated_by 
FROM pricing_configurations 
ORDER BY updated_at DESC;
```

## 🛠️ Admin Panel Usage

### 1. Access the Supabase Section

1. Open the Admin Panel (enhanced floating button or `?admin=true` URL)
2. Click on "☁️ Supabase Sync" in the sidebar
3. The panel will show connection status and available actions

### 2. Database Operations

**Check Connection Status:**
- Green: Connected to Supabase - all features available
- Yellow: Database not available - running in local-only mode
- Red: Connection error - check credentials

**Sync Operations:**
- **Sync to Database**: Upload current local configuration to Supabase
- **Load from Database**: Download and apply configuration from Supabase
- **Run Daily Sync**: Execute complete daily validation and sync process

### 3. Monitoring

**Database Statistics:**
- Total configurations stored
- Recent data points (last 7 days)
- Unresolved pricing alerts
- Last sync timestamp

**Daily Sync Service:**
- Service status (Running/Offline)
- Next scheduled sync time
- Automatic operations overview

## 🚨 Troubleshooting

### Connection Issues

1. **"Database not available" message:**
   - Check `.env` file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   - Verify Supabase project is active
   - Check network connectivity

2. **"Permission denied" errors:**
   - Ensure Row Level Security policies are properly configured
   - Check API key permissions
   - Verify database schema was created successfully

3. **Sync failures:**
   - Check browser console for detailed error messages
   - Verify pricing configuration is valid
   - Ensure database tables exist

### Database Setup Issues

1. **Schema creation errors:**
   - Ensure you have database admin permissions
   - Run schema in SQL Editor, not in Query tab
   - Check for syntax errors in the SQL file

2. **Function errors:**
   - Verify PostgreSQL version supports all functions
   - Check for missing extensions (uuid-ossp)
   - Ensure triggers are created successfully

## 📈 Pricing Intelligence Features

### Market Data Sources
- **NREL ATB 2024**: Official DOE utility-scale battery storage costs
- **Bloomberg NEF**: Market intelligence and trend analysis
- **Wood Mackenzie**: Energy market research and pricing data
- **Vendor-Specific**: Real quotes from Dynapower, Sinexcel, Great Power, Mainspring

### Automated Validation
- Daily price checks against market benchmarks
- Deviation alerts (>15% threshold)
- Quality scoring for data reliability
- Historical trend analysis

### Size-Weighted Pricing
- Small systems (≤2 MWh): Premium pricing ($155/kWh)
- Large systems (≥15 MWh): Floor pricing ($105/kWh)
- Linear interpolation for mid-range systems
- Configurable thresholds and price points

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **API Keys**: Use anon keys for client-side, service role keys for server-side only
3. **Row Level Security**: Enable RLS policies to control data access
4. **Data Validation**: All pricing data is validated before storage
5. **Audit Trails**: Complete history of configuration changes and user actions

## 📱 Next Steps

1. **Set up environment variables** and test connection
2. **Run initial sync** to populate database with current configuration
3. **Enable daily sync service** for automated price validation
4. **Configure alert thresholds** based on your risk tolerance
5. **Monitor dashboard** for pricing trends and system health

For support, check the browser console for detailed error messages and ensure all prerequisites are met.
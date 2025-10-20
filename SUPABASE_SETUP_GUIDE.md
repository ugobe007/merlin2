# 🗄️ Supabase Database Setup Guide

## Step 1: Create a New Project

1. Go to your Supabase dashboard: https://supabase.com/dashboard/organizations
2. Click **"New Project"**
3. Fill in:
   - **Name**: `merlin-bess` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., US West, EU Central)
4. Click **"Create new project"** (takes ~2 minutes)

---

## Step 2: Copy Connection Details

Once created, go to **Settings > API** and copy:

```bash
# You'll need these for the .env file:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 3: Create Database Tables

Go to **SQL Editor** in Supabase and run these SQL commands:

### A. Users Table with Tiers
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with tier management
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  company VARCHAR(255),
  
  -- User Tier Management
  tier VARCHAR(20) NOT NULL DEFAULT 'free',
  -- Options: 'free', 'semi_premium', 'premium', 'admin'
  
  -- Access Control
  quotes_remaining INT DEFAULT 3, -- Free users: 3 quotes
  quotes_generated INT DEFAULT 0,
  quotes_saved INT DEFAULT 0,
  max_saved_quotes INT DEFAULT 0, -- Free: 0, Semi: 5, Premium: unlimited
  
  -- Subscription
  subscription_id VARCHAR(255),
  subscription_start TIMESTAMP,
  subscription_end TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Feature Flags
  can_export_word BOOLEAN DEFAULT false,
  can_export_excel BOOLEAN DEFAULT false,
  can_view_calculations BOOLEAN DEFAULT false,
  can_use_advanced_mode BOOLEAN DEFAULT false,
  can_upload_vendor_quotes BOOLEAN DEFAULT false,
  
  CONSTRAINT valid_tier CHECK (tier IN ('free', 'semi_premium', 'premium', 'admin'))
);

-- Create index for email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
```

### B. Use Cases Table
```sql
-- Use cases table (admin-managed templates)
CREATE TABLE use_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  category VARCHAR(50),
  
  -- Tier Access
  required_tier VARCHAR(20) DEFAULT 'free',
  
  -- Power Profile (stored as JSON)
  power_profile JSONB NOT NULL,
  /*
  Example:
  {
    "typicalLoadKw": 35,
    "peakLoadKw": 48,
    "profileType": "peaked",
    "dailyOperatingHours": 12,
    "peakHoursStart": "10:00",
    "peakHoursEnd": "18:00",
    "operatesWeekends": true
  }
  */
  
  -- Equipment List (stored as JSON array)
  equipment JSONB NOT NULL,
  /*
  Example:
  [
    {"name": "Car Wash Bay", "powerKw": 25, "dutyCycle": 0.7},
    {"name": "Water Heater", "powerKw": 15, "dutyCycle": 0.9}
  ]
  */
  
  -- Financial Parameters
  financial_params JSONB NOT NULL,
  /*
  Example:
  {
    "demandChargeSensitivity": 1.3,
    "energyCostMultiplier": 1.0,
    "typicalSavingsPercent": 25,
    "roiAdjustmentFactor": 0.95
  }
  */
  
  -- Recommended Applications (array)
  recommended_applications TEXT[],
  
  -- Custom Questions
  custom_questions JSONB,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  
  -- Usage Stats
  usage_count INT DEFAULT 0,
  average_roi DECIMAL(10,2),
  
  CONSTRAINT valid_required_tier CHECK (required_tier IN ('free', 'semi_premium', 'premium'))
);

-- Indexes
CREATE INDEX idx_use_cases_slug ON use_cases(slug);
CREATE INDEX idx_use_cases_tier ON use_cases(required_tier);
CREATE INDEX idx_use_cases_active ON use_cases(is_active);
```

### C. Saved Quotes Table
```sql
-- Saved quotes table
CREATE TABLE saved_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Quote Data
  quote_name VARCHAR(255) NOT NULL,
  use_case_id UUID REFERENCES use_cases(id),
  
  -- Full wizard configuration (stored as JSON)
  configuration JSONB NOT NULL,
  
  -- Calculated financial results
  financial_results JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP,
  
  -- Sharing
  is_public BOOLEAN DEFAULT false,
  share_token VARCHAR(255) UNIQUE
);

-- Indexes
CREATE INDEX idx_saved_quotes_user ON saved_quotes(user_id);
CREATE INDEX idx_saved_quotes_share_token ON saved_quotes(share_token);
```

### D. System Settings Table
```sql
-- System settings (key-value store)
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('free_tier_quote_limit', '3', 'Number of quotes free users can generate'),
  ('semi_premium_monthly_quotes', '25', 'Monthly quote limit for semi-premium'),
  ('semi_premium_saved_quotes', '5', 'Max saved quotes for semi-premium'),
  ('premium_saved_quotes', '-1', 'Max saved quotes for premium (-1 = unlimited)'),
  ('require_login', 'false', 'Whether login is required to use the app'),
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('semi_premium_price', '19.00', 'Semi-premium monthly price (USD)'),
  ('premium_price', '49.00', 'Premium monthly price (USD)');
```

### E. Admin Activity Log
```sql
-- Admin activity log
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  changes JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Index for admin queries
CREATE INDEX idx_admin_log_admin ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_log_timestamp ON admin_activity_log(timestamp DESC);
```

---

## Step 4: Seed Use Case Data

Run this to add the initial use cases:

```sql
-- Insert Car Wash use case
INSERT INTO use_cases (
  name, slug, description, icon, category, required_tier,
  power_profile, equipment, financial_params, recommended_applications,
  is_active, display_order
) VALUES (
  'Car Wash',
  'car-wash',
  'Car washes have high peak demand from wash bays, water heaters, and vacuum systems.',
  '🚗',
  'commercial',
  'free',
  '{"typicalLoadKw": 35, "peakLoadKw": 48, "profileType": "peaked", "dailyOperatingHours": 12, "peakHoursStart": "10:00", "peakHoursEnd": "18:00", "operatesWeekends": true}',
  '[{"name": "Car Wash Bay", "powerKw": 25, "dutyCycle": 0.7}, {"name": "Water Heater", "powerKw": 15, "dutyCycle": 0.9}]',
  '{"demandChargeSensitivity": 1.3, "energyCostMultiplier": 1.0, "typicalSavingsPercent": 25, "roiAdjustmentFactor": 0.95}',
  ARRAY['peak_shaving', 'demand_response'],
  true,
  1
);

-- Insert Indoor Farm use case
INSERT INTO use_cases (
  name, slug, description, icon, category, required_tier,
  power_profile, equipment, financial_params, recommended_applications,
  is_active, display_order
) VALUES (
  'Indoor Farm',
  'indoor-farm',
  'Indoor farms operate 24/7 with constant high loads from grow lights and HVAC.',
  '🌱',
  'agricultural',
  'semi_premium',
  '{"typicalLoadKw": 180, "peakLoadKw": 250, "profileType": "constant", "dailyOperatingHours": 24, "operatesWeekends": true}',
  '[{"name": "LED Grow Lights", "powerKw": 150, "dutyCycle": 0.9}, {"name": "HVAC System", "powerKw": 60, "dutyCycle": 0.8}]',
  '{"demandChargeSensitivity": 1.5, "energyCostMultiplier": 1.2, "typicalSavingsPercent": 30, "roiAdjustmentFactor": 0.85}',
  ARRAY['peak_shaving', 'time_of_use', 'demand_response', 'backup_power'],
  true,
  2
);

-- Insert Hotel use case
INSERT INTO use_cases (
  name, slug, description, icon, category, required_tier,
  power_profile, equipment, financial_params, recommended_applications,
  is_active, display_order
) VALUES (
  'Hotel',
  'hotel',
  'Hotels have variable loads with morning/evening peaks.',
  '🏨',
  'commercial',
  'free',
  '{"typicalLoadKw": 400, "peakLoadKw": 650, "profileType": "peaked", "dailyOperatingHours": 24, "peakHoursStart": "06:00", "peakHoursEnd": "22:00", "operatesWeekends": true}',
  '[{"name": "HVAC System", "powerKw": 300, "dutyCycle": 0.6}, {"name": "Commercial Kitchen", "powerKw": 150, "dutyCycle": 0.4}]',
  '{"demandChargeSensitivity": 1.4, "energyCostMultiplier": 1.1, "typicalSavingsPercent": 28, "roiAdjustmentFactor": 0.90}',
  ARRAY['peak_shaving', 'demand_response', 'backup_power'],
  true,
  3
);
```

---

## Step 5: Set Up Row Level Security (RLS)

Enable security policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Everyone can read active use cases (for now - we'll add tier checking in app)
CREATE POLICY "Anyone can view active use cases"
  ON use_cases FOR SELECT
  USING (is_active = true);

-- Only admins can modify use cases
CREATE POLICY "Admins can modify use cases"
  ON use_cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tier = 'admin'
    )
  );

-- Users can only see their own saved quotes
CREATE POLICY "Users can view own quotes"
  ON saved_quotes FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

-- Users can create their own quotes
CREATE POLICY "Users can create quotes"
  ON saved_quotes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own quotes
CREATE POLICY "Users can update own quotes"
  ON saved_quotes FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own quotes
CREATE POLICY "Users can delete own quotes"
  ON saved_quotes FOR DELETE
  USING (user_id = auth.uid());

-- Everyone can read system settings
CREATE POLICY "Anyone can view system settings"
  ON system_settings FOR SELECT
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can modify settings"
  ON system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tier = 'admin'
    )
  );
```

---

## Step 6: Enable Authentication

In Supabase Dashboard:

1. Go to **Authentication > Providers**
2. Enable **Email** provider (enabled by default)
3. Optional: Enable **Google OAuth** or **GitHub OAuth** for social login
4. Configure email templates in **Authentication > Email Templates**

---

## Step 7: Create Your Admin Account

```sql
-- Create your admin account (run this AFTER signing up through Supabase Auth UI)
-- Replace 'your-email@example.com' with your actual email

UPDATE users
SET 
  tier = 'admin',
  quotes_remaining = 999999,
  max_saved_quotes = -1,
  can_export_word = true,
  can_export_excel = true,
  can_view_calculations = true,
  can_use_advanced_mode = true,
  can_upload_vendor_quotes = true
WHERE email = 'your-email@example.com';
```

---

## Step 8: Connect to Your React App

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Install Supabase client:

```bash
npm install @supabase/supabase-js
```

Create Supabase client file:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Next Steps

1. ✅ **Test Connection**: Create a simple component that fetches use cases
2. ✅ **Add Auth UI**: Build login/signup forms
3. ✅ **Implement Tier Checking**: Add middleware to check user tier before allowing features
4. ✅ **Build Admin Panel**: Create admin interface to manage use cases

---

## Useful Supabase Commands

```typescript
// Fetch all use cases
const { data, error } = await supabase
  .from('use_cases')
  .select('*')
  .eq('is_active', true)
  .order('display_order');

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Get user's tier
const { data: userData } = await supabase
  .from('users')
  .select('tier, quotes_remaining')
  .eq('id', user.id)
  .single();

// Save a quote
const { error } = await supabase
  .from('saved_quotes')
  .insert({
    user_id: user.id,
    quote_name: 'My Quote',
    configuration: wizardState,
    financial_results: calculatedResults
  });
```

---

## 🎯 Ready to Build!

Once you've completed these steps, you'll have:
- ✅ User authentication with tiers
- ✅ Dynamic use case templates
- ✅ Quote saving functionality
- ✅ Admin control panel foundation
- ✅ Scalable database structure

Let me know when you're ready to start implementing! 🚀

# 🔐 Admin Panel & User Tier System - Implementation Plan

## Overview
Build a comprehensive system administrator panel with user tier management and dynamic use case creation capabilities.

---

## 1. 🎬 Dancing Merlin Video Integration

### Video Location
- **Path**: `src/assets/images/Merlin.video1.mp4`

### Placement Options
**Option A: Loading/Welcome Screen**
- Show dancing Merlin while wizard initializes
- 2-3 second loop, then fade to wizard

**Option B: Success Celebration**
- Replace static Merlin image on completion screen
- Play video when user completes configuration
- More engaging than static bounce

**Option C: Idle State Animation**
- Corner mascot that dances periodically
- Provide tips/encouragement during long steps

**Option D: Login/Splash Screen**
- Welcome users with dancing Merlin
- Brand reinforcement before entering app

**Recommendation**: Use on **completion screen** (most impactful) + **login screen** (brand introduction)

---

## 2. 🗄️ Database Schema Design

### User Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  company VARCHAR(255),
  
  -- User Tier Management
  tier VARCHAR(20) NOT NULL DEFAULT 'free',
    -- Options: 'free', 'semi_premium', 'premium', 'admin'
  
  -- Access Control
  quotes_remaining INT DEFAULT 3, -- Free users: 3 quotes
  quotes_saved INT DEFAULT 0,
  max_saved_quotes INT DEFAULT 0, -- Free: 0, Semi: 5, Premium: unlimited
  
  -- Subscription
  subscription_id VARCHAR(255), -- Stripe/payment integration
  subscription_start DATE,
  subscription_end DATE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Feature Flags
  can_export_word BOOLEAN DEFAULT false,
  can_export_excel BOOLEAN DEFAULT false,
  can_view_calculations BOOLEAN DEFAULT false,
  can_use_advanced_mode BOOLEAN DEFAULT false,
  can_upload_vendor_quotes BOOLEAN DEFAULT false
);
```

### Use Cases Table (Admin-Managed)
```sql
CREATE TABLE use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL, -- "Car Wash", "Indoor Farm", "Hotel"
  slug VARCHAR(255) UNIQUE NOT NULL, -- "car-wash", "indoor-farm"
  description TEXT,
  icon_url VARCHAR(500),
  
  -- Tier Access
  required_tier VARCHAR(20) DEFAULT 'free',
    -- Controls which users can see this use case
  
  -- Financial Model Parameters
  typical_power_draw_kw DECIMAL(10,2), -- Average continuous load
  peak_power_draw_kw DECIMAL(10,2), -- Peak load
  load_profile_type VARCHAR(50), -- "constant", "peaked", "seasonal"
  
  -- Operating Hours
  daily_operating_hours DECIMAL(4,1),
  peak_hours_start TIME,
  peak_hours_end TIME,
  operates_weekends BOOLEAN DEFAULT true,
  
  -- Equipment-Specific Costs
  equipment_list JSONB, -- Array of equipment with power ratings
  /*
  Example:
  {
    "equipment": [
      {"name": "Car Wash Bay", "power_kw": 25, "duty_cycle": 0.7},
      {"name": "Water Heater", "power_kw": 15, "duty_cycle": 0.9},
      {"name": "Vacuum System", "power_kw": 8, "duty_cycle": 0.5}
    ]
  }
  */
  
  -- Financial Multipliers
  demand_charge_sensitivity DECIMAL(5,2) DEFAULT 1.0,
    -- How sensitive to demand charges (1.0 = average)
  
  energy_cost_multiplier DECIMAL(5,2) DEFAULT 1.0,
    -- Adjust base energy costs
  
  incentive_eligibility JSONB,
    -- Which incentives apply to this use case
  
  typical_savings_percent DECIMAL(5,2),
    -- Expected savings percentage
  
  roi_adjustment_factor DECIMAL(5,2) DEFAULT 1.0,
    -- Use case specific ROI modifier
  
  -- Application Configs
  recommended_applications JSONB,
  /*
  Example:
  {
    "primary": ["peak_shaving", "demand_response"],
    "secondary": ["backup_power"]
  }
  */
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0
);
```

### Saved Quotes Table
```sql
CREATE TABLE saved_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Quote Data
  quote_name VARCHAR(255),
  use_case_id UUID REFERENCES use_cases(id),
  configuration JSONB, -- Full wizard state
  financial_results JSONB, -- Calculated results
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP,
  
  -- Sharing
  is_public BOOLEAN DEFAULT false,
  share_token VARCHAR(255) UNIQUE
);
```

### Admin Activity Log
```sql
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100), -- "create_use_case", "update_user_tier", etc.
  target_type VARCHAR(50), -- "use_case", "user", "setting"
  target_id UUID,
  changes JSONB, -- Before/after values
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### System Settings Table
```sql
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example settings:
-- 'free_tier_quote_limit': 3
-- 'semi_premium_saved_quotes': 5
-- 'premium_saved_quotes': -1 (unlimited)
-- 'require_login': false
-- 'maintenance_mode': false
```

---

## 3. 🎭 User Tier Feature Matrix

### Free Tier (Default)
- ✅ 3 quote generations
- ✅ Basic wizard (Simple Mode only)
- ✅ View results on screen
- ✅ Limited use cases (5-6 core ones)
- ❌ No quote saving
- ❌ No Word/Excel export
- ❌ No calculation transparency
- ❌ No Advanced Mode
- ❌ No vendor quote upload

### Semi-Premium Tier ($19/month)
- ✅ 25 quotes per month
- ✅ Save up to 5 quotes
- ✅ Word export
- ✅ Basic calculation view
- ✅ Advanced Mode access
- ✅ 15+ use cases
- ✅ Email support
- ❌ No Excel export
- ❌ No vendor quote upload
- ❌ Limited portfolio features

### Premium Tier ($49/month)
- ✅ Unlimited quotes
- ✅ Unlimited saved quotes
- ✅ Word + Excel export
- ✅ Full calculation transparency
- ✅ Advanced Mode
- ✅ All use cases (30+)
- ✅ Vendor quote upload with AI parsing
- ✅ Full portfolio management
- ✅ Priority support
- ✅ White-label reports
- ✅ API access (future)

### Admin Tier
- ✅ Everything in Premium
- ✅ Admin panel access
- ✅ User management
- ✅ Use case creation/editing
- ✅ System settings control
- ✅ Analytics dashboard
- ✅ Activity logs

---

## 4. 🛠️ Admin Panel Features

### A. Dashboard
```
┌─────────────────────────────────────────┐
│ 🧙 Merlin Admin Panel                   │
├─────────────────────────────────────────┤
│                                         │
│  Total Users:        1,247              │
│  Free:              1,100 (88%)         │
│  Semi-Premium:        120 (10%)         │
│  Premium:              27 (2%)          │
│                                         │
│  Quotes Generated Today:    145         │
│  Active Sessions:            23         │
│                                         │
│  Revenue (MRR):      $3,613             │
│                                         │
└─────────────────────────────────────────┘
```

### B. Use Case Management
```
┌─────────────────────────────────────────────────┐
│ 📋 Use Case Manager                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  [+ Create New Use Case]                        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🚗 Car Wash                     [Edit] [❌] │ │
│  │ Tier: Free | Active | 89 quotes generated  │ │
│  │ Peak Load: 48 kW | Avg: 35 kW             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🌱 Indoor Farm                  [Edit] [❌] │ │
│  │ Tier: Semi-Premium | Active | 12 quotes    │ │
│  │ Peak Load: 250 kW | Avg: 180 kW           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### C. Use Case Editor (Template Builder)
```
┌─────────────────────────────────────────────────┐
│ ✏️  Edit Use Case: Car Wash                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Basic Information                              │
│  ┌─────────────────────────────────────────┐   │
│  │ Name: Car Wash                          │   │
│  │ Slug: car-wash                          │   │
│  │ Icon: 🚗                                │   │
│  │ Required Tier: [Free ▼]                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Power Profile                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Typical Load: 35 kW                     │   │
│  │ Peak Load: 48 kW                        │   │
│  │ Load Profile: [Peaked ▼]                │   │
│  │ Daily Hours: 12 hrs                     │   │
│  │ Peak Hours: 10:00 AM - 6:00 PM          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Equipment List                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 1. Car Wash Bay    | 25 kW  | 70% duty  │   │
│  │ 2. Water Heater    | 15 kW  | 90% duty  │   │
│  │ 3. Vacuum System   | 8 kW   | 50% duty  │   │
│  │    [+ Add Equipment]                    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Financial Parameters                           │
│  ┌─────────────────────────────────────────┐   │
│  │ Demand Charge Sensitivity: 1.3x         │   │
│  │ Energy Cost Multiplier: 1.0x            │   │
│  │ Expected Savings: 22-28%                │   │
│  │ ROI Adjustment: 0.95x                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Recommended Applications                       │
│  ☑ Peak Shaving                                 │
│  ☑ Demand Response                              │
│  ☐ Backup Power                                 │
│  ☐ Time-of-Use Optimization                     │
│                                                 │
│  [Save Use Case] [Test Financial Model] [Cancel]│
└─────────────────────────────────────────────────┘
```

### D. User Management
```
┌─────────────────────────────────────────────────┐
│ 👥 User Management                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Search: [________________] [🔍]                │
│                                                 │
│  Filter: [All Users ▼] [All Tiers ▼]           │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ john@example.com          | Free          │ │
│  │ Joined: Jan 15, 2025 | 2 quotes used     │ │
│  │ [Change Tier] [View Activity] [Disable]  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ sarah@company.com         | Premium       │ │
│  │ Joined: Dec 3, 2024 | 47 quotes saved    │ │
│  │ [Change Tier] [View Activity] [Disable]  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### E. System Settings
```
┌─────────────────────────────────────────────────┐
│ ⚙️  System Settings                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Access Control                                 │
│  ☐ Require Login (Public Access Currently)     │
│  ☐ Maintenance Mode                             │
│                                                 │
│  Free Tier Limits                               │
│  ┌─────────────────────────────────────────┐   │
│  │ Quotes per user: 3                      │   │
│  │ Quote validity: 30 days                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Semi-Premium Tier                              │
│  ┌─────────────────────────────────────────┐   │
│  │ Monthly quotes: 25                      │   │
│  │ Saved quotes: 5                         │   │
│  │ Price: $19.00/month                     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Premium Tier                                   │
│  ┌─────────────────────────────────────────┐   │
│  │ Monthly quotes: Unlimited               │   │
│  │ Saved quotes: Unlimited                 │   │
│  │ Price: $49.00/month                     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Save Changes]                                 │
└─────────────────────────────────────────────────┘
```

---

## 5. 🎨 Use Case Template Examples

### Car Wash Use Case
```javascript
{
  name: "Car Wash",
  slug: "car-wash",
  icon: "🚗",
  requiredTier: "free",
  
  powerProfile: {
    typicalLoadKw: 35,
    peakLoadKw: 48,
    profileType: "peaked",
    dailyHours: 12,
    peakHoursStart: "10:00",
    peakHoursEnd: "18:00",
    operatesWeekends: true
  },
  
  equipment: [
    { name: "Car Wash Bay", powerKw: 25, dutyCycle: 0.7 },
    { name: "Water Heater", powerKw: 15, dutyCycle: 0.9 },
    { name: "Vacuum System", powerKw: 8, dutyCycle: 0.5 },
    { name: "Compressor", powerKw: 5, dutyCycle: 0.6 }
  ],
  
  financialParams: {
    demandChargeSensitivity: 1.3, // High demand charges
    energyCostMultiplier: 1.0,
    typicalSavingsPercent: 25,
    roiAdjustment: 0.95
  },
  
  recommendedApplications: ["peak_shaving", "demand_response"],
  
  customQuestions: [
    {
      question: "How many wash bays?",
      type: "number",
      default: 4,
      multiplier: "equipmentPower" // Scales power by number of bays
    },
    {
      question: "Average cars per day?",
      type: "number",
      default: 100,
      usedIn: "loadCalculation"
    }
  ]
}
```

### Indoor Farm Use Case
```javascript
{
  name: "Indoor Farm",
  slug: "indoor-farm",
  icon: "🌱",
  requiredTier: "semi_premium",
  
  powerProfile: {
    typicalLoadKw: 180,
    peakLoadKw: 250,
    profileType: "constant", // 24/7 operation
    dailyHours: 24,
    operatesWeekends: true
  },
  
  equipment: [
    { name: "LED Grow Lights", powerKw: 150, dutyCycle: 0.9 },
    { name: "HVAC System", powerKw: 60, dutyCycle: 0.8 },
    { name: "Irrigation Pumps", powerKw: 15, dutyCycle: 0.3 },
    { name: "Dehumidifiers", powerKw: 25, dutyCycle: 0.7 }
  ],
  
  financialParams: {
    demandChargeSensitivity: 1.5, // Very high constant load
    energyCostMultiplier: 1.2, // 24/7 operation
    typicalSavingsPercent: 30,
    roiAdjustment: 0.85, // Faster ROI due to constant use
    
    // Special incentives
    incentives: {
      agriculture: 0.15, // 15% agricultural incentive
      sustainability: 0.10 // 10% green building incentive
    }
  },
  
  recommendedApplications: [
    "peak_shaving",
    "time_of_use",
    "demand_response",
    "backup_power"
  ],
  
  customQuestions: [
    {
      question: "Square footage under cultivation?",
      type: "number",
      default: 10000,
      unit: "sq ft",
      multiplier: "equipmentPower"
    },
    {
      question: "Growing method?",
      type: "select",
      options: ["Hydroponics", "Aeroponics", "Soil-based"],
      default: "Hydroponics",
      impactsFactor: "energyCostMultiplier"
    }
  ]
}
```

### Hotel Use Case
```javascript
{
  name: "Hotel",
  slug: "hotel",
  icon: "🏨",
  requiredTier: "free",
  
  powerProfile: {
    typicalLoadKw: 400,
    peakLoadKw: 650,
    profileType: "seasonal", // Varies by season/occupancy
    dailyHours: 24,
    peakHoursStart: "06:00",
    peakHoursEnd: "22:00",
    operatesWeekends: true
  },
  
  equipment: [
    { name: "HVAC System", powerKw: 300, dutyCycle: 0.6 },
    { name: "Kitchen Equipment", powerKw: 150, dutyCycle: 0.4 },
    { name: "Laundry Facilities", powerKw: 100, dutyCycle: 0.5 },
    { name: "Lighting", powerKw: 80, dutyCycle: 0.7 },
    { name: "Elevators", powerKw: 50, dutyCycle: 0.3 }
  ],
  
  financialParams: {
    demandChargeSensitivity: 1.4,
    energyCostMultiplier: 1.1,
    typicalSavingsPercent: 28,
    roiAdjustment: 0.90,
    
    // Occupancy-based calculation
    occupancyFactor: 0.75 // Average 75% occupancy
  },
  
  recommendedApplications: [
    "peak_shaving",
    "demand_response",
    "backup_power",
    "ev_charging" // For guest EVs
  ],
  
  customQuestions: [
    {
      question: "Number of rooms?",
      type: "number",
      default: 150,
      multiplier: "systemSize"
    },
    {
      question: "Average occupancy rate?",
      type: "percentage",
      default: 75,
      impactsFactor: "occupancyFactor"
    },
    {
      question: "On-site restaurant?",
      type: "boolean",
      default: true,
      additionalLoadKw: 80
    }
  ]
}
```

---

## 6. 🔧 Technical Implementation Plan

### Phase 1: Database Setup (Week 1)
- [ ] Set up PostgreSQL/Supabase
- [ ] Create all tables (users, use_cases, saved_quotes, etc.)
- [ ] Seed initial use cases (EV, Data Center, Manufacturing, Car Wash, Indoor Farm)
- [ ] Set up migrations and version control

### Phase 2: Authentication (Week 1-2)
- [ ] Implement user registration/login
- [ ] Add JWT or session-based auth
- [ ] Create protected routes
- [ ] Add tier-based middleware

### Phase 3: User Tier System (Week 2)
- [ ] Implement tier checking logic
- [ ] Add quote counting/limiting
- [ ] Create upgrade prompts
- [ ] Build payment integration (Stripe)

### Phase 4: Admin Panel UI (Week 3)
- [ ] Build admin login/dashboard
- [ ] Create use case manager interface
- [ ] Build use case template editor
- [ ] Add user management interface
- [ ] Create system settings panel

### Phase 5: Dynamic Use Case Engine (Week 3-4)
- [ ] Build use case renderer
- [ ] Implement custom question system
- [ ] Create financial calculation engine that reads from use case templates
- [ ] Add use case-specific ROI calculations

### Phase 6: Dancing Merlin Integration (Week 4)
- [ ] Add video player component
- [ ] Implement on completion screen
- [ ] Add to login/welcome screen
- [ ] Optimize video loading

### Phase 7: Portfolio Features (Week 5)
- [ ] Save quote functionality
- [ ] Quote management dashboard
- [ ] Share quote feature
- [ ] Quote comparison tool

### Phase 8: Testing & Deployment (Week 6)
- [ ] Test all tier restrictions
- [ ] Test use case templates
- [ ] Security audit
- [ ] Performance optimization
- [ ] Deploy to production

---

## 7. 🎯 Immediate Next Steps

**Priority 1: Database Check**
- [ ] Verify Supabase database can handle user states
- [ ] Test tier-based access control
- [ ] Confirm quote saving works with tiers

**Priority 2: Dancing Merlin**
- [ ] Implement video on completion screen
- [ ] Test across browsers

**Priority 3: Admin Panel MVP**
- [ ] Build basic admin login
- [ ] Create simple use case viewer
- [ ] Add one template (Car Wash) as proof of concept

**Priority 4: User Tier Framework**
- [ ] Add tier checking to BessQuoteBuilder
- [ ] Show upgrade prompts
- [ ] Limit features based on tier

---

## 8. 📊 Success Metrics

### User Engagement
- Free tier conversion rate to paid (target: 5%)
- Average quotes per user
- Feature usage by tier
- Quote save/portfolio usage

### Admin Efficiency
- Time to create new use case (target: <15 minutes)
- Use case usage statistics
- User tier distribution

### Revenue
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (CLV)
- Churn rate by tier

---

## Questions to Clarify

1. **Database**: Are you using Supabase already, or do we need to set it up?
2. **Payment**: Prefer Stripe for subscriptions?
3. **Auth**: Want to build custom or use Supabase Auth/Auth0?
4. **Priority**: Should we start with dancing Merlin (quick win) or database setup (foundation)?
5. **Use Cases**: How many initial use cases do you want to launch with?

This is an **excellent strategic direction** for Merlin! 🧙‍♂️✨

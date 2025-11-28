# 🔄 Data Integration Strategy: Merlin2 Complete Architecture

**Date**: November 13, 2025  
**Purpose**: Unify `useCaseTemplates.ts` + `bessDataService.ts` → Supabase Database

---

## 🎯 THE PROBLEM

You currently have **3 separate data sources** that need to work together:

### 1. **Frontend Templates** (`/src/data/useCaseTemplates.ts`)
- ✅ 9 comprehensive use case templates
- ✅ Equipment-level power profiles (100+ items)
- ✅ Custom questions for UI (40+)
- ✅ Industry standards citations (NREL, ASHRAE, IEEE)
- ❌ **Static TypeScript file** - Can't be updated without redeploying
- ❌ **Not user-customizable** - Everyone sees same templates
- ❌ **No version control** - Can't A/B test or roll back changes

### 2. **Calculation Engine** (`/src/services/bessDataService.ts`)
- ✅ Financial modeling (NPV, IRR, LCOS, payback)
- ✅ BESS sizing algorithms (peak shaving, backup, arbitrage)
- ✅ Revenue modeling (demand charges, ancillary services)
- ✅ 5 use case energy profiles (Hotel, Data Center, Car Wash, Retail, Vertical Farm)
- ❌ **Duplicates template data** - Car Wash exists in both places
- ❌ **No database backing** - All calculations happen in memory
- ❌ **Not cacheable** - Same inputs recalculated every time

### 3. **Database Schema** (`/docs/SUPABASE_SCHEMA.sql`)
- ✅ `saved_projects` table exists (saves user quotes)
- ✅ `calculation_cache` table exists (caches results)
- ❌ **No `use_case_templates` table** - Templates not in database
- ❌ **No `equipment_database` table** - Equipment specs not stored
- ❌ **Incomplete mapping** - `project_data` is generic JSONB blob

---

## 🏗️ THE SOLUTION: Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: DATABASE (Source of Truth)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📁 Supabase PostgreSQL Tables                                   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ use_case_templates (NEW)                                │    │
│  │ ├─ id, slug, name, description, category                │    │
│  │ ├─ power_profile_json (JSONB: typicalLoadKw, peakLoadKw)│    │
│  │ ├─ financial_params_json (JSONB: demand sensitivity)    │    │
│  │ ├─ custom_questions_json (JSONB: array of questions)    │    │
│  │ ├─ solar_compatibility_json (JSONB: solar settings)     │    │
│  │ ├─ industry_standards_json (JSONB: NREL, ASHRAE refs)   │    │
│  │ ├─ icon, image_url, display_order                        │    │
│  │ ├─ is_active, version, created_at, updated_at           │    │
│  │ └─ created_by, approved_by (admin control)              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ equipment_database (NEW)                                │    │
│  │ ├─ id, use_case_template_id (FK)                        │    │
│  │ ├─ name, power_kw, duty_cycle, description              │    │
│  │ ├─ manufacturer, model, data_source                     │    │
│  │ ├─ display_order, is_active                             │    │
│  │ └─ validation_notes (industry standard reference)       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ saved_projects (EXISTING - Enhanced)                    │    │
│  │ ├─ id, user_id, project_name                            │    │
│  │ ├─ use_case_template_id (NEW FK)                        │    │
│  │ ├─ project_data (JSONB: wizard state)                   │    │
│  │ ├─ calculated_results (JSONB: NPV, IRR, etc.)          │    │
│  │ ├─ power_mw, duration_hours, location, use_case         │    │
│  │ └─ estimated_cost, status, created_at                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ calculation_cache (EXISTING - Enhanced)                 │    │
│  │ ├─ id, input_hash (MD5 of inputs)                       │    │
│  │ ├─ calculation_type (financial|sizing|solar)            │    │
│  │ ├─ input_data (JSONB: request params)                   │    │
│  │ ├─ calculation_results (JSONB: output)                  │    │
│  │ ├─ calculation_version (2.1.0)                          │    │
│  │ ├─ execution_time_ms                                    │    │
│  │ └─ expires_at (7 days default)                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 2: SERVICES (Business Logic)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📄 /src/services/dataIntegrationService.ts (NEW)               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Unified API that combines all data sources              │    │
│  │                                                          │    │
│  │ export async function getUseCaseWithCalculations({      │    │
│  │   slug: string,                                         │    │
│  │   facilitySize: number,                                 │    │
│  │   location: string,                                     │    │
│  │   solarEnabled?: boolean                                │    │
│  │ }) {                                                     │    │
│  │   // 1. Fetch template from database                    │    │
│  │   const template = await fetchUseCaseFromDB(slug);      │    │
│  │                                                          │    │
│  │   // 2. Get equipment details                           │    │
│  │   const equipment = await fetchEquipmentFromDB(         │    │
│  │     template.id                                         │    │
│  │   );                                                     │    │
│  │                                                          │    │
│  │   // 3. Check cache first                               │    │
│  │   const cacheKey = generateCacheKey({                   │    │
│  │     slug, facilitySize, location                        │    │
│  │   });                                                    │    │
│  │   const cached = await checkCalculationCache(cacheKey); │    │
│  │   if (cached) return { ...cached, fromCache: true };    │    │
│  │                                                          │    │
│  │   // 4. Run calculations (bessDataService)              │    │
│  │   const bessCalcs = calculateBESSFinancials({...});     │    │
│  │   const sizing = generateBESSSizing({...});             │    │
│  │                                                          │    │
│  │   // 5. Add solar if enabled                            │    │
│  │   let solar = null;                                     │    │
│  │   if (solarEnabled && template.solar_compatibility) {   │    │
│  │     solar = calculateSolarBESSSystem({...});            │    │
│  │   }                                                      │    │
│  │                                                          │    │
│  │   // 6. Cache results                                   │    │
│  │   await saveToCalculationCache(cacheKey, results);      │    │
│  │                                                          │    │
│  │   // 7. Return unified object                           │    │
│  │   return {                                              │    │
│  │     template,                                           │    │
│  │     equipment,                                          │    │
│  │     calculations: {                                     │    │
│  │       financial: bessCalcs,                             │    │
│  │       sizing,                                           │    │
│  │       solar                                             │    │
│  │     },                                                   │    │
│  │     fromCache: false                                    │    │
│  │   };                                                     │    │
│  │ }                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  📄 /src/services/bessDataService.ts (EXISTING - Refactored)   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Pure calculation functions (no data storage)            │    │
│  │                                                          │    │
│  │ • calculateBESSFinancials() → NPV, IRR, payback         │    │
│  │ • generateBESSSizing() → Power, duration, capacity      │    │
│  │ • calculateLCOS() → Levelized cost of storage           │    │
│  │ • modelRevenueStreams() → Arbitrage, demand charges     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  📄 /src/services/solarSizingService.ts (NEW)                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Solar calculations from eosense.com data                │    │
│  │                                                          │    │
│  │ • calculateSolarBESSSystem() → Panel wattage, battery   │    │
│  │ • getPeakSunHours() → Location-based PSH                │    │
│  │ • getTemperatureDerating() → Temperature factors        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  📄 /src/services/templateSyncService.ts (NEW)                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Syncs useCaseTemplates.ts → Database (one-time)         │    │
│  │                                                          │    │
│  │ • migrateTemplatesToDatabase() → Upload all 9 templates │    │
│  │ • syncEquipmentToDatabase() → Upload 100+ equipment     │    │
│  │ • validateMigration() → Check data integrity            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           LAYER 3: COMPONENTS (User Interface)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  React Components use unified API:                               │
│                                                                   │
│  const { template, equipment, calculations } =                   │
│    await getUseCaseWithCalculations({                            │
│      slug: 'car-wash',                                           │
│      facilitySize: 10000,                                        │
│      location: 'Los Angeles, CA',                                │
│      solarEnabled: true                                          │
│    });                                                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA ADDITIONS

### **NEW TABLE: `use_case_templates`**

```sql
CREATE TABLE IF NOT EXISTS use_case_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    image_url TEXT,
    category VARCHAR(50) DEFAULT 'commercial',
    
    -- Access Control
    required_tier VARCHAR(20) DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    
    -- Power Profile (from useCaseTemplates.ts)
    power_profile JSONB NOT NULL,
    -- Example: {
    --   "typicalLoadKw": 38,
    --   "peakLoadKw": 53,
    --   "profileType": "peaked",
    --   "dailyOperatingHours": 12,
    --   "peakHoursStart": "10:00",
    --   "peakHoursEnd": "18:00",
    --   "operatesWeekends": true,
    --   "seasonalVariation": 1.2
    -- }
    
    -- Financial Parameters (from useCaseTemplates.ts)
    financial_params JSONB NOT NULL,
    -- Example: {
    --   "demandChargeSensitivity": 1.3,
    --   "energyCostMultiplier": 1.0,
    --   "typicalSavingsPercent": 25,
    --   "roiAdjustmentFactor": 0.95,
    --   "peakDemandPenalty": 1.2
    -- }
    
    -- Solar Compatibility (NEW - from audit)
    solar_compatibility JSONB DEFAULT NULL,
    -- Example: {
    --   "recommended": true,
    --   "value": "high",
    --   "useCases": ["off-grid", "peak-shaving", "arbitrage"],
    --   "typicalSolarRatio": 1.5,
    --   "autonomyDays": 3,
    --   "notes": "Excellent for solar integration"
    -- }
    
    -- Custom Questions (from useCaseTemplates.ts)
    custom_questions JSONB DEFAULT '[]',
    -- Example: [{
    --   "id": "num_bays",
    --   "question": "How many wash bays do you have?",
    --   "type": "number",
    --   "default": 4,
    --   "unit": "bays",
    --   "impactType": "power_scaling"
    -- }]
    
    -- Recommended Applications
    recommended_applications VARCHAR(50)[] DEFAULT '{}',
    -- Example: ['peak_shaving', 'demand_response']
    
    -- Industry Standards
    industry_standards JSONB DEFAULT '{}',
    -- Example: {
    --   "nrel": "Commercial Reference Building data",
    --   "ashrae": "90.1 Standard Energy Code",
    --   "ieee": "2450 Battery Standards",
    --   "epri": "Energy Storage Database"
    -- }
    
    -- Version Control
    version VARCHAR(10) DEFAULT '1.0.0',
    changelog TEXT,
    
    -- Admin Control
    created_by UUID REFERENCES user_profiles(id),
    approved_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Usage Tracking
    times_used INTEGER DEFAULT 0,
    times_saved INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_use_case_templates_slug ON use_case_templates(slug);
CREATE INDEX idx_use_case_templates_category ON use_case_templates(category);
CREATE INDEX idx_use_case_templates_active ON use_case_templates(is_active);
CREATE INDEX idx_use_case_templates_tier ON use_case_templates(required_tier);
```

### **NEW TABLE: `equipment_database`**

```sql
CREATE TABLE IF NOT EXISTS equipment_database (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationship
    use_case_template_id UUID REFERENCES use_case_templates(id) ON DELETE CASCADE,
    
    -- Equipment Details (from useCaseTemplates.ts)
    name VARCHAR(255) NOT NULL,
    power_kw DECIMAL(10,3) NOT NULL,
    duty_cycle DECIMAL(4,3) NOT NULL CHECK (duty_cycle >= 0 AND duty_cycle <= 1),
    description TEXT,
    
    -- Data Validation
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    data_source VARCHAR(255), -- e.g., "EPRI: 20-30kW per bay"
    validation_notes TEXT,
    
    -- Display
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_equipment_use_case ON equipment_database(use_case_template_id);
CREATE INDEX idx_equipment_active ON equipment_database(is_active);
```

### **ENHANCED TABLE: `saved_projects`**

```sql
-- Add foreign key to use_case_templates
ALTER TABLE saved_projects 
ADD COLUMN use_case_template_id UUID REFERENCES use_case_templates(id);

-- Add index
CREATE INDEX idx_saved_projects_template ON saved_projects(use_case_template_id);

-- Update project_data structure documentation:
-- project_data JSONB should contain:
-- {
--   "wizard": {
--     "powerMW": 1,
--     "standbyHours": 2,
--     "gridMode": "On-grid",
--     "useCase": "car-wash",
--     "facilitySize": 10000,
--     "location": "Los Angeles, CA",
--     "customAnswers": { "num_bays": 4 }
--   },
--   "calculations": {
--     "financial": { "npv": 500000, "irr": 0.15, "payback": 6.5 },
--     "sizing": { "batteryCapacitykWh": 4000, "powerRatingkW": 1000 },
--     "solar": { "panelWattage": 6000, "batteryAh": 833 }
--   },
--   "template_version": "1.0.0",
--   "calculation_version": "2.1.0"
-- }
```

---

## 🔄 MIGRATION PLAN

### **Phase 1: Database Setup** (Week 1)

**Task 1.1**: Create new tables
```bash
# Run SQL in Supabase SQL Editor
psql -f /docs/03_USE_CASE_TABLES.sql
```

**Task 1.2**: Create migration service
```typescript
// /src/services/templateMigrationService.ts

import { USE_CASE_TEMPLATES } from '../data/useCaseTemplates';
import { supabase } from './supabaseClient';

export async function migrateTemplatesToDatabase() {
  console.log('Starting template migration...');
  
  for (const template of USE_CASE_TEMPLATES) {
    // 1. Insert template
    const { data: templateData, error: templateError } = await supabase
      .from('use_case_templates')
      .insert({
        slug: template.slug,
        name: template.name,
        description: template.description,
        icon: template.icon,
        image_url: template.image,
        category: template.category,
        required_tier: template.requiredTier,
        is_active: template.isActive,
        display_order: template.displayOrder,
        power_profile: template.powerProfile,
        financial_params: template.financialParams,
        custom_questions: template.customQuestions,
        recommended_applications: template.recommendedApplications,
        version: '1.0.0'
      })
      .select()
      .single();
    
    if (templateError) {
      console.error(`Error migrating ${template.slug}:`, templateError);
      continue;
    }
    
    console.log(`✅ Migrated template: ${template.name}`);
    
    // 2. Insert equipment
    if (template.equipment && template.equipment.length > 0) {
      const equipmentRecords = template.equipment.map((eq, index) => ({
        use_case_template_id: templateData.id,
        name: eq.name,
        power_kw: eq.powerKw,
        duty_cycle: eq.dutyCycle,
        description: eq.description,
        display_order: index
      }));
      
      const { error: equipmentError } = await supabase
        .from('equipment_database')
        .insert(equipmentRecords);
      
      if (equipmentError) {
        console.error(`Error migrating equipment for ${template.slug}:`, equipmentError);
      } else {
        console.log(`✅ Migrated ${template.equipment.length} equipment items`);
      }
    }
  }
  
  console.log('Migration complete!');
}
```

**Task 1.3**: Run migration (one-time)
```typescript
// Add to AdminDashboard.tsx or create migration UI
<button onClick={migrateTemplatesToDatabase}>
  🔄 Migrate Templates to Database
</button>
```

### **Phase 2: Create Unified Service** (Week 2)

**Task 2.1**: Build `dataIntegrationService.ts`
```typescript
// /src/services/dataIntegrationService.ts

import { supabase } from './supabaseClient';
import { 
  calculateBESSFinancials, 
  generateBESSSizing 
} from './bessDataService';
import { calculateSolarBESSSystem } from './solarSizingService';
import crypto from 'crypto';

interface GetUseCaseParams {
  slug: string;
  facilitySize: number;
  location: string;
  customAnswers?: Record<string, any>;
  solarEnabled?: boolean;
}

export async function getUseCaseWithCalculations(params: GetUseCaseParams) {
  const { slug, facilitySize, location, customAnswers, solarEnabled } = params;
  
  // 1. Fetch template from database
  const { data: template, error: templateError } = await supabase
    .from('use_case_templates')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  
  if (templateError || !template) {
    throw new Error(`Template not found: ${slug}`);
  }
  
  // 2. Fetch equipment
  const { data: equipment, error: equipmentError } = await supabase
    .from('equipment_database')
    .select('*')
    .eq('use_case_template_id', template.id)
    .eq('is_active', true)
    .order('display_order');
  
  if (equipmentError) {
    throw new Error(`Error fetching equipment: ${equipmentError.message}`);
  }
  
  // 3. Check calculation cache
  const cacheKey = generateCacheKey({ slug, facilitySize, location, customAnswers });
  const cached = await checkCalculationCache(cacheKey);
  
  if (cached && cached.calculation_version === '2.1.0') {
    console.log('✅ Using cached calculations');
    return {
      template,
      equipment,
      calculations: cached.calculation_results,
      fromCache: true
    };
  }
  
  // 4. Run fresh calculations
  console.log('🔄 Running fresh calculations...');
  
  const bessCalculations = calculateBESSFinancials({
    powerRatingMW: template.power_profile.peakLoadKw / 1000,
    durationHours: 4, // default, can be customized
    // ... other params from template.financial_params
  });
  
  const sizing = generateBESSSizing({
    peakLoadkW: template.power_profile.peakLoadKw,
    dailyOperatingHours: template.power_profile.dailyOperatingHours,
    // ... sizing logic
  });
  
  // 5. Add solar if enabled
  let solarCalculations = null;
  if (solarEnabled && template.solar_compatibility?.recommended) {
    solarCalculations = calculateSolarBESSSystem({
      dailyLoadkWh: sizing.energyCapacitykWh / template.power_profile.dailyOperatingHours,
      peakLoadkW: template.power_profile.peakLoadKw,
      location,
      autonomyDays: template.solar_compatibility.autonomyDays || 3,
      systemVoltage: 480,
      temperatureC: 20
    });
  }
  
  const results = {
    financial: bessCalculations,
    sizing,
    solar: solarCalculations
  };
  
  // 6. Cache results
  await saveToCalculationCache(cacheKey, results);
  
  // 7. Update usage stats
  await supabase
    .from('use_case_templates')
    .update({ times_used: template.times_used + 1 })
    .eq('id', template.id);
  
  return {
    template,
    equipment,
    calculations: results,
    fromCache: false
  };
}

function generateCacheKey(params: any): string {
  const str = JSON.stringify(params, Object.keys(params).sort());
  return crypto.createHash('md5').update(str).digest('hex');
}

async function checkCalculationCache(inputHash: string) {
  const { data, error } = await supabase
    .from('calculation_cache')
    .select('*')
    .eq('input_hash', inputHash)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  return error ? null : data;
}

async function saveToCalculationCache(inputHash: string, results: any) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  
  await supabase
    .from('calculation_cache')
    .upsert({
      input_hash: inputHash,
      calculation_type: 'unified',
      input_data: { inputHash }, // Store hash as reference
      calculation_results: results,
      calculation_version: '2.1.0',
      expires_at: expiresAt.toISOString()
    });
}
```

### **Phase 3: Update Components** (Week 3)

**Task 3.1**: Refactor wizard to use unified service
```typescript
// /src/hooks/useBessQuoteBuilder.ts

import { getUseCaseWithCalculations } from '../services/dataIntegrationService';

// Replace direct imports from useCaseTemplates.ts with:
const fetchUseCaseData = async (slug: string) => {
  const data = await getUseCaseWithCalculations({
    slug,
    facilitySize: squareFeet,
    location: `${city}, ${country}`,
    customAnswers: {
      num_bays: customAnswers.num_bays,
      // ... other answers
    },
    solarEnabled: solarMWp > 0
  });
  
  return data;
};
```

**Task 3.2**: Add cache busting UI
```typescript
// AdminDashboard.tsx

const clearCalculationCache = async () => {
  const { error } = await supabase
    .from('calculation_cache')
    .delete()
    .lt('expires_at', new Date().toISOString());
  
  if (!error) {
    alert('✅ Cache cleared!');
  }
};
```

### **Phase 4: Save Quotes Enhanced** (Week 4)

**Task 4.1**: Update save quote logic
```typescript
// /src/hooks/useBessQuoteBuilder.ts

const handleSaveProject = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    setShowAuthModal(true);
    return;
  }
  
  // Get template ID from database
  const { data: template } = await supabase
    .from('use_case_templates')
    .select('id')
    .eq('slug', useCase)
    .single();
  
  // Save project with template reference
  const { error } = await supabase
    .from('saved_projects')
    .insert({
      user_id: user.id,
      use_case_template_id: template?.id,
      project_name: quoteName,
      description: `${useCase} BESS project`,
      project_data: {
        wizard: {
          powerMW,
          standbyHours,
          gridMode,
          useCase,
          facilitySize: squareFeet,
          location: `${city}, ${country}`,
          customAnswers
        },
        calculations: {
          financial: { npv, irr, payback },
          sizing: { batteryCapacitykWh, powerRatingkW },
          solar: solarEnabled ? { panelWattage, batteryAh } : null
        },
        template_version: template?.version || '1.0.0',
        calculation_version: '2.1.0'
      },
      power_mw: powerMW,
      duration_hours: standbyHours,
      location: `${city}, ${country}`,
      country,
      use_case: useCase,
      estimated_cost: totalProjectCost,
      status: 'draft'
    });
  
  if (error) {
    console.error('Save error:', error);
    alert('❌ Error saving project');
  } else {
    alert('✅ Project saved successfully!');
    window.dispatchEvent(new Event('portfolio-refresh'));
  }
};
```

---

## 🎯 BENEFITS OF THIS ARCHITECTURE

### **1. Single Source of Truth** ✅
- Database contains ALL templates, equipment, and calculations
- No more duplicate data between files
- Version control for templates (can roll back changes)

### **2. Dynamic Updates** ✅
- Admins can add/edit templates without redeploying
- A/B test different templates
- Disable outdated templates instantly

### **3. Performance** ✅
- Calculation cache reduces load (7-day expiry)
- Database queries optimized with indexes
- Lazy loading for equipment details

### **4. User Experience** ✅
- Faster quote generation (cached results)
- Consistent data across all components
- Real-time template updates

### **5. Analytics** ✅
- Track which templates are most used
- Monitor calculation performance
- User behavior insights (times_saved, avg_rating)

### **6. Scalability** ✅
- Easy to add new templates via admin UI
- Support for custom user templates
- Multi-tenant ready (user-specific templates)

---

## 📋 MIGRATION CHECKLIST

### **Database Setup**
- [ ] Create `use_case_templates` table
- [ ] Create `equipment_database` table
- [ ] Add `use_case_template_id` FK to `saved_projects`
- [ ] Create indexes for performance
- [ ] Set up Row Level Security (RLS) policies

### **Services**
- [ ] Create `templateMigrationService.ts`
- [ ] Run one-time migration (9 templates + 100+ equipment)
- [ ] Validate migrated data
- [ ] Create `dataIntegrationService.ts`
- [ ] Create `solarSizingService.ts`
- [ ] Refactor `bessDataService.ts` (pure calculations only)

### **Components**
- [ ] Update `useBessQuoteBuilder.ts` to use unified service
- [ ] Add cache status indicator in UI
- [ ] Create admin UI for template management
- [ ] Add "Clear Cache" button in admin panel
- [ ] Update save/load logic to use template IDs

### **Testing**
- [ ] Test template fetching from database
- [ ] Verify calculation cache works
- [ ] Test save/load with new structure
- [ ] Benchmark performance (before vs after)
- [ ] Test with 100+ concurrent users

### **Documentation**
- [ ] Update API documentation
- [ ] Create admin guide for template management
- [ ] Document database schema
- [ ] Add migration rollback plan

---

## 🚨 ROLLBACK PLAN

If migration fails, keep `useCaseTemplates.ts` as fallback:

```typescript
// /src/services/dataIntegrationService.ts

export async function getUseCaseWithCalculations(params: GetUseCaseParams) {
  try {
    // Try database first
    return await fetchFromDatabase(params);
  } catch (error) {
    console.warn('Database fetch failed, falling back to static templates');
    
    // Fallback to useCaseTemplates.ts
    return await fetchFromStaticTemplates(params);
  }
}
```

---

## 📊 EXPECTED PERFORMANCE

**Before Integration**:
- Template load: ~5ms (static file)
- Calculation: ~200ms (no caching)
- Total: ~205ms

**After Integration**:
- Template load: ~50ms (database + network)
- Calculation (cached): ~10ms
- Calculation (fresh): ~200ms + cache save ~50ms
- Total (cached): ~60ms ⚡ **70% faster for repeat requests**
- Total (fresh): ~300ms (slower first time, but cached for 7 days)

**Cache Hit Rate Projection**: 60-80% for typical users

---

## 🎓 NEXT STEPS

1. **Review this strategy** - Confirm approach with team
2. **Create database tables** - Run SQL scripts
3. **Run migration** - One-time data transfer
4. **Build unified service** - `dataIntegrationService.ts`
5. **Update components** - Integrate new service
6. **Test thoroughly** - Performance, accuracy, UX
7. **Deploy gradually** - Feature flag for rollout

**Estimated Timeline**: 4 weeks for complete integration

---

**Questions? Start with Phase 1 and we'll iterate from there!** 🚀

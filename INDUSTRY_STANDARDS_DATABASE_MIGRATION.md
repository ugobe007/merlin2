# Industry Standards Database Migration Plan

## Overview
This document outlines the plan for migrating industry standards from code-based configuration to a Supabase database. This is a **long-term enhancement** that provides version history, admin UI, and easier updates without code changes.

## Current State (Code-Based)
- **Location**: `src/config/industryStandards.ts`
- **Pros**: Type-safe, version controlled, fast access
- **Cons**: Requires code deployment for updates, no audit trail, no admin UI

## Target State (Database-Based)
- **Location**: Supabase database table
- **Pros**: Admin UI, version history, no deployment needed, audit trail
- **Cons**: Requires database setup, network latency, more complexity

## Migration Phases

### Phase 1: Database Schema Design ⏳ (Not Started)

#### Supabase Tables

**Table: `industry_standards`**
```sql
CREATE TABLE industry_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_key VARCHAR(50) UNIQUE NOT NULL,
  base_power_mw DECIMAL(10,2) NOT NULL,
  base_duration_hrs DECIMAL(10,2) NOT NULL,
  solar_ratio DECIMAL(10,2) NOT NULL,
  scale_factor DECIMAL(10,2) NOT NULL,
  scale_unit VARCHAR(100) NOT NULL,
  power_source TEXT NOT NULL,
  equipment_source TEXT NOT NULL,
  last_updated VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

-- Index for quick lookups
CREATE INDEX idx_industry_key ON industry_standards(industry_key);
CREATE INDEX idx_active ON industry_standards(is_active);
```

**Table: `ai_optimal_standards`**
```sql
CREATE TABLE ai_optimal_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_key VARCHAR(50) UNIQUE NOT NULL,
  power_mw DECIMAL(10,2) NOT NULL,
  duration_hrs DECIMAL(10,2) NOT NULL,
  solar_ratio DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (industry_key) REFERENCES industry_standards(industry_key)
);
```

**Table: `template_defaults`**
```sql
CREATE TABLE template_defaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_key VARCHAR(50) UNIQUE NOT NULL,
  mw DECIMAL(10,2) NOT NULL,
  hours DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (industry_key) REFERENCES industry_standards(industry_key)
);
```

**Table: `industry_standards_history`** (Audit Trail)
```sql
CREATE TABLE industry_standards_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_key VARCHAR(50) NOT NULL,
  field_changed VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT NOW(),
  changed_by VARCHAR(100),
  change_reason TEXT,
  quarter VARCHAR(10) -- e.g., "2026-Q1"
);

CREATE INDEX idx_history_industry ON industry_standards_history(industry_key);
CREATE INDEX idx_history_date ON industry_standards_history(changed_at);
```

### Phase 2: Data Migration Script ⏳ (Not Started)

Create migration script to populate database from current config:

```typescript
// scripts/migrate-industry-standards-to-db.ts
import { createClient } from '@supabase/supabase-js';
import { INDUSTRY_STANDARDS, AI_OPTIMAL_STANDARDS, TEMPLATE_DEFAULTS } from '../src/config/industryStandards';

async function migrateIndustryStandards() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Migrate INDUSTRY_STANDARDS
  for (const [key, profile] of Object.entries(INDUSTRY_STANDARDS)) {
    await supabase.from('industry_standards').insert({
      industry_key: key,
      base_power_mw: profile.basePowerMW,
      base_duration_hrs: profile.baseDurationHrs,
      solar_ratio: profile.solarRatio,
      scale_factor: profile.scaleFactor,
      scale_unit: profile.scaleUnit,
      power_source: profile.powerSource,
      equipment_source: profile.equipmentSource,
      last_updated: profile.lastUpdated,
      created_by: 'migration-script'
    });
  }

  // Migrate AI_OPTIMAL_STANDARDS
  for (const [key, standard] of Object.entries(AI_OPTIMAL_STANDARDS)) {
    await supabase.from('ai_optimal_standards').insert({
      industry_key: key,
      power_mw: standard.powerMW,
      duration_hrs: standard.durationHrs,
      solar_ratio: standard.solarRatio
    });
  }

  // Migrate TEMPLATE_DEFAULTS
  for (const [key, template] of Object.entries(TEMPLATE_DEFAULTS)) {
    await supabase.from('template_defaults').insert({
      industry_key: key,
      mw: template.mw,
      hours: template.hours
    });
  }

  console.log('✅ Migration complete');
}
```

### Phase 3: Service Layer ⏳ (Not Started)

Create service to fetch data from database with caching:

```typescript
// src/services/industryStandardsService.ts
import { createClient } from '@supabase/supabase-js';

class IndustryStandardsService {
  private cache: Map<string, any> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  
  async getIndustryProfile(industryKey: string) {
    // Check cache first
    const cached = this.cache.get(`profile_${industryKey}`);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('industry_standards')
      .select('*')
      .eq('industry_key', industryKey)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    // Update cache
    this.cache.set(`profile_${industryKey}`, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  async getAIOptimalStandards(industryKey: string) {
    // Similar caching logic...
  }

  async getTemplateDefaults(industryKey: string) {
    // Similar caching logic...
  }

  clearCache() {
    this.cache.clear();
  }
}

export const industryStandardsService = new IndustryStandardsService();
```

### Phase 4: Admin UI ⏳ (Not Started)

Build admin interface for updating standards:

**Features:**
- ✏️ Edit industry profiles
- 📊 View all configurations in table
- 📜 Audit trail / history view
- 🔍 Search and filter
- 📤 Export to CSV/JSON
- 📥 Import from CSV
- ✅ Validation before save
- 🔄 Rollback capability

**Tech Stack Options:**
- React Admin
- Retool
- Supabase Studio (built-in)
- Custom React component

### Phase 5: Gradual Rollout ⏳ (Not Started)

**Step 1**: Database reads with code fallback
```typescript
export async function getIndustryProfile(industry: string): Promise<IndustryProfile> {
  try {
    // Try database first
    const dbProfile = await industryStandardsService.getIndustryProfile(industry);
    if (dbProfile) return dbProfile;
  } catch (error) {
    console.warn('Database fetch failed, using code fallback', error);
  }
  
  // Fallback to code-based config
  return INDUSTRY_STANDARDS[industry] || getDefaultProfile();
}
```

**Step 2**: Monitor and test
- Track database performance
- Monitor cache hit rates
- Test failover scenarios

**Step 3**: Deprecate code-based config
- Keep as backup for 1-2 quarters
- Remove after proven stable

## Implementation Checklist

### Prerequisites
- [ ] Supabase project created
- [ ] Database credentials configured
- [ ] Supabase client installed: `npm install @supabase/supabase-js`

### Development
- [ ] Create database schema (Phase 1)
- [ ] Write migration script (Phase 2)
- [ ] Run migration to populate database
- [ ] Build service layer with caching (Phase 3)
- [ ] Create admin UI (Phase 4)
- [ ] Implement gradual rollout (Phase 5)

### Testing
- [ ] Unit tests for service layer
- [ ] Integration tests with database
- [ ] Load testing for cache performance
- [ ] Admin UI usability testing
- [ ] Failover/fallback testing

### Documentation
- [ ] Update README with database setup
- [ ] Document admin UI usage
- [ ] Create video walkthrough for admins
- [ ] Update quarterly review process

## Benefits

### Immediate
- ✅ **No Code Deployments**: Update values without deploying code
- ✅ **Admin UI**: Non-technical users can update values
- ✅ **Audit Trail**: Track all changes with timestamps and reasons

### Long-term
- ✅ **Version History**: Rollback to previous values if needed
- ✅ **Collaboration**: Multiple admins can update independently
- ✅ **A/B Testing**: Test different values for optimization
- ✅ **Regional Variations**: Support different values by region
- ✅ **Dynamic Updates**: Real-time updates without page refresh

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Database downtime | Code-based fallback, caching |
| Network latency | Aggressive caching (5 min), CDN |
| Data corruption | Validation layer, version history, backups |
| Unauthorized changes | Row-level security, audit trail, role-based access |
| Migration errors | Dry-run testing, rollback plan, data validation |

## Cost Estimate

**Supabase Free Tier**: 
- 500 MB database
- 50,000 monthly active users
- 2 GB bandwidth
- **Cost**: $0/month ✅

**Supabase Pro** (if needed):
- 8 GB database
- 100,000 monthly active users
- 50 GB bandwidth
- **Cost**: $25/month

**Development Time**:
- Phase 1-2: 8 hours
- Phase 3: 8 hours  
- Phase 4: 16 hours (depending on UI complexity)
- Phase 5: 8 hours
- **Total**: ~40 hours

## Decision: Go/No-Go

**Recommend**: ⏸️ **Defer for now**

**Rationale**:
- Current code-based solution works well
- No immediate pain points
- 40 hours investment for convenience feature
- Better to focus on core product features first

**Revisit When**:
- Multiple non-technical staff need to update values
- Need regional variations (US vs EU vs Asia)
- Quarterly updates become frequent (monthly or weekly)
- A/B testing becomes necessary

## Alternative: Hybrid Approach

**Quick Win**: Keep code-based, add git-based workflow
- Create simple script to update values
- Use pull requests for review
- Keep existing validation and type safety
- Cost: ~2 hours vs 40 hours for full migration

---

**Status**: 📋 Planning (Not Implemented)  
**Priority**: Low (Nice-to-have)  
**Effort**: 40 hours  
**Revisit**: When team grows or update frequency increases  
**Last Updated**: November 10, 2025

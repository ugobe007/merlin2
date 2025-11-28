# Database Migration Roadmap - Use Case Templates

**Version**: 1.0.0  
**Target Release**: V2.0 (Post-Launch)  
**Estimated Effort**: 3-4 weeks  
**Status**: 📋 Planned (Not Started)  

---

## 🎯 Executive Summary

This document outlines the migration strategy for moving use case templates from the hardcoded `useCaseTemplates.ts` file (4,150 lines) to a dynamic Supabase database architecture. This is a **post-launch optimization** that enables dynamic template management without code deployments.

### Key Benefits
- ✅ Update templates without redeployment
- ✅ A/B test new use cases with user subsets
- ✅ Version control and rollback capability
- ✅ Analytics on template usage patterns
- ✅ Regional customization support
- ✅ Admin UI for non-technical template updates

### Why Wait Until Post-Launch?
- **Current architecture is stable** - 100% test pass rate, proven performance
- **Zero user-facing value before scale** - File-based system works perfectly for <100 users
- **Migration adds complexity** - More moving parts, testing overhead, performance risk
- **Launch focus** - Prioritize user acquisition over admin convenience

---

## 📊 Current State Analysis

### Existing Architecture
```
src/data/useCaseTemplates.ts (4,150 lines)
├── 30+ use case templates
├── Power profiles, equipment lists, custom questions
├── Financial parameters, industry standards
└── Hardcoded in application bundle

Dependencies:
├── src/services/useCaseQuestionService.ts (1 direct import)
├── src/services/baselineService.ts (template lookups)
└── 19 component references (mostly UI rendering)
```

### Pain Points (At Scale)
1. **Admin inefficiency**: Code deployment required for template updates
2. **No experimentation**: Can't A/B test templates with user subsets
3. **No analytics**: Can't track which templates drive conversions
4. **Regional limitations**: Can't customize templates per market
5. **Bundle size**: 4,150 lines in production bundle

### Performance Baseline (Must Maintain)
- Template lookup: <5ms (array find)
- Baseline calculation: <500ms (with template data)
- Page load: <2s (including template rendering)
- Test suite: 100% pass (42/42 tests)

---

## 🏗️ Target Architecture

### Database Schema (Already Designed)

**Primary Tables**:
```sql
use_case_templates (lines 15-119 in 03_USE_CASE_TABLES.sql)
├── Core fields: slug, name, description, icon, category
├── JSONB: power_profile, financial_params, solar_compatibility
├── Arrays: recommended_applications
├── Analytics: times_used, avg_rating, total_ratings
└── Version control: version, changelog, previous_version_id

equipment_database (lines 124-169)
├── Foreign key to use_case_template_id
├── Equipment specs: name, power_kw, duty_cycle
├── Validation: data_source, manufacturer, model
└── Display settings: display_order, is_active
```

**Helper Functions**:
- `get_use_case_with_equipment(slug)` - Single-query template fetch
- `increment_template_usage(slug)` - Usage analytics
- `add_template_rating(slug, rating)` - User feedback tracking

**RLS Policies**:
- Public read access for active templates
- Admin full access for all operations
- Tier-based visibility enforcement

### Service Layer Architecture

```typescript
// New: src/services/databaseUseCaseService.ts (~300 lines)
class DatabaseUseCaseService {
  // Cache layer (Redis or memory)
  private cache: Map<string, UseCaseTemplate>;
  private cacheExpiry: Map<string, number>;
  
  // Fetch with fallback
  async getTemplate(slug: string): Promise<UseCaseTemplate> {
    // 1. Check cache (5ms)
    // 2. Query database (50-100ms)
    // 3. Fallback to file system if DB fails
    // 4. Update cache
  }
  
  async getAllTemplates(): Promise<UseCaseTemplate[]> {
    // Preload on app init, cache for session
  }
  
  // Analytics
  async trackUsage(slug: string): Promise<void>
  async addRating(slug: string, rating: number): Promise<void>
}

// Updated: src/services/useCaseQuestionService.ts
// Replace: import { USE_CASE_TEMPLATES } from '@/data/useCaseTemplates';
// With: const template = await databaseService.getTemplate(slug);
```

### Fallback Strategy (Critical!)

```typescript
// Dual-mode operation
const FALLBACK_MODE = process.env.VITE_USE_DATABASE === 'true';

export async function getTemplate(slug: string) {
  if (FALLBACK_MODE) {
    try {
      // Try database first
      const dbTemplate = await fetchFromDatabase(slug);
      if (dbTemplate) return dbTemplate;
    } catch (error) {
      console.warn('Database unavailable, using file system', error);
    }
  }
  
  // Always fallback to file system
  return USE_CASE_TEMPLATES.find(t => t.slug === slug);
}
```

**Why Keep File System?**:
- Supabase downtime doesn't break app
- Local development works offline
- Rollback safety net if DB issues
- Migration can be gradual (feature flag)

---

## 📅 Implementation Phases

### **Phase 1: Database Setup & Migration** (Week 1)

**Tasks**:
1. **Execute SQL Schema** (2 hours)
   ```bash
   psql $SUPABASE_URL -f docs/03_USE_CASE_TABLES.sql
   ```
   - Verify tables created
   - Test helper functions
   - Validate RLS policies

2. **Run Migration Service** (3 hours)
   ```bash
   npm run migrate:templates
   ```
   - Migrate all 30+ templates from `useCaseTemplates.ts`
   - Migrate equipment lists to `equipment_database`
   - Verify data integrity (compare DB vs file)

3. **Data Verification** (1 day)
   - Query: `SELECT * FROM v_use_case_templates_summary;`
   - Compare: Each template's power_profile, financial_params, custom_questions
   - Tolerance: <0.01% difference in numeric values
   - Test: `SELECT * FROM get_use_case_with_equipment('car-wash');`

4. **RLS Policy Testing** (1 day)
   - Test FREE tier: Can access free templates only
   - Test PREMIUM tier: Can access all templates
   - Test ADMIN: Full CRUD access
   - Test anonymous users: No access

**Deliverables**:
- ✅ Database schema deployed
- ✅ All templates migrated
- ✅ Verification report (100% data match)
- ✅ RLS policies validated

**Exit Criteria**:
- Zero data discrepancies between DB and file
- All 30+ templates queryable
- RLS policies enforce tier restrictions
- Helper functions return correct data

---

### **Phase 2: Service Layer Refactor** (Week 2)

**Tasks**:

1. **Create Database Service** (2 days)
   ```bash
   touch src/services/databaseUseCaseService.ts
   ```
   
   **Implementation**:
   ```typescript
   // src/services/databaseUseCaseService.ts
   import { supabase } from '@/lib/supabaseClient';
   import { USE_CASE_TEMPLATES } from '@/data/useCaseTemplates';
   
   class DatabaseUseCaseService {
     private cache = new Map<string, CacheEntry>();
     private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
     
     async getTemplate(slug: string): Promise<UseCaseTemplate | null> {
       // Check cache
       const cached = this.cache.get(slug);
       if (cached && Date.now() < cached.expiry) {
         return cached.data;
       }
       
       try {
         // Query database
         const { data, error } = await supabase
           .rpc('get_use_case_with_equipment', { template_slug: slug });
         
         if (error) throw error;
         if (!data) throw new Error('Template not found');
         
         // Transform to UseCaseTemplate format
         const template = this.transformDbToTemplate(data);
         
         // Cache result
         this.cache.set(slug, {
           data: template,
           expiry: Date.now() + this.CACHE_TTL
         });
         
         return template;
       } catch (error) {
         console.warn(`DB fetch failed for ${slug}, using fallback`, error);
         // Fallback to file system
         return USE_CASE_TEMPLATES.find(t => t.slug === slug) || null;
       }
     }
     
     async getAllTemplates(userTier: string = 'free'): Promise<UseCaseTemplate[]> {
       const cacheKey = `all_${userTier}`;
       const cached = this.cache.get(cacheKey);
       
       if (cached && Date.now() < cached.expiry) {
         return cached.data;
       }
       
       try {
         const { data, error } = await supabase
           .from('use_case_templates')
           .select('*, equipment:equipment_database(*)')
           .eq('is_active', true)
           .lte('required_tier', userTier) // Tier filtering
           .order('display_order');
         
         if (error) throw error;
         
         const templates = data.map(this.transformDbToTemplate);
         
         this.cache.set(cacheKey, {
           data: templates,
           expiry: Date.now() + this.CACHE_TTL
         });
         
         return templates;
       } catch (error) {
         console.warn('DB fetch all failed, using fallback', error);
         return USE_CASE_TEMPLATES.filter(t => 
           this.canAccessTier(t.requiredTier, userTier)
         );
       }
     }
     
     async trackUsage(slug: string): Promise<void> {
       try {
         await supabase.rpc('increment_template_usage', { template_slug: slug });
       } catch (error) {
         console.warn('Failed to track usage', error);
       }
     }
     
     private transformDbToTemplate(dbRow: any): UseCaseTemplate {
       // Transform database JSONB to TypeScript types
       return {
         id: dbRow.id,
         slug: dbRow.slug,
         name: dbRow.name,
         description: dbRow.description,
         icon: dbRow.icon,
         image: dbRow.image_url,
         category: dbRow.category,
         requiredTier: dbRow.required_tier,
         powerProfile: dbRow.power_profile,
         financialParams: dbRow.financial_params,
         solarCompatibility: dbRow.solar_compatibility,
         customQuestions: dbRow.custom_questions,
         equipment: dbRow.equipment?.map(eq => ({
           name: eq.name,
           powerKw: eq.power_kw,
           dutyCycle: eq.duty_cycle,
           description: eq.description,
           category: eq.category
         })) || [],
         recommendedApplications: dbRow.recommended_applications,
         industryStandards: dbRow.industry_standards,
         version: dbRow.version
       };
     }
   }
   
   export const databaseUseCaseService = new DatabaseUseCaseService();
   ```

2. **Update UseCaseQuestionService** (1 day)
   ```typescript
   // src/services/useCaseQuestionService.ts
   
   // OLD:
   import { USE_CASE_TEMPLATES } from '@/data/useCaseTemplates';
   
   export function getUseCaseQuestionnaire(slug: string) {
     const template = USE_CASE_TEMPLATES.find(t => t.slug === slug);
     // ...
   }
   
   // NEW:
   import { databaseUseCaseService } from '@/services/databaseUseCaseService';
   
   export async function getUseCaseQuestionnaire(slug: string) {
     const template = await databaseUseCaseService.getTemplate(slug);
     if (!template) throw new Error(`Template not found: ${slug}`);
     // ...
   }
   
   // Update all 5 functions to async/await
   ```

3. **Update BaselineService** (1 day)
   ```typescript
   // src/services/baselineService.ts
   
   // OLD:
   const templateObj = USE_CASE_TEMPLATES.find(t => t.slug === useCase);
   
   // NEW:
   const templateObj = await databaseUseCaseService.getTemplate(useCase);
   
   // Add caching for baseline calculations (critical for performance)
   private baselineCache = new Map<string, BaselineResult>();
   ```

4. **Add Feature Flag** (1 hour)
   ```typescript
   // src/config/features.ts
   export const FEATURE_FLAGS = {
     USE_DATABASE_TEMPLATES: import.meta.env.VITE_USE_DATABASE === 'true',
     FALLBACK_TO_FILE: true, // Always enabled for safety
   };
   ```

**Deliverables**:
- ✅ `databaseUseCaseService.ts` implemented with caching
- ✅ `useCaseQuestionService.ts` updated to async
- ✅ `baselineService.ts` supports database lookups
- ✅ Feature flag for gradual rollout
- ✅ File system fallback tested

**Exit Criteria**:
- All services compile without TypeScript errors
- Feature flag toggles between file/database mode
- Fallback activates when DB unavailable (<100ms detection)
- Cache reduces DB queries by 90%

---

### **Phase 3: Frontend Updates** (Week 3)

**Tasks**:

1. **BessQuoteBuilder.tsx** (1 day)
   ```typescript
   // Add loading states
   const [templatesLoading, setTemplatesLoading] = useState(false);
   const [templateError, setTemplateError] = useState<string | null>(null);
   
   useEffect(() => {
     async function loadTemplates() {
       setTemplatesLoading(true);
       try {
         const templates = await databaseUseCaseService.getAllTemplates(user?.tier);
         setAvailableTemplates(templates);
       } catch (error) {
         setTemplateError('Failed to load templates');
         // Fallback already handled in service
       } finally {
         setTemplatesLoading(false);
       }
     }
     loadTemplates();
   }, [user?.tier]);
   
   // Add loading skeleton
   {templatesLoading && <TemplateSkeleton />}
   {templateError && <ErrorBanner message={templateError} />}
   ```

2. **UseCaseTemplates.tsx** (1 day)
   ```typescript
   // Replace synchronous template loading with async
   const [templates, setTemplates] = useState<UseCaseTemplate[]>([]);
   const [loading, setLoading] = useState(true);
   
   useEffect(() => {
     const fetchTemplates = async () => {
       const data = await databaseUseCaseService.getAllTemplates(userTier);
       setTemplates(data);
       setLoading(false);
     };
     fetchTemplates();
   }, [userTier]);
   
   if (loading) return <LoadingSkeleton count={6} />;
   ```

3. **SmartWizardV2.tsx** (1 day)
   ```typescript
   // Preload template on wizard init
   const [template, setTemplate] = useState<UseCaseTemplate | null>(null);
   
   useEffect(() => {
     async function loadTemplate() {
       if (!selectedUseCase) return;
       const tmpl = await databaseUseCaseService.getTemplate(selectedUseCase);
       setTemplate(tmpl);
       
       // Track usage analytics
       await databaseUseCaseService.trackUsage(selectedUseCase);
     }
     loadTemplate();
   }, [selectedUseCase]);
   ```

4. **Create Loading Components** (1 day)
   ```typescript
   // src/components/common/TemplateSkeleton.tsx
   export const TemplateSkeleton = () => (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       {[...Array(6)].map((_, i) => (
         <div key={i} className="animate-pulse">
           <div className="bg-gray-700 h-48 rounded-lg" />
           <div className="bg-gray-600 h-4 mt-4 rounded" />
         </div>
       ))}
     </div>
   );
   
   // src/components/common/ErrorBanner.tsx
   export const ErrorBanner = ({ message }: { message: string }) => (
     <div className="bg-yellow-900 border border-yellow-500 p-4 rounded-lg">
       <p className="text-yellow-100">⚠️ {message}</p>
       <p className="text-sm text-yellow-200 mt-2">
         Using cached templates. Some features may be unavailable.
       </p>
     </div>
   );
   ```

5. **Update 5 Minor Components** (1 day)
   - ModalRenderer.tsx - Async template loading
   - Dashboard components - Template fetching
   - Admin components - Live DB updates

**Deliverables**:
- ✅ All components support async template loading
- ✅ Loading skeletons for UX during fetch
- ✅ Error states with fallback messaging
- ✅ Analytics tracking integrated
- ✅ No breaking changes to user workflows

**Exit Criteria**:
- Components render templates identically (file vs DB)
- Loading states show <200ms for cached queries
- Error states display gracefully
- User experience unchanged from current

---

### **Phase 4: Testing & Performance** (Week 4)

**Tasks**:

1. **Performance Testing** (3 days)
   ```bash
   # Baseline measurements
   npm run test:performance
   ```
   
   **Benchmarks**:
   - Template fetch (cached): <50ms ✅ Target
   - Template fetch (uncached): <200ms ✅ Target
   - Baseline calculation: <500ms ✅ Must maintain
   - Full page load: <2s ✅ Must maintain
   - 50 concurrent users: No degradation ✅
   
   **Cache optimization**:
   ```typescript
   // Add Redis if memory cache insufficient
   import Redis from 'ioredis';
   const redis = new Redis(process.env.REDIS_URL);
   
   async getTemplate(slug: string) {
     // L1: Memory cache (5ms)
     // L2: Redis cache (20ms)
     // L3: Supabase (100ms)
     // L4: File system fallback (5ms)
   }
   ```

2. **Functional Testing** (2 days)
   ```bash
   # Existing test suite MUST stay 100% passing
   npm run test:use-cases  # 42/42 tests
   ```
   
   **New tests to add**:
   ```typescript
   // tests/unit/services/databaseUseCaseService.test.ts
   describe('DatabaseUseCaseService', () => {
     it('fetches template from database', async () => {
       const template = await service.getTemplate('car-wash');
       expect(template).toBeDefined();
       expect(template.slug).toBe('car-wash');
     });
     
     it('falls back to file system when DB fails', async () => {
       // Mock Supabase error
       jest.spyOn(supabase, 'rpc').mockRejectedValue(new Error('DB down'));
       
       const template = await service.getTemplate('car-wash');
       expect(template).toBeDefined(); // Fallback worked
     });
     
     it('caches templates for 5 minutes', async () => {
       await service.getTemplate('car-wash');
       await service.getTemplate('car-wash');
       
       // Should only call DB once
       expect(supabase.rpc).toHaveBeenCalledTimes(1);
     });
     
     it('filters templates by user tier', async () => {
       const freeTemplates = await service.getAllTemplates('free');
       const premiumTemplates = await service.getAllTemplates('premium');
       
       expect(premiumTemplates.length).toBeGreaterThan(freeTemplates.length);
     });
   });
   
   // tests/integration/template-migration.test.ts
   describe('Template Migration Accuracy', () => {
     it('DB template matches file template exactly', async () => {
       const dbTemplate = await databaseService.getTemplate('car-wash');
       const fileTemplate = USE_CASE_TEMPLATES.find(t => t.slug === 'car-wash');
       
       expect(dbTemplate.powerProfile).toEqual(fileTemplate.powerProfile);
       expect(dbTemplate.financialParams).toEqual(fileTemplate.financialParams);
       expect(dbTemplate.equipment.length).toBe(fileTemplate.equipment.length);
     });
     
     it('calculates identical results', async () => {
       const dbBaseline = await calculateBaselineWithDb('car-wash', answers);
       const fileBaseline = await calculateBaselineWithFile('car-wash', answers);
       
       expect(dbBaseline.peakLoad).toBeCloseTo(fileBaseline.peakLoad, 2);
       expect(dbBaseline.duration).toBe(fileBaseline.duration);
     });
   });
   ```

3. **Fallback Testing** (1 day)
   ```typescript
   // tests/integration/fallback.test.ts
   describe('Database Fallback', () => {
     it('switches to file system in <100ms when DB down', async () => {
       jest.spyOn(supabase, 'rpc').mockImplementation(() => 
         new Promise(resolve => setTimeout(resolve, 10000)) // Timeout
       );
       
       const start = Date.now();
       const template = await service.getTemplate('car-wash');
       const duration = Date.now() - start;
       
       expect(template).toBeDefined();
       expect(duration).toBeLessThan(100); // Fast fallback
     });
     
     it('shows warning banner when using fallback', async () => {
       // Simulate DB failure
       mockDbFailure();
       
       render(<BessQuoteBuilder />);
       expect(screen.getByText(/using cached templates/i)).toBeInTheDocument();
     });
   });
   ```

4. **Migration Verification** (1 day)
   ```sql
   -- Run in Supabase SQL Editor
   
   -- Verify all templates migrated
   SELECT COUNT(*) FROM use_case_templates WHERE is_active = true;
   -- Expected: 30+
   
   -- Verify equipment counts match
   SELECT 
     uct.slug,
     COUNT(eq.id) as equipment_count
   FROM use_case_templates uct
   LEFT JOIN equipment_database eq ON eq.use_case_template_id = uct.id
   GROUP BY uct.slug
   ORDER BY uct.slug;
   -- Compare counts with useCaseTemplates.ts
   
   -- Test helper functions
   SELECT * FROM get_use_case_with_equipment('car-wash');
   SELECT * FROM get_use_case_with_equipment('hotel');
   SELECT * FROM v_use_case_templates_summary;
   
   -- Verify RLS policies
   -- As anonymous user (should fail)
   SELECT * FROM use_case_templates;
   
   -- As authenticated FREE user (should see free templates only)
   SET LOCAL role authenticated;
   SELECT slug, required_tier FROM use_case_templates WHERE is_active = true;
   ```

**Deliverables**:
- ✅ Performance benchmarks: All targets met
- ✅ Test suite: 100% pass rate maintained (42/42)
- ✅ New tests: 15+ tests for DB service, fallback, migration
- ✅ Migration verification: 100% data accuracy
- ✅ Load testing: 50 concurrent users, no degradation

**Exit Criteria**:
- All existing tests pass (42/42 = 100%)
- New tests added (15+ covering DB, cache, fallback)
- Performance targets met (<200ms cached, <500ms baseline)
- Zero calculation differences (DB vs file <0.1%)
- Fallback tested (DB down → file system <100ms)
- Load tested (50 users, no performance drop)

---

## 🚨 Risk Assessment & Mitigation

### **Risk 1: Performance Degradation**
**Likelihood**: Medium | **Impact**: High

**Symptoms**:
- Baseline calculations slow from 50ms → 500ms+
- Template loading blocks UI rendering
- User perceives app as slower

**Root Causes**:
- Network latency to Supabase (50-100ms per query)
- No caching layer
- Synchronous blocking calls

**Mitigation Strategy**:
```typescript
// Multi-tier caching
class CacheStrategy {
  // L1: Memory (5ms) - Hot templates
  private memCache = new Map<string, CacheEntry>();
  
  // L2: Redis (20ms) - Shared across instances
  private redisCache = new Redis(process.env.REDIS_URL);
  
  // L3: Database (100ms) - Source of truth
  // L4: File system (5ms) - Fallback
  
  async get(key: string): Promise<any> {
    // Check L1
    const mem = this.memCache.get(key);
    if (mem && !this.isExpired(mem)) return mem.data;
    
    // Check L2
    const redis = await this.redisCache.get(key);
    if (redis) {
      const data = JSON.parse(redis);
      this.memCache.set(key, { data, expiry: Date.now() + 300000 });
      return data;
    }
    
    // Fetch from L3 (DB)
    const dbData = await this.fetchFromDatabase(key);
    
    // Populate L1 and L2
    this.memCache.set(key, { data: dbData, expiry: Date.now() + 300000 });
    await this.redisCache.setex(key, 300, JSON.stringify(dbData));
    
    return dbData;
  }
}
```

**Monitoring**:
```typescript
// Add performance tracking
performance.mark('template-fetch-start');
const template = await service.getTemplate(slug);
performance.mark('template-fetch-end');

const duration = performance.measure(
  'template-fetch',
  'template-fetch-start',
  'template-fetch-end'
).duration;

if (duration > 200) {
  console.warn(`Slow template fetch: ${slug} took ${duration}ms`);
  // Alert engineering team
}
```

**Rollback Plan**:
- Feature flag: `VITE_USE_DATABASE=false`
- Instant rollback to file system
- No data loss, no downtime

---

### **Risk 2: Calculation Differences**
**Likelihood**: Low | **Impact**: Critical

**Symptoms**:
- NPV/IRR values differ between DB and file
- Baseline calculations don't match
- Customer quotes show different results

**Root Causes**:
- JSONB precision loss (floating point)
- Missing fields during migration
- Type coercion errors (string → number)

**Prevention**:
```typescript
// Automated validation during migration
async function validateMigration() {
  const discrepancies: string[] = [];
  
  for (const slug of ALL_TEMPLATE_SLUGS) {
    const dbTemplate = await databaseService.getTemplate(slug);
    const fileTemplate = USE_CASE_TEMPLATES.find(t => t.slug === slug);
    
    // Compare power profiles
    if (Math.abs(dbTemplate.powerProfile.peakLoadKw - fileTemplate.powerProfile.peakLoadKw) > 0.01) {
      discrepancies.push(`${slug}: peakLoadKw mismatch`);
    }
    
    // Compare financial params
    if (Math.abs(dbTemplate.financialParams.roiAdjustmentFactor - fileTemplate.financialParams.roiAdjustmentFactor) > 0.0001) {
      discrepancies.push(`${slug}: roiAdjustmentFactor mismatch`);
    }
    
    // Compare equipment counts
    if (dbTemplate.equipment.length !== fileTemplate.equipment.length) {
      discrepancies.push(`${slug}: equipment count mismatch`);
    }
  }
  
  if (discrepancies.length > 0) {
    throw new Error(`Migration validation failed:\n${discrepancies.join('\n')}`);
  }
  
  console.log('✅ All templates validated - 100% match');
}
```

**Testing**:
```typescript
// Run 1000 calculations with both systems
const results = await Promise.all(
  ALL_TEMPLATE_SLUGS.flatMap(slug =>
    [...Array(100)].map(async () => {
      const dbResult = await calculateWithDb(slug);
      const fileResult = await calculateWithFile(slug);
      return { slug, dbResult, fileResult };
    })
  )
);

// Compare results
const differences = results.filter(r => 
  Math.abs(r.dbResult.npv - r.fileResult.npv) > 0.01
);

if (differences.length > 0) {
  console.error('❌ Calculation differences found:', differences);
  // Abort migration
}
```

**Rollback Plan**:
- Keep `useCaseTemplates.ts` in codebase permanently
- Any discrepancy >0.1% = abort migration
- Automated rollback if differences detected

---

### **Risk 3: Breaking Changes for Users**
**Likelihood**: Medium | **Impact**: Medium

**Symptoms**:
- Saved quotes fail to load
- "Template not found" errors
- Historical data becomes inaccessible

**Root Causes**:
- Template IDs changed during migration
- Saved quotes reference old template structure
- Version mismatches

**Prevention**:
```sql
-- Add backward compatibility columns
ALTER TABLE saved_projects 
ADD COLUMN legacy_template_id VARCHAR(50),
ADD COLUMN template_version VARCHAR(10) DEFAULT '1.0.0';

-- Update existing records to include legacy IDs
UPDATE saved_projects sp
SET legacy_template_id = sp.project_data->>'useCaseSlug'
WHERE legacy_template_id IS NULL;

-- Create lookup table for ID mapping
CREATE TABLE template_id_mapping (
  legacy_id VARCHAR(50) PRIMARY KEY,
  new_uuid UUID REFERENCES use_case_templates(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

```typescript
// Service layer handles both old and new IDs
async function loadSavedQuote(quoteId: string) {
  const quote = await fetchQuote(quoteId);
  
  // Handle legacy template references
  let templateId = quote.use_case_template_id;
  if (!templateId && quote.legacy_template_id) {
    templateId = await mapLegacyId(quote.legacy_template_id);
  }
  
  const template = await service.getTemplate(templateId);
  return { quote, template };
}
```

**Testing**:
```typescript
// Test with production data export
describe('Backward Compatibility', () => {
  it('loads quotes created before migration', async () => {
    const legacyQuote = {
      id: 'quote-123',
      useCaseSlug: 'car-wash', // Old format
      templateVersion: '1.0.0'
    };
    
    const result = await loadQuote(legacyQuote.id);
    expect(result.template).toBeDefined();
  });
  
  it('loads quotes created after migration', async () => {
    const newQuote = {
      id: 'quote-456',
      use_case_template_id: 'uuid-789', // New format
      templateVersion: '2.0.0'
    };
    
    const result = await loadQuote(newQuote.id);
    expect(result.template).toBeDefined();
  });
});
```

**Rollback Plan**:
- Maintain both ID formats for 6 months
- Gradual migration of saved_projects table
- Zero data loss during transition

---

### **Risk 4: Database Unavailability**
**Likelihood**: Low | **Impact**: High

**Symptoms**:
- App completely broken
- "Service unavailable" errors
- Users can't generate quotes

**Root Causes**:
- Supabase outage
- Network connectivity issues
- RLS policy misconfigurations

**Mitigation**:
```typescript
// Robust fallback with <100ms detection
const DB_TIMEOUT = 100; // milliseconds

async function getTemplate(slug: string) {
  const fallbackPromise = new Promise<UseCaseTemplate>((resolve) => {
    setTimeout(() => {
      // Fallback to file system after 100ms
      const fileTemplate = USE_CASE_TEMPLATES.find(t => t.slug === slug);
      if (fileTemplate) resolve(fileTemplate);
    }, DB_TIMEOUT);
  });
  
  const dbPromise = (async () => {
    const { data, error } = await supabase
      .rpc('get_use_case_with_equipment', { template_slug: slug });
    
    if (error) throw error;
    return transformDbToTemplate(data);
  })();
  
  // Race: DB query vs fallback timeout
  return Promise.race([dbPromise, fallbackPromise]);
}
```

**User Communication**:
```typescript
// Show banner when using fallback
if (usingFallback) {
  return (
    <div className="bg-yellow-900 border border-yellow-500 p-3 rounded-lg mb-4">
      <p className="text-yellow-100 text-sm">
        ⚠️ Using cached templates. Some features may be temporarily unavailable.
      </p>
    </div>
  );
}
```

**Monitoring**:
```typescript
// Track fallback usage
analytics.track('template_fallback_used', {
  slug,
  reason: 'database_timeout',
  timestamp: Date.now()
});

// Alert if fallback rate >5%
if (fallbackRate > 0.05) {
  alertEngineering('High database fallback rate detected');
}
```

**Recovery**:
- Automatic retry with exponential backoff
- Health check endpoint: `GET /api/health/templates`
- Status page updates for users

---

## 📈 Success Metrics

### **Performance Metrics**
```typescript
// Target SLAs (must maintain or improve)
const PERFORMANCE_TARGETS = {
  templateFetchCached: 50,      // ms - ✅ Target: <50ms
  templateFetchUncached: 200,   // ms - ✅ Target: <200ms
  baselineCalculation: 500,     // ms - ✅ Must maintain: <500ms
  fullPageLoad: 2000,           // ms - ✅ Must maintain: <2s
  cacheHitRate: 0.90,           // ratio - ✅ Target: >90%
  fallbackRate: 0.01,           // ratio - ✅ Target: <1%
};

// Track in production
const metrics = {
  avgFetchTime: percentile(fetchTimes, 95), // P95
  cacheHits: cacheHits / totalRequests,
  fallbackUsage: fallbackCount / totalRequests,
  errorRate: errors / totalRequests,
};
```

### **Functional Metrics**
```typescript
const FUNCTIONAL_TARGETS = {
  testPassRate: 1.0,              // 100% - All tests must pass
  calculationAccuracy: 0.999,     // 99.9% - <0.1% difference
  migrationCompleteness: 1.0,     // 100% - All templates migrated
  backwardCompatibility: 1.0,     // 100% - All saved quotes load
};
```

### **Business Metrics**
```typescript
// Track post-migration
const BUSINESS_METRICS = {
  adminUpdateFrequency: 0,        // Updates/week (should increase)
  templateUsageByTier: {},        // Analytics per tier
  conversionByTemplate: {},       // Which templates convert best
  templateRatings: {},            // User feedback per template
  timeToMarket: 0,                // Days to launch new template (should decrease)
};
```

---

## 🎯 Go/No-Go Criteria

### **Phase 1 Gates (Database Setup)**
- ✅ All tables created without errors
- ✅ RLS policies enforce tier restrictions correctly
- ✅ Helper functions return expected data
- ✅ All 30+ templates migrated with 100% data match
- ✅ Zero discrepancies in power profiles, financial params, equipment

### **Phase 2 Gates (Service Layer)**
- ✅ `databaseUseCaseService.ts` compiles without errors
- ✅ Cache reduces DB queries by >90%
- ✅ Fallback activates in <100ms when DB unavailable
- ✅ Feature flag toggles between file/DB mode seamlessly
- ✅ All services updated to async/await pattern

### **Phase 3 Gates (Frontend)**
- ✅ All components render templates identically (file vs DB)
- ✅ Loading states display properly (<200ms for cached)
- ✅ Error states show graceful fallback messaging
- ✅ User workflows unchanged (no breaking changes)
- ✅ Analytics tracking integrated and verified

### **Phase 4 Gates (Testing & Launch)**
- ✅ All existing tests pass (42/42 = 100%)
- ✅ 15+ new tests added (DB, cache, fallback)
- ✅ Performance targets met (see metrics above)
- ✅ Zero calculation differences (<0.1% tolerance)
- ✅ Load tested (50 concurrent users, no degradation)
- ✅ Fallback tested (DB down scenario handled gracefully)
- ✅ Production data migrated successfully
- ✅ Rollback plan documented and tested

### **Launch Criteria**
- ✅ All 4 phase gates passed
- ✅ Production environment configured
- ✅ Monitoring dashboards active
- ✅ Rollback plan ready (1-click revert)
- ✅ Engineering team trained on new architecture
- ✅ Customer support aware of potential issues
- ✅ Gradual rollout plan (10% → 50% → 100%)

---

## 🚀 Rollout Strategy

### **Phase 1: Internal Testing (Week 1)**
```typescript
// Feature flag: Internal users only
const FEATURE_FLAGS = {
  USE_DATABASE_TEMPLATES: user.email.endsWith('@merlin.io'),
};
```
- Deploy to staging environment
- Internal team tests all workflows
- Monitor performance metrics
- Fix any issues before wider rollout

### **Phase 2: Beta Users (Week 2)**
```typescript
// Feature flag: 10% of users
const FEATURE_FLAGS = {
  USE_DATABASE_TEMPLATES: Math.random() < 0.10 && user.tier === 'PREMIUM',
};
```
- Roll out to 10% of premium users
- Monitor error rates, performance, feedback
- A/B test: Compare metrics vs control group
- Gather user feedback via in-app survey

### **Phase 3: Gradual Rollout (Weeks 3-4)**
```typescript
// Gradual increase
const rolloutPercentage = {
  week3: 0.25, // 25% of all users
  week4: 0.50, // 50% of all users
  week5: 1.00, // 100% of all users
};
```
- Increase rollout percentage each week
- Monitor metrics daily
- Pause rollout if error rate >1%
- Ready to rollback at any time

### **Phase 4: Full Launch (Week 5)**
```typescript
// All users on database
const FEATURE_FLAGS = {
  USE_DATABASE_TEMPLATES: true,
  FALLBACK_TO_FILE: true, // Keep forever
};
```
- 100% of users on database templates
- File system remains as fallback
- Remove feature flag after 30 days stable
- Celebrate successful migration 🎉

---

## 📝 Implementation Checklist

### **Pre-Migration**
- [ ] Review this document with engineering team
- [ ] Backup production database (full snapshot)
- [ ] Export all saved quotes (for rollback testing)
- [ ] Set up monitoring dashboards (Grafana/DataDog)
- [ ] Configure Redis cache (if needed for performance)
- [ ] Test rollback procedure in staging
- [ ] Schedule migration during low-traffic window
- [ ] Notify customer support of potential issues

### **Phase 1: Database Setup**
- [ ] Execute SQL schema in Supabase
- [ ] Run migration service (`npm run migrate:templates`)
- [ ] Verify all 30+ templates migrated correctly
- [ ] Test RLS policies (FREE, PREMIUM, ADMIN tiers)
- [ ] Validate helper functions
- [ ] Compare DB data vs file data (100% match)
- [ ] Test rollback: Delete tables, verify app still works

### **Phase 2: Service Layer**
- [ ] Create `databaseUseCaseService.ts`
- [ ] Implement caching layer (memory + Redis)
- [ ] Implement fallback logic (<100ms timeout)
- [ ] Update `useCaseQuestionService.ts` (async)
- [ ] Update `baselineService.ts` (DB lookups)
- [ ] Add feature flag configuration
- [ ] Test service in isolation (unit tests)
- [ ] Test fallback scenarios (DB down)

### **Phase 3: Frontend Updates**
- [ ] Update `BessQuoteBuilder.tsx` (loading states)
- [ ] Update `UseCaseTemplates.tsx` (async fetch)
- [ ] Update `SmartWizardV2.tsx` (preload template)
- [ ] Create `TemplateSkeleton` component
- [ ] Create `ErrorBanner` component
- [ ] Update 5 minor components (modals, dashboard)
- [ ] Test UI in staging environment
- [ ] Verify user workflows unchanged

### **Phase 4: Testing**
- [ ] Run existing test suite (`npm run test:use-cases`)
  - [ ] Verify 42/42 tests pass (100%)
- [ ] Add 15+ new tests (DB, cache, fallback)
- [ ] Run performance benchmarks
  - [ ] Template fetch (cached): <50ms
  - [ ] Template fetch (uncached): <200ms
  - [ ] Baseline calculation: <500ms
  - [ ] Full page load: <2s
- [ ] Run load test (50 concurrent users)
- [ ] Test fallback scenarios (DB timeout, error)
- [ ] Validate migration accuracy (DB vs file)
- [ ] Test backward compatibility (saved quotes)

### **Phase 5: Deployment**
- [ ] Deploy to staging, verify functionality
- [ ] Run smoke tests in staging
- [ ] Deploy to production (feature flag OFF)
- [ ] Enable feature flag for internal users (10%)
- [ ] Monitor metrics for 24 hours
- [ ] Roll out to 10% beta users (premium)
- [ ] Monitor metrics for 48 hours
- [ ] Gradual rollout: 25% → 50% → 100%
- [ ] Full launch (all users)
- [ ] Monitor for 1 week
- [ ] Remove feature flag (keep fallback)
- [ ] Archive `useCaseTemplates.ts` (keep for emergency)

### **Post-Migration**
- [ ] Update documentation (architecture guide)
- [ ] Train customer support on new features
- [ ] Create admin guide for template management
- [ ] Set up automated cache cleanup (cron job)
- [ ] Configure alerting (error rate, performance)
- [ ] Implement analytics dashboards
- [ ] Gather user feedback
- [ ] Plan V2.1 enhancements

---

## 🔧 Maintenance & Operations

### **Daily Operations**
```bash
# Monitor template usage
SELECT slug, times_used, avg_rating 
FROM use_case_templates 
ORDER BY times_used DESC 
LIMIT 10;

# Monitor cache performance
SELECT 
  cache_hits / total_requests as hit_rate,
  avg_fetch_time_ms
FROM template_metrics
WHERE date = CURRENT_DATE;

# Check for errors
SELECT COUNT(*) as error_count
FROM error_logs
WHERE service = 'databaseUseCaseService'
AND timestamp > NOW() - INTERVAL '1 hour';
```

### **Weekly Tasks**
- [ ] Review template usage analytics
- [ ] Check cache hit rates (target >90%)
- [ ] Review error logs (target <1%)
- [ ] Update popular templates based on ratings
- [ ] Test new template additions in staging
- [ ] Review performance metrics vs SLAs
- [ ] Clear expired cache entries (`SELECT cleanup_expired_cache();`)

### **Monthly Tasks**
- [ ] Audit template data quality
- [ ] Update industry standards references
- [ ] Review and optimize slow queries
- [ ] Plan new template additions
- [ ] Analyze conversion rates by template
- [ ] Review user feedback and ratings
- [ ] Update documentation

### **Quarterly Tasks**
- [ ] Major template updates (seasonal adjustments)
- [ ] Database performance tuning
- [ ] Security audit (RLS policies)
- [ ] Cost analysis (database size, queries)
- [ ] Plan schema migrations if needed
- [ ] Review and update equipment database

---

## 📚 Additional Resources

### **Documentation**
- Database schema: `docs/03_USE_CASE_TABLES.sql`
- Architecture guide: `ARCHITECTURE_GUIDE.md`
- Migration service: `src/services/templateMigrationService.ts`
- Admin UI: `src/components/admin/MigrationManager.tsx`

### **Testing**
- Test suite: `tests/unit/services/all-use-cases.test.ts`
- Performance tests: `tests/performance/load-tests/baseline-service.perf.ts`
- Integration tests: Create `tests/integration/template-migration.test.ts`

### **Monitoring**
- Set up Grafana dashboard for template metrics
- Configure Sentry for error tracking
- Use Supabase built-in analytics
- Track user feedback via in-app surveys

### **Support**
- Customer support guide (to be created)
- Admin user guide (to be created)
- Troubleshooting runbook (to be created)
- Rollback procedure (to be created)

---

## 🎯 Final Recommendation

### **Timeline: Post-Launch V2.0**
- **Start date**: 2-3 months after successful launch
- **Trigger condition**: 100+ active users requesting template customization
- **Duration**: 4 weeks (1 week per phase)
- **Team size**: 2 engineers + 1 QA

### **Why This Plan Works**
1. ✅ **Incremental**: 4 phases with clear gates
2. ✅ **Safe**: Fallback to file system at every step
3. ✅ **Tested**: 100% test coverage maintained
4. ✅ **Monitored**: Performance metrics tracked continuously
5. ✅ **Reversible**: Feature flag enables instant rollback

### **Pre-Launch Priority**
🎯 **Focus on stability, not optimization**
- Current file-based system is production-ready
- Zero breaking changes before launch
- Migration adds complexity without immediate user value
- Wait until customer demand justifies the effort

### **Post-Launch Triggers**
Implement this migration when:
- 100+ active users need custom templates
- Admin team updates templates >1/week
- Need to A/B test template variations
- Regional expansion requires customization
- Template bundle size impacts load times

---

## ✅ Sign-Off

**Prepared by**: GitHub Copilot (AI Assistant)  
**Review required**: Engineering Lead, Product Manager, DevOps  
**Approval required**: CTO  
**Status**: 📋 Documented & Ready (Not Approved)  

**Next Steps**:
1. Share document with engineering team
2. Review and refine based on feedback
3. Approve when ready to implement (post-launch)
4. Execute Phase 1 in staging environment
5. Monitor, iterate, succeed 🚀

---

*This roadmap provides a complete blueprint for database migration. Keep it updated as requirements evolve. Good luck with launch! 🎉*

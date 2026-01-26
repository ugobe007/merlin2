# Systematic Wizard Transformation Plan
**Created:** January 22, 2026  
**Scope:** ALL 23 active use cases  
**Strategy:** Car Wash 16Q as template for systematic industry questionnaire framework

---

## Executive Summary

**Current State:**
- 23 active industries in production
- Question counts vary wildly: 13 (restaurant) to 34 (hotel)
- 5 industries have duplicate display_order bugs
- Car wash has 16 comprehensive, well-structured questions (✅ model)
- All use CompleteStep3Component (database-driven rendering)

**Goal:**
Transform ALL industries to use standardized 15-20 question framework based on car wash pattern, with:
- **6-8 universal sections** (Topology, Infrastructure, Equipment, Operations, Financial, Resilience, Planning)
- **Industry-specific calculators** (e.g., `calculate{Industry}16Q()`)
- **Real-time power metrics** integrated with WizardV6
- **SSOT compliance** (no hardcoded calculations)

**Timeline:** 8-12 weeks (phased rollout)  
**Risk:** MEDIUM (systematic changes, but architecture supports it)

---

## Current Industry Audit

```
INDUSTRY               | QUESTIONS | SECTIONS | STATUS
-----------------------+-----------+----------+---------------------------
car-wash               |    16     |    6     | ✅ MODEL (new standard)
restaurant             |    13     |    ?     | 🟡 Below target
heavy_duty_truck_stop  |    22     |    ?     | 🟢 Good coverage
residential            |    24     |    ?     | 🟢 Good coverage
agricultural           |    31     |    ?     | ✅ Comprehensive
apartment              |    29     |    ?     | ✅ Comprehensive
gas-station            |    29     |    ?     | ✅ Comprehensive
casino                 |    29     |    ?     | ✅ Comprehensive
retail                 |    29     |    ?     | ⚠️ Has duplicate bug
airport                |    30     |    ?     | ✅ Comprehensive
government             |    30     |    ?     | ✅ Comprehensive
hospital               |    30     |    ?     | ✅ Comprehensive
indoor-farm            |    30     |    ?     | ⚠️ Has duplicate bug
office                 |    30     |    ?     | ⚠️ Has duplicate bug
manufacturing          |    31     |    ?     | ⚠️ Has duplicate bug
warehouse              |    31     |    ?     | ⚠️ Has duplicate bug
shopping-center        |    31     |    ?     | ✅ Comprehensive
data-center            |    32     |    ?     | ✅ Comprehensive
ev-charging            |    32     |    ?     | ✅ Comprehensive
microgrid              |    32     |    ?     | ✅ Comprehensive
cold-storage           |    32     |    ?     | ✅ Comprehensive
college                |    32     |    ?     | ✅ Comprehensive
hotel                  |    34     |    ?     | ✅ Most comprehensive
```

**Key Findings:**
- ✅ 18 industries have clean data (no duplicates)
- ⚠️ 5 industries have display_order duplicates (need fixing)
- 📊 Average: 29 questions per industry
- 🎯 Target: Standardize to 15-20 with better structure (car wash model)

---

## The Car Wash Model (Template for All Industries)

### Question Framework (16 Questions, 6 Sections)

**Section 1: Topology** (Identity + Scale)
- Q1: Industry-specific type (e.g., "Car wash type" → "Hotel class", "Office building class")
- Q2: Scale/units (e.g., "Bays/tunnels" → "Room count", "Square footage")

**Section 2: Infrastructure** (Electrical Constraints)
- Q3: Electrical service size (200A, 400A, 600A, 800A+)
- Q4: Voltage level (208V, 240V, 277/480V, mixed)

**Section 3: Equipment** (Load Reconstruction)
- Q5: Primary equipment (multi-select, industry-specific)
- Q6: Largest motor size (peak surge modeling)
- Q7: Simultaneous operation (concurrency factor)

**Section 4: Operations** (Throughput + Schedule)
- Q8: Daily throughput (units served/processed)
- Q9: Peak hour throughput (short-term demand)
- Q10: Cycle/service duration (load curve conversion)
- Q11: Operating hours (load spreading)

**Section 5: Financial** (ROI Calibration)
- Q12: Monthly electricity spend (baseline anchor)
- Q13: Utility rate structure (TOU, demand charges)

**Section 6: Resilience** (Backup Requirements)
- Q14: Power quality issues (multi-select)
- Q15: Outage sensitivity (backup runtime)

**Section 7: Planning** (Future-proofing) - OPTIONAL
- Q16: Expansion plans (multi-select, kW increases)

---

## Universal Question Templates

These can be adapted for ANY industry by swapping terminology:

### Q1: Industry Type/Class (Topology Anchor)
```sql
-- TEMPLATE:
'What type of {INDUSTRY} do you operate?'

-- CAR WASH: 'What type of car wash?' → self_serve, automatic_inbay, conveyor_tunnel
-- HOTEL: 'What hotel class?' → economy, midscale, upscale, luxury
-- OFFICE: 'What building class?' → class_a, class_b, class_c
-- HOSPITAL: 'What hospital type?' → community, regional, trauma_center, teaching
-- DATA CENTER: 'What tier?' → tier_1, tier_2, tier_3, tier_4
```

### Q2: Scale/Units (Concurrency Factor)
```sql
-- TEMPLATE:
'How many {UNITS} do you have?'

-- CAR WASH: 'How many bays/tunnels?' → 1, 2-3, 4-6, 7+
-- HOTEL: 'How many rooms?' → <50, 50-150, 150-300, 300+
-- OFFICE: 'Square footage?' → <10k, 10-50k, 50-200k, 200k+
-- HOSPITAL: 'How many beds?' → <50, 50-200, 200-500, 500+
-- RESTAURANT: 'How many seats?' → <50, 50-100, 100-200, 200+
```

### Q3-Q4: Infrastructure (UNIVERSAL - Same for all)
```sql
Q3: 'What is your electrical service rating?'
    → 200A (48 kW), 400A (96 kW), 600A (144 kW), 800A+ (192 kW), not_sure

Q4: 'What voltage does your site use?'
    → 208V, 240V, 277/480V, mixed, not_sure
```

### Q5: Primary Equipment (Industry-Specific Multi-Select)
```sql
-- TEMPLATE:
'Which major electrical loads do you have?'

-- CAR WASH: high_pressure_pumps, blowers_dryers, water_heaters, lighting, vacuum_stations
-- HOTEL: hvac_systems, water_heaters, kitchen_equipment, laundry, pool_heaters, elevators
-- OFFICE: hvac, lighting, elevators, server_room, kitchen
-- HOSPITAL: medical_imaging, sterilization, hvac, emergency_power, elevators
-- DATA CENTER: servers, cooling, ups_systems, networking, lighting
```

### Q6-Q7: Equipment Operation (UNIVERSAL with minor tweaks)
```sql
Q6: 'What is the largest motor on site (approx)?'
    → <10 HP (7kW), 10-25 HP (18kW), 25-50 HP (37kW), 50-100 HP (75kW), 100+ HP (100kW)

Q7: 'How many major machines run at the same time?'
    → 1-2 (50% concurrency), 3-4 (75%), 5-7 (90%), 8+ (100%)
```

### Q8-Q11: Operations (Industry-Specific Units)
```sql
-- TEMPLATE:
Q8: 'How many {UNITS} on an average day?'
Q9: 'During busiest hour, how many {UNITS}?'
Q10: 'How long is one {SERVICE_CYCLE}?'
Q11: 'Operating hours per day?'

-- CAR WASH: cars/day, cars/hour, wash cycle, hours/day
-- HOTEL: occupied rooms, check-ins/hour, guest stay, 24/7
-- RESTAURANT: customers/day, customers/hour, meal service, hours/day
-- HOSPITAL: patients/day, admissions/hour, avg stay, 24/7
-- OFFICE: occupants/day, peak occupancy, work shift, hours/day
```

### Q12-Q13: Financial (UNIVERSAL)
```sql
Q12: 'What is your average monthly electricity bill?'
     → <$1k, $1-3k, $3-7.5k, $7.5-15k, $15k+, not_sure

Q13: 'What best describes your utility billing?'
     → flat (0.5x savings), tou (0.8x), demand (1.0x), tou_demand (1.2x), not_sure (0.8x)
```

### Q14-Q15: Resilience (UNIVERSAL with minor tweaks)
```sql
Q14: 'Do you experience power quality issues?'
     → breaker_trips, voltage_sag, utility_penalties, equipment_brownouts, none

Q15: 'If power goes out, what happens?'
     → operations_stop (4h backup), partial_operations (2h), minor_disruption (1h), no_impact (0h)
```

### Q16: Expansion Plans (UNIVERSAL with industry-specific options)
```sql
-- TEMPLATE:
'Are you planning any expansions in next 24 months?'

-- CAR WASH: add_bay_tunnel (+50kW), larger_equipment (+30kW), ev_chargers (+50kW), solar, none
-- HOTEL: add_rooms (+5kW/room), pool (+40kW), ev_chargers (+50kW), solar, none
-- OFFICE: floor_expansion (+15kW/1000sqft), ev_chargers (+50kW), solar, none
-- HOSPITAL: add_beds (+10kW/bed), imaging_equipment (+100kW), solar, none
```

---

## Systematic Transformation Architecture

### Phase 1: Infrastructure (Week 1) ✅ ALREADY DONE
- ✅ CompleteStep3Component renders database-driven questions
- ✅ Step3Integration.tsx detects industry and triggers calculators
- ✅ Car wash integration layer (carWashIntegration.ts) exists as template
- ✅ SSOT audit tools ready (audit-v6-ssot.sh)

### Phase 2: Calculator Template (Week 2)
Create universal calculator pattern based on car wash:

**File:** `src/services/industryCalculatorTemplate.ts`
```typescript
/**
 * TEMPLATE for calculate{Industry}16Q()
 * 
 * Clone this file and search/replace:
 * - {Industry} → Hotel, Office, Hospital, etc.
 * - {industry} → hotel, office, hospital (lowercase)
 * - Equipment types, units, sections
 */

export interface {Industry}16QInput {
  // Section 1: Topology
  {industry}Type: 'type_a' | 'type_b' | 'type_c';
  scaleUnits: '1-50' | '50-200' | '200-500' | '500+';
  
  // Section 2: Infrastructure (UNIVERSAL)
  electricalServiceSize: '200' | '400' | '600' | '800+' | 'not_sure';
  voltageLevel: '208' | '240' | '277_480' | 'mixed' | 'not_sure';
  
  // Section 3: Equipment
  primaryEquipment: string[];  // Industry-specific
  largestMotorSize: '<10' | '10-25' | '25-50' | '50-100' | '100+' | 'not_sure';
  simultaneousEquipment: '1-2' | '3-4' | '5-7' | '8+';
  
  // Section 4: Operations
  dailyThroughput: string;
  peakHourThroughput: string;
  serviceDuration: string;
  operatingHours: '<8' | '8-12' | '12-18' | '18-24';
  
  // Section 5: Financial (UNIVERSAL)
  monthlyElectricitySpend: '<1000' | '1000-3000' | '3000-7500' | '7500-15000' | '15000+' | 'not_sure';
  utilityRateStructure: 'flat' | 'tou' | 'demand' | 'tou_demand' | 'not_sure';
  
  // Section 6: Resilience (UNIVERSAL)
  powerQualityIssues: string[];
  outageSensitivity: 'operations_stop' | 'partial_operations' | 'minor_disruption' | 'no_impact';
  
  // Section 7: Planning (OPTIONAL)
  expansionPlans?: string[];
}

export interface {Industry}16QResult {
  // Power metrics
  peakDemandKW: number;
  dailyEnergyKWh: number;
  annualEnergyKWh: number;
  
  // BESS sizing
  bessRecommendedKW: number;
  bessRecommendedKWh: number;
  bessRationale: string;
  
  // Financial
  estimatedDemandCharge: number;
  potentialDemandSavings: number;
  totalAnnualSavings: number;
  simplePaybackYears: number;
  
  // Confidence
  confidence: number;  // 0-1
  confidenceFactors: string[];
  
  // Audit trail
  calculationMethod: string;
  assumptions: string[];
  sources: string[];
}

export function calculate{Industry}16Q(input: {Industry}16QInput): {Industry}16QResult {
  // 1. Parse scale/topology
  // 2. Calculate baseline load from equipment
  // 3. Apply concurrency factor
  // 4. Model throughput → energy
  // 5. Size BESS (0.4-0.7x peak based on use case)
  // 6. Calculate financials
  // 7. Build confidence score
  // 8. Return with audit trail
}
```

### Phase 3: Migration Script Generator (Week 3)
Create tool to auto-generate migration SQL for any industry:

**File:** `scripts/generate_industry_migration.mjs`
```javascript
/**
 * Generate 16Q migration SQL for any industry
 * 
 * Usage: node scripts/generate_industry_migration.mjs hotel
 */

// Reads templates from industry-question-templates.json
// Outputs: database/migrations/YYYYMMDD_{industry}_16q.sql
```

### Phase 4: Integration Layer Generator (Week 3)
Auto-generate integration files:

**File:** `scripts/generate_industry_integration.mjs`
```javascript
/**
 * Generate integration layer for any industry
 * 
 * Outputs:
 * - src/components/wizard/{industry}Integration.ts
 * - Adds calculator call to Step3Integration.tsx
 */
```

### Phase 5: Phased Rollout (Weeks 4-12)

**Priority 1: High-Revenue Industries (Weeks 4-6)**
1. Hotel (34 questions → standardize to 16)
2. Hospital (30 questions → standardize to 16)
3. Data Center (32 questions → standardize to 16)
4. Office (30 questions → fix duplicates + standardize to 16)
5. Manufacturing (31 questions → fix duplicates + standardize to 16)

**Priority 2: Premium Tier (Weeks 7-9)**
6. Airport (30 questions)
7. Casino (29 questions)
8. College (32 questions)
9. Government (30 questions)
10. Microgrid (32 questions)

**Priority 3: Free Tier (Weeks 10-12)**
11. Apartment (29 questions)
12. Retail (29 questions → fix duplicates)
13. Warehouse (31 questions → fix duplicates)
14. Gas Station (29 questions)
15. Shopping Center (31 questions)
16. EV Charging (32 questions)
17. Indoor Farm (30 questions → fix duplicates)
18. Agricultural (31 questions)
19. Cold Storage (32 questions)
20. Residential (24 questions)
21. Restaurant (13 questions → expand to 16)
22. Heavy Duty Truck Stop (22 questions)

---

## Implementation Strategy

### Option A: Big Bang (NOT RECOMMENDED)
- Migrate all 23 industries at once
- High risk of breaking production
- Difficult to roll back
- **Timeline:** 2 weeks
- **Risk:** 🔴 HIGH

### Option B: Phased Rollout (RECOMMENDED)
- 1 industry per week, validate before next
- Feature flag per industry (`VITE_ENABLE_{INDUSTRY}_16Q=true`)
- Can roll back individual industries
- **Timeline:** 12 weeks (3 months)
- **Risk:** 🟡 MEDIUM

### Option C: Parallel System (SAFEST but SLOWEST)
- Build separate `wizard-v7` with new system
- Run A/B test for 4-8 weeks
- Migrate users gradually
- **Timeline:** 16-20 weeks (4-5 months)
- **Risk:** 🟢 LOW

**Recommendation:** **Option B** (Phased Rollout)
- Good balance of speed vs risk
- Allows learning from each rollout
- Can pivot if issues arise
- 3-month timeline acceptable for systematic improvement

---

## Technical Implementation Checklist

### Per Industry Migration

#### Step 1: Analysis (30 min)
- [ ] Review existing questions for industry
- [ ] Identify equipment types, units, typical scale
- [ ] Map existing fields to new 16Q structure
- [ ] Document industry-specific calculations

#### Step 2: SQL Migration (1 hour)
- [ ] Create `YYYYMMDD_{industry}_16q.sql`
- [ ] Map Q1-Q16 to industry context
- [ ] Add proper icons, help text, sections
- [ ] Include verification query
- [ ] Test on dev database

#### Step 3: Calculator Service (2 hours)
- [ ] Create `src/services/{industry}16QCalculator.ts`
- [ ] Implement input/output types
- [ ] Build calculation logic (reference car wash)
- [ ] Add confidence scoring
- [ ] Add audit trail with sources
- [ ] Write unit tests

#### Step 4: Integration Layer (1 hour)
- [ ] Create `src/components/wizard/{industry}Integration.ts`
- [ ] Map question answers to calculator input
- [ ] Add to Step3Integration.tsx detection
- [ ] Test console output shows metrics

#### Step 5: WizardV6 Integration (30 min)
- [ ] Find hardcoded values in WizardV6.tsx (grep for industry slug)
- [ ] Replace with calculator result
- [ ] Add fallback if calculator unavailable
- [ ] Test power gauge updates

#### Step 6: Testing (2 hours)
- [ ] Build passes without errors
- [ ] SSOT audit shows no new violations
- [ ] Manual smoke test: Complete wizard flow
- [ ] Verify PDF export includes new questions
- [ ] Check other industries still work (regression)

#### Step 7: Deploy (1 hour)
- [ ] Merge to staging branch
- [ ] Deploy to staging environment
- [ ] Run staging smoke test
- [ ] Deploy to production
- [ ] Monitor logs for 48 hours

**Total per industry:** ~8 hours (1 business day)

---

## Common Pitfalls & Solutions

### Pitfall 1: Database Migration Breaks In-Flight Sessions
**Problem:** Users mid-wizard when questions change  
**Solution:** 
- Add `questionnaire_version` column to custom_questions
- CompleteStep3Component loads questions by version
- Old sessions use old questions until completed

### Pitfall 2: Calculator Returns NaN or Negative Values
**Problem:** Edge case inputs cause calculation errors  
**Solution:**
- Add input validation to calculator
- Return null if invalid, wizard uses fallback
- Log error to Sentry for debugging

### Pitfall 3: SSOT Audit Fails After Integration
**Problem:** New hardcoded calculations introduced  
**Solution:**
- Run audit BEFORE commit (`pre-commit` hook)
- Fail CI/CD if violations > threshold
- Require manual review for calculator changes

### Pitfall 4: PDF Export Doesn't Include New Questions
**Problem:** Export logic hardcoded for old structure  
**Solution:**
- Update `generatePDF()` to read from database
- Use section_name for grouping
- Test export after each migration

### Pitfall 5: Performance Regression (Too Many DB Calls)
**Problem:** Loading 16 questions per industry * 23 industries  
**Solution:**
- Cache questions in memory (Supabase real-time)
- Use service worker for offline caching
- Pre-fetch common industries on wizard load

---

## Success Metrics

### Technical Metrics
- ✅ All 23 industries have 15-20 questions
- ✅ All 5 duplicate bugs fixed
- ✅ 0 SSOT violations in calculator services
- ✅ Build time < 5 seconds
- ✅ Wizard load time < 2 seconds

### Business Metrics
- 📈 Conversion rate (wizard start → quote generated)
- 📈 Quote accuracy (user-reported vs actual)
- 📈 Time to complete wizard (target: < 5 min)
- 📊 Calculator confidence scores (target: > 0.7 avg)
- 📊 PDF export adoption rate

### Quality Metrics
- 🐛 Bug rate (Sentry errors per 1,000 sessions)
- 🔄 Rollback rate (% of deployments rolled back)
- ⏱️ Time to deploy new industry (target: < 1 day)
- 📞 Support tickets related to wizard

---

## Rollback Strategy

### Per-Industry Rollback (< 5 min)
```bash
# 1. Disable feature flag
echo "VITE_ENABLE_HOTEL_16Q=false" >> .env.production

# 2. Redeploy
fly deploy

# 3. Restore old questions from backup
node scripts/rollback_industry_questions.mjs hotel
```

### Full System Rollback (< 15 min)
```bash
# 1. Revert all code changes
git revert <commit-range>

# 2. Restore all question backups
node scripts/restore_all_questions.mjs

# 3. Redeploy
fly deploy
```

---

## Next Steps

### Week 1: Fix Duplicate Bugs
Priority: Fix 5 industries with duplicate display_order

```bash
# Run fix script
node scripts/fix_display_order_duplicates.mjs

# Verify
node audit_all_industries.mjs
```

### Week 2: Build Infrastructure
- [ ] Create calculator template
- [ ] Create migration generator script
- [ ] Create integration generator script
- [ ] Set up feature flags system
- [ ] Write comprehensive test suite

### Week 3: First Migration (Hotel)
- [ ] Hotel 16Q migration SQL
- [ ] hotelCalculator16Q.ts service
- [ ] hotelIntegration.ts layer
- [ ] Update WizardV6.tsx
- [ ] Full testing cycle
- [ ] Deploy to staging

### Week 4-12: Systematic Rollout
- [ ] 1 industry per week
- [ ] Validate before moving to next
- [ ] Document learnings
- [ ] Adjust process as needed

---

## Questions to Answer Before Starting

1. **Business Priority:** Which 5 industries generate most revenue? (Start there)
2. **Resource Allocation:** Who owns this project? (1 dev full-time or split?)
3. **Testing Strategy:** Do we have QA team or manual testing only?
4. **Deployment Cadence:** Can we deploy weekly or need approval gates?
5. **Rollback Authority:** Who can make rollback decision without approval?
6. **Success Criteria:** What defines "done" for this project?

---

**Status:** READY FOR EXECUTIVE REVIEW  
**Next Action:** Get approval for Option B (Phased Rollout) and start Week 1


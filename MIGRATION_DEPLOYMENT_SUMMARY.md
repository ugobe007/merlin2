# 16Q Migration Deployment Summary
**Created:** January 22, 2026  
**Status:** All 7 migrations ready for deployment

---

## ✅ Migrations Created

| Industry | File | Questions | Sections | Status |
|----------|------|-----------|----------|--------|
| 1. Car Wash | `20260121_carwash_16q_v3.sql` | 16 | 6 | ✅ READY |
| 2. Hotel | `20260122_hotel_16q.sql` | 16 | 6 | ✅ READY |
| 3. Truck Stop | `20260122_truckstop_16q.sql` | 16 | 6 | ✅ READY |
| 4. EV Charging | `20260122_evcharging_16q.sql` | 16 | 6 | ✅ READY |
| 5. Hospital | `20260122_hospital_16q.sql` | 16 | 6 | ✅ READY |
| 6. Data Center | `20260122_datacenter_16q.sql` | 16 | 6 | ✅ READY |
| 7. Office | `20260122_office_16q.sql` | 16 | 6 | ✅ READY |

**Total:** 112 questions (16 × 7 industries)

---

## 🎯 Universal 16Q Framework Applied

All migrations follow the same **6-section structure**:

### Section 1: Topology (2 questions)
- Q1: Industry type/class (topology anchor)
- Q2: Scale factor (rooms, beds, kW, sq ft, etc.)

### Section 2: Infrastructure (2 questions)
- Q3: Electrical service size (constraint boundary)
- Q4: Voltage level (PCS compatibility)

### Section 3: Equipment (2-3 questions)
- Q5: Major equipment/amenities (load adders)
- Q6: Largest load or HVAC type
- Q7: Secondary equipment (optional)

### Section 4: Operations (4-5 questions)
- Q7-11: Utilization, throughput, schedules, load patterns

### Section 5: Financial (2 questions)
- Q12: Monthly electricity spend (ROI calibration)
- Q13: Utility rate structure (savings potential)

### Section 6: Resilience (2 questions)
- Q14: Power quality issues (multi-select, optional)
- Q15: Outage sensitivity (backup requirement)

### Section 7: Planning (1 question)
- Q16: Expansion plans (future-proof sizing, multi-select, optional)

---

## 🚀 Deployment Order (7-Week Rollout)

| Week | Industry | DB Slug | Deploy Date | Current Questions | New Questions |
|------|----------|---------|-------------|-------------------|---------------|
| 1 | Car Wash | `car-wash` | Jan 22 | 16 (already 16Q v1) | 16 (v3 refined) |
| 2 | Hotel | `hotel` | Jan 29 | 34 | 16 |
| 3 | Truck Stop | `heavy_duty_truck_stop` | Feb 5 | 22 | 16 |
| 4 | EV Charging | `ev-charging` | Feb 12 | 32 | 16 |
| 5 | Hospital | `hospital` | Feb 19 | 30 | 16 |
| 6 | Data Center | `data-center` | Feb 26 | 32 | 16 |
| 7 | Office | `office` | Mar 5 | 30 (+ duplicates) | 16 |

**Timeline:** Jan 22 – Mar 5, 2026 (7 weeks)

---

## 📝 Deployment Instructions

### Week 1: Car Wash (Deploy Today)

```bash
# 1. Open Supabase Dashboard
open https://supabase.com/dashboard/project/fvmpmozybmtzjvikrctq/sql/new

# 2. Copy migration
cat database/migrations/20260121_carwash_16q_v3.sql | pbcopy

# 3. Paste into SQL Editor and execute

# 4. Verify output
# Expected: DELETE 16, INSERT 16
# (Car wash already has 16Q v1, this is v3 refined)

# 5. Test wizard
npm run dev
open http://localhost:5178/wizard
```

### Weeks 2-7: Remaining Industries

Each week, repeat the same process:

1. **Monday:** Deploy migration in Supabase
2. **Monday-Wednesday:** Test wizard locally
3. **Wednesday:** Deploy to production
4. **Thursday-Friday:** Monitor for issues
5. **Friday:** Prepare next week's migration

**Template commands:**
```bash
# Deploy
cat database/migrations/20260122_[industry]_16q.sql | pbcopy
# Paste in Supabase SQL Editor

# Test
npm run dev
# Manual wizard test

# Deploy to prod
git add database/migrations/20260122_[industry]_16q.sql
git commit -m "feat(wizard): Deploy [industry] 16Q migration"
npm run build && flyctl deploy
```

---

## ⚠️ Known Issues to Fix

### Office Industry (Week 7)
**Duplicate display_order bug** - Must be fixed BEFORE deploying office migration:

```sql
-- Run this BEFORE deploying office 16Q
UPDATE custom_questions
SET display_order = display_order + 100
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
  AND display_order IN (
    SELECT display_order
    FROM custom_questions
    WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
    GROUP BY display_order
    HAVING COUNT(*) > 1
  );
```

Then deploy the 16Q migration.

---

## 🔍 Verification Checklist

After each deployment, verify:

- [ ] Expected DELETE count (current question count)
- [ ] Expected INSERT count (16)
- [ ] Verification query shows 6 sections
- [ ] Verification query shows 16 questions
- [ ] All display_order values 1-16 (no gaps)
- [ ] All required questions have `is_required = true`
- [ ] Multi-select questions have type `multi-select`
- [ ] Options JSON is valid
- [ ] Field names are camelCase
- [ ] Section names match: Topology, Infrastructure, Equipment, Operations, Financial, Resilience, Planning

---

## 📊 Success Metrics

### Technical
- [ ] All 7 migrations deployed successfully
- [ ] Zero duplicate display_order errors
- [ ] Build time < 5 seconds
- [ ] SSOT audit passes (0 violations)
- [ ] All wizards load in < 2 seconds

### Business
- [ ] Zero production bugs
- [ ] At least 1 test quote per industry
- [ ] User feedback positive
- [ ] Confidence scores > 0.7

### Coverage
- [ ] 112 questions deployed (16 × 7)
- [ ] 42 sections (6 × 7)
- [ ] 7 industries standardized
- [ ] 100% SSOT compliance

---

## 🎯 Next Steps After Week 7

Once all 7 top-revenue industries are deployed:

1. **Monitor & Validate** (2-4 weeks)
   - Collect user feedback
   - Verify confidence scores
   - Fix any edge cases

2. **Expand to Remaining 16 Industries** (6-10 weeks)
   - Residential (apartment, single-family)
   - Retail (shopping center, gas station)
   - Industrial (manufacturing, warehouse, cold storage)
   - Institutional (airport, college, government, casino)
   - Agricultural (indoor farm, general ag)
   - Microgrid

3. **Build Calculator Services** (parallel with deployments)
   - `hotel16QCalculator.ts` (Week 2)
   - `truckStop16QCalculator.ts` (Week 3)
   - `evCharging16QCalculator.ts` (Week 4)
   - `hospital16QCalculator.ts` (Week 5)
   - `dataCenter16QCalculator.ts` (Week 6)
   - `office16QCalculator.ts` (Week 7)

4. **Integration Layer** (parallel with deployments)
   - `hotelIntegration.ts` (Week 2)
   - Update `Step3Integration.tsx` each week
   - Add console logging for each industry

---

## 📁 File Locations

```
database/migrations/
├── 20260121_carwash_16q_v3.sql       ✅ Car wash (Week 1)
├── 20260122_hotel_16q.sql            ✅ Hotel (Week 2)
├── 20260122_truckstop_16q.sql        ✅ Truck stop (Week 3)
├── 20260122_evcharging_16q.sql       ✅ EV charging (Week 4)
├── 20260122_hospital_16q.sql         ✅ Hospital (Week 5)
├── 20260122_datacenter_16q.sql       ✅ Data center (Week 6)
└── 20260122_office_16q.sql           ✅ Office (Week 7)
```

---

## 🏆 Benefits of 16Q Framework

1. **Consistency:** All industries follow same 6-section pattern
2. **Speed:** Users complete in 3-5 minutes (vs 15+ for old questionnaires)
3. **Confidence:** Bottom-up load reconstruction from topology → operations
4. **TrueQuote™:** Every calculation traceable to authoritative source
5. **Future-proof:** Expansion plans question prevents undersizing
6. **Resilience:** Power quality + outage sensitivity built-in
7. **Financial:** ROI calibration + utility rate structure

---

**Status:** ALL 7 MIGRATIONS READY FOR DEPLOYMENT  
**Start Date:** January 22, 2026 (Today)  
**Completion Date:** March 5, 2026 (7 weeks)


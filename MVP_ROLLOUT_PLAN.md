# MVP Rollout Plan - Top 5 Industries
**Strategy:** Option 3 - MVP First (Safest)  
**Timeline:** 6 weeks migration + 4-8 weeks validation  
**Created:** January 22, 2026

---

## Executive Summary

**Approach:** Migrate only the **top 5 revenue-generating industries** to the new 16Q framework, validate business impact for 4-8 weeks, then decide whether to expand to remaining 18 industries.

**Benefits:**
- ✅ Minimal risk - only 5 industries affected
- ✅ Fast feedback - see results in 6 weeks
- ✅ Easy rollback - only 5 industries to revert if needed
- ✅ Proves value - business case for full rollout
- ✅ Resource efficient - 1 dev can handle in 6 weeks

---

## Top 7 Industries ✅ CONFIRMED

**User-confirmed top revenue generators (January 22, 2026):**

| Priority | Industry | DB Slug | Current Qs | Status | Timeline |
|----------|----------|---------|------------|--------|----------|
| 1️⃣ | **Car Wash** | car-wash | 16 | ✅ Migration ready | Week 1 |
| 2️⃣ | **Hotel** | hotel | 34 | ⏳ To build | Week 2 |
| 3️⃣ | **Truck Stop** | heavy_duty_truck_stop | 22 | ⏳ To build | Week 3 |
| 4️⃣ | **EV Charging Hub** | ev-charging | 32 | ⏳ To build | Week 4 |
| 5️⃣ | **Hospital** | hospital | 30 | ⏳ To build | Week 5 |
| 6️⃣ | **Data Center** | data-center | 32 | ⏳ To build | Week 6 |
| 7️⃣ | **Office** | office | 30 (has bug) | ⏳ To build | Week 7 |

**Scope expanded from 5 to 7 industries** - timeline extended by 2 weeks (total 7 weeks migration + 4-8 weeks validation)

---

## Current Status

### ✅ Already Complete: Car Wash
- 16 questions live in migration file
- Calculator service exists (`carWash16QCalculator.ts`)
- Integration layer complete (`carWashIntegration.ts`)
- Step3Integration detects and calls calculator
- **Next step:** Deploy to database

### ⏳ TODO: Remaining 4 Industries
Need to build following the car wash template:
1. Hotel
2. Hospital  
3. Data Center
4. Office or Manufacturing

---

## 7-Week MVP Implementation Plan

### Week 1: Deploy Car Wash (✅ Ready Now)
**Days 1-2: Car Wash Deployment**
- [ ] Backup current car wash questions
- [ ] Run migration via Supabase SQL Editor
- [ ] Verify 16 questions loaded correctly
- [ ] Test wizard flow end-to-end
- [ ] Deploy to production
- [ ] Monitor for 48 hours

**Days 3-5: Prepare for Week 2 (Hotel)**
- [ ] Research hotel industry power profiles
- [ ] Draft hotel 16Q question set
- [ ] Begin hotel calculator logic

**Status:** Week 1 deploys car wash, foundation for systematic rollout

---

### Week 2: Hotel 16Q (Highest Revenue)
**Industry Profile:**
- Type: Economy, Midscale, Upscale, Luxury
- Scale: Room count (50, 100, 150, 300+)
- Equipment: HVAC, water heaters, kitchen, laundry, pool heaters, elevators
- Throughput: Occupied rooms/day, check-ins/hour
- Service duration: Guest stay (1-3 days typical)
- Peak demand: Morning (7-9am) + Evening (6-8pm)

**Deliverables:**
- [ ] `20260122_hotel_16q.sql` migration
- [ ] `src/services/hotel16QCalculator.ts` calculator
- [ ] `src/components/wizard/hotelIntegration.ts` integration layer
- [ ] Update `Step3Integration.tsx` to detect 'hotel'
- [ ] Fix hardcoded values in WizardV6.tsx (if any)
- [ ] Unit tests for calculator
- [ ] Deploy to production
- [ ] Monitor for 48 hours

**Success Metrics:**
- ✅ Build passes
- ✅ SSOT audit passes
- ✅ Manual smoke test: Complete hotel wizard flow
- ✅ Calculator confidence > 0.7 average
- ✅ PDF export includes 16 hotel questions

---

### Week 3: Hospital 16Q (Critical Infrastructure)
**Industry Profile:**
- Type: Community, Regional, Trauma Center, Teaching
- Scale: Bed count (50, 150, 300, 500+)
- Equipment: Medical imaging (CT, MRI), sterilization, HVAC, emergency power, elevators
- Throughput: Patients/day, admissions/hour
- Service duration: Average stay (3-5 days)
- Peak demand: 24/7 but peaks during shift changes
- **Special:** 85% critical load (NEC 517, NFPA 99)

**Deliverables:**
- [ ] `20260129_hospital_16q.sql` migration
- [ ] `src/services/hospital16QCalculator.ts` calculator
- [ ] `src/components/wizard/hospitalIntegration.ts` integration
- [ ] Update Step3Integration.tsx
- [ ] Fix hardcoded values in WizardV6.tsx (if any)
- [ ] Deploy + monitor

**Special Considerations:**
- Hospital backup requirements are STRICT (4+ hours minimum)
- Sizing must account for 85% critical load
- References: NEC 517, NFPA 99, IEEE 446-1995

---

### Week 4: Data Center 16Q (Massive Energy)
**Industry Profile:**
- Type: Tier 1, Tier 2, Tier 3, Tier 4 (Uptime Institute)
- Scale: IT load (100kW, 500kW, 1MW, 5MW+)
- Equipment: Servers, cooling (CRAC units), UPS systems, networking, lighting
- Throughput: N/A (always-on)
- Service duration: 24/7/365
- Peak demand: Relatively flat (PUE 1.2-1.8)
- **Special:** 100% critical load for Tier 3/4

**Deliverables:**
- [ ] `20260205_datacenter_16q.sql` migration
- [ ] `src/services/dataCenter16QCalculator.ts` calculator
- [ ] `src/components/wizard/dataCenterIntegration.ts` integration
- [ ] Update Step3Integration.tsx
- [ ] Deploy + monitor

**Special Considerations:**
- Data centers have UPS already - BESS is for demand reduction, not backup
- PUE (Power Usage Effectiveness) critical metric
- Cooling is 40-50% of total load
- References: Uptime Institute, IEEE 446-1995

---

### Week 3: Truck Stop 16Q (High-Volume Commercial)
**Industry Profile:**
- Type: Independent, Chain franchise, Travel plaza, Weigh station
- Scale: Diesel pumps + amenities (< 10 pumps, 10-20, 20-50, 50+)
- Equipment: Fuel pumps, refrigeration, HVAC, lighting, EV chargers (future)
- Throughput: Trucks fueled/day
- Service duration: 15-30 min per truck
- Peak demand: 24/7 but peaks 6pm-10pm
- **Current:** 22 questions (good coverage, need refinement to 16Q)

**Deliverables:**
- [ ] `20260129_truckstop_16q.sql` migration
- [ ] `src/services/truckStop16QCalculator.ts` calculator
- [ ] `src/components/wizard/truckStopIntegration.ts` integration
- [ ] Update Step3Integration.tsx
- [ ] Deploy + monitor

**Special Considerations:**
- High 24/7 load from refrigeration
- Potential for large EV charging expansion
- Demand charges significant (200-500 kW peak typical)

---

### Week 4: EV Charging Hub 16Q (Future-Facing)
**Industry Profile:**
- Type: Workplace, Public (retail), Fleet depot, Highway corridor
- Scale: Charger count by type (Level 2: 7kW, DCFC: 150kW, HPC: 350kW)
- Equipment: Chargers (various levels), transformers, load management
- Throughput: Charging sessions/day
- Service duration: 20 min (DCFC) to 8 hours (L2)
- Peak demand: Highly variable (can spike 500+ kW instantly)
- **Current:** 32 questions (comprehensive, optimize to 16Q)
- **Special:** Already has dedicated calculator (`evChargingCalculations.ts`)

**Deliverables:**
- [ ] `20260205_evcharging_16q.sql` migration
- [ ] `src/services/evCharging16QCalculator.ts` (leverage existing)
- [ ] `src/components/wizard/evChargingIntegration.ts` integration
- [ ] Update Step3Integration.tsx
- [ ] Deploy + monitor

**Special Considerations:**
- BESS critical for demand management (avoid demand charges)
- Can reduce service size requirement by 30-50%
- Solar + BESS integration common
- References: SAE J3068, UL 2202

---

### Week 5: Hospital 16Q (Critical Infrastructure)
**Industry Profile:**
- Type: Class A, Class B, Class C
- Scale: Square footage (10k, 50k, 100k, 200k+)
- Equipment: HVAC (60-70% of load), lighting, elevators, server room, kitchen
- Throughput: Occupants/day, peak occupancy
- Service duration: Work shift (8-10 hours)
- Peak demand: 9am-5pm weekdays
- **Fix:** Current has duplicate display_order bug

**Deliverables:**
- [ ] Fix duplicate bug first
- [ ] `20260212_office_16q.sql` migration
- [ ] `src/services/office16QCalculator.ts` calculator
- [ ] `src/components/wizard/officeIntegration.ts` integration
- [ ] Update Step3Integration.tsx
- [ ] Deploy + monitor

**Special Considerations:**
- Office buildings have predictable schedules (good for arbitrage)
- ASHRAE 90.1 standards for energy efficiency
- Typically 12-15 W/sqft for modern buildings

---

### Week 6: Data Center 16Q (Massive Energy)
**Industry Profile:**
- Type: Light assembly, Heavy machinery, Process manufacturing, Food processing
- Scale: Square footage + shift count
- Equipment: Production machinery, HVAC, lighting, compressed air, material handling
- Throughput: Production units/day
- Service duration: Shift length (8-12 hours)
- Peak demand: Varies by process (inrush currents common)
- **Fix:** Current has duplicate display_order bug

**Deliverables:**
- [ ] Fix duplicate bug first
- [ ] `20260219_manufacturing_16q.sql` migration
- [ ] `src/services/manufacturing16QCalculator.ts` calculator
- [ ] `src/components/wizard/manufacturingIntegration.ts` integration
- [ ] Update Step3Integration.tsx
- [ ] Deploy + monitor

**Special Considerations:**
- Large motor starts (soft-start requirements)
- Power factor correction critical
- Shift patterns affect load profile
- References: IEEE 446-1995, ASHRAE Industrial Energy

---

## Validation Period (Weeks 7-14)

### Phase 1: Immediate Validation (Weeks 7-8)
**Monitor these metrics:**

| Metric | Current Baseline | Target | Measurement |
|--------|-----------------|--------|-------------|
| Wizard completion rate | ? | +10% | Analytics |
| Calculator confidence | N/A | >0.75 avg | Log analysis |
| Quote accuracy | ? | User feedback | Survey |
| Time to complete wizard | ? | <5 min | Analytics |
| PDF export adoption | ? | +15% | Analytics |
| Support tickets | ? | -20% | Zendesk |

**Data Collection:**
```javascript
// Add to analytics events
trackEvent('wizard_completed', {
  industry: 'hotel',
  calculator_used: true,
  confidence: 0.85,
  time_to_complete: 240, // seconds
  question_count: 16
});
```

### Phase 2: Business Impact (Weeks 9-14)
**Financial validation:**

| Industry | Quotes Generated | Conversion to Proposal | Average Deal Size | Revenue Impact |
|----------|-----------------|----------------------|-------------------|----------------|
| Hotel | ? | ? | ? | ? |
| Hospital | ? | ? | ? | ? |
| Data Center | ? | ? | ? | ? |
| Office | ? | ? | ? | ? |
| Manufacturing | ? | ? | ? | ? |
| **TOTAL** | **Target: 50+** | **Target: 30%** | **Baseline** | **Measure** |

**Qualitative feedback:**
- [ ] Survey 10+ users who completed new wizard
- [ ] Interview 3-5 sales team members
- [ ] Review PDF exports for quality/completeness
- [ ] Analyze Sentry errors for calculator failures

---

## Go/No-Go Decision Criteria (Week 14)

### ✅ GO - Expand to Remaining 18 Industries If:
1. **Technical Success:**
   - ✅ Zero production-breaking bugs
   - ✅ Calculator confidence >0.75 average
   - ✅ SSOT audit violations = 0
   - ✅ Build/deploy time <5 seconds

2. **Business Success:**
   - ✅ Wizard completion rate improves >5%
   - ✅ Quote accuracy improves (user feedback)
   - ✅ Support tickets reduce >10%
   - ✅ Sales team reports positive feedback

3. **User Success:**
   - ✅ Time to complete <5 minutes average
   - ✅ PDF exports look professional
   - ✅ Calculator results "feel right" to users
   - ✅ No major complaints about question flow

### 🛑 NO-GO - Revert to Old System If:
1. **Technical Failure:**
   - ❌ Multiple production bugs (>3 in 8 weeks)
   - ❌ Calculator confidence <0.5 average
   - ❌ SSOT violations increasing
   - ❌ Performance degradation

2. **Business Failure:**
   - ❌ Wizard completion rate drops >5%
   - ❌ Quote accuracy complaints increase
   - ❌ Support tickets spike >20%
   - ❌ Sales team refuses to use it

3. **User Failure:**
   - ❌ Time to complete >8 minutes
   - ❌ PDF exports broken or unprofessional
   - ❌ Calculator results wildly inaccurate
   - ❌ Major usability complaints

### ⏸️ PAUSE - Fix Issues Before Expanding If:
- 🟡 Mixed results (some success, some failure)
- 🟡 Technical issues but business success
- 🟡 Business issues but technical success
- 🟡 Need more data (extend validation to 12 weeks)

---

## Rollback Strategy

### Per-Industry Rollback (<5 min)
```bash
# Disable calculator
# In Step3Integration.tsx, comment out:
// if (industry === 'hotel') { ... }

# Restore old questions
node scripts/restore_industry_questions.mjs hotel

# Redeploy
npm run build && flyctl deploy
```

### Full MVP Rollback (<20 min)
```bash
# Revert all 5 industries at once
node scripts/restore_all_mvp_questions.mjs

# Redeploy
npm run build && flyctl deploy

# Restore car wash to original (if needed)
node scripts/restore_industry_questions.mjs car-wash
```

---

## Resource Requirements

### Development Time
- **Week 1:** 40 hours (car wash deploy + bug fixes)
- **Weeks 2-6:** 40 hours/week × 5 weeks = 200 hours
- **Weeks 7-14:** 10 hours/week × 8 weeks = 80 hours (monitoring)
- **Total:** 320 hours (~2 months for 1 developer)

### Infrastructure
- ✅ No additional servers needed
- ✅ No database upgrades needed
- ✅ Supabase free tier sufficient
- ⚠️ May need monitoring tools (Sentry, Analytics)

### Testing
- Manual smoke tests: ~2 hours per industry
- Automated tests: Build into development (unit tests)
- User acceptance testing: Sales team feedback (ongoing)

---

## Communication Plan

### Internal (Sales/Support Teams)
- **Week 1:** Announce MVP rollout, car wash live
- **Weeks 2-6:** Weekly updates on new industries
- **Week 7:** Training session on new wizard features
- **Week 14:** Present results, Go/No-Go decision

### External (Users)
- **Weeks 1-6:** Soft launch (no announcement)
- **Week 7:** Blog post: "Enhanced Industry Questionnaires"
- **Week 14:** If GO: Announce full expansion coming

### Stakeholders (Leadership)
- **Week 1:** Kickoff presentation
- **Week 6:** Halfway update
- **Week 10:** Preliminary results
- **Week 14:** Final recommendation + ROI analysis

---

## Success Case Study Template

After 14 weeks, if successful, document:

**Before (Old System):**
- 23 industries with 13-34 questions (inconsistent)
- No standardized calculator framework
- Hardcoded values in wizard
- SSOT violations

**After (New System - MVP 5 Industries):**
- 5 industries with standardized 16Q framework
- Industry-specific calculators with confidence scoring
- Real-time power metrics
- TrueQuote™ audit trails
- SSOT compliant

**Results:**
- Wizard completion: [X]% → [Y]% (+Z% improvement)
- Calculator confidence: N/A → [X]% average
- Quote accuracy: [User feedback quotes]
- Revenue impact: $[X] from 5 industries in 8 weeks

**Recommendation:**
- [ ] ✅ GO: Expand to remaining 18 industries (Weeks 15-27)
- [ ] ⏸️ PAUSE: Fix issues first, extend validation
- [ ] 🛑 NO-GO: Revert, try alternative approach

---

## Next Immediate Actions

### This Week (Week 0 - Pre-Launch):
1. **Confirm Top 5 Industries** (2 hours)
   - Review revenue data with sales/finance
   - Adjust priority list if needed
   - Get stakeholder approval

2. **Deploy Car Wash Migration** (2 hours)
   - Run backup script
   - Execute SQL in Supabase
   - Test wizard flow
   - Deploy to production

3. **Set Up Monitoring** (4 hours)
   - Add analytics events
   - Configure Sentry alerts
   - Create dashboard for metrics
   - Set up weekly report automation

4. **Start Hotel Migration** (Day 5 of Week 1)
   - Begin SQL migration file
   - Research hotel industry power profiles
   - Draft calculator logic

### Next Week (Week 1):
- Finish car wash deployment
- Fix duplicate bugs (office, manufacturing)
- Complete hotel migration
- Test + deploy hotel to production

---

## Questions to Answer Before Starting

1. **Confirm top 5 industries** - Are these your actual revenue generators?
2. **Analytics setup** - Do you have event tracking configured?
3. **Sales team involvement** - Who tests new industries before launch?
4. **Approval authority** - Who makes the Go/No-Go decision at Week 14?
5. **Budget** - Any budget for monitoring tools (Sentry, etc.)?

---

**Status:** MVP PLAN READY  
**Awaiting:** Confirmation of top 5 industries  
**Next Step:** Deploy car wash migration (Week 1, Day 1)


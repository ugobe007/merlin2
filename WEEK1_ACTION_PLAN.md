# Week 1 Action Plan - START NOW
**MVP Rollout: Top 7 Industries**  
**Status:** READY TO EXECUTE  
**Timeline:** This week (January 22-26, 2026)

---

## ✅ Confirmed Scope

Your top 7 revenue-generating industries (in priority order):
1. **Car Wash** ✅ - Migration ready, deploy now
2. **Hotel** - Build Week 2
3. **Truck Stop** (heavy_duty_truck_stop) - Build Week 3
4. **EV Charging Hub** (ev-charging) - Build Week 4
5. **Hospital** - Build Week 5
6. **Data Center** - Build Week 6
7. **Office** - Build Week 7 (fix duplicate bug first)

**Total timeline:** 7 weeks migration + 4-8 weeks validation = 11-15 weeks

---

## 🚀 THIS WEEK: Deploy Car Wash + Start Hotel

### Day 1 (Today): Car Wash Deployment

**Step 1: Deploy Migration (30 minutes)**
```bash
# 1. Open Supabase Dashboard
open https://supabase.com/dashboard/project/fvmpmozybmtzjvikrctq

# 2. Go to SQL Editor

# 3. Copy entire contents of this file:
cat database/migrations/20260121_carwash_16q_v3.sql

# 4. Paste into SQL Editor and execute

# 5. Verify with verification queries at end of file
```

**Step 2: Test Wizard (30 minutes)**
```bash
# 1. Start dev server
npm run dev

# 2. Open wizard
open http://localhost:5178/wizard

# 3. Manual smoke test:
# - Step 1: Select California
# - Step 2: Select "Car Wash"
# - Step 3: Answer 5-6 questions
# - Check console for: "🚗 Car Wash Power Metrics Updated"
# - Verify power gauge updates
# - Complete wizard
# - Export PDF → check car wash answers included
```

**Step 3: Deploy to Production (15 minutes)**
```bash
# 1. Commit migration record
git add database/migrations/20260121_carwash_16q_v3.sql
git commit -m "feat(wizard): Deploy car wash 16Q migration"

# 2. Build verification
npm run build

# 3. Deploy
flyctl deploy

# 4. Monitor logs
flyctl logs --app merlin3
```

**Success Criteria:**
- ✅ 16 questions visible in wizard
- ✅ Console shows car wash metrics calculated
- ✅ Power gauge updates in real-time
- ✅ Quote completes without errors
- ✅ PDF export includes car wash questions

---

### Days 2-5: Hotel 16Q Preparation

**Day 2: Research & Planning (4 hours)**
- [ ] Review existing hotel questions (34 currently)
- [ ] Map to 16Q framework
- [ ] Research hotel power benchmarks (ASHRAE, CBECS)
- [ ] Document industry-specific equipment
- [ ] Draft hotel question set

**Day 3: SQL Migration (4 hours)**
- [ ] Create `20260129_hotel_16q.sql`
- [ ] Write 16 questions following car wash pattern
- [ ] Section 1: Hotel type (economy/midscale/upscale/luxury) + room count
- [ ] Section 2: Infrastructure (service size, voltage)
- [ ] Section 3: Equipment (HVAC, water heaters, kitchen, laundry, pool, elevators)
- [ ] Section 4: Operations (occupancy rate, check-ins/hour, guest stay, hours)
- [ ] Section 5: Financial (monthly bill, rate structure)
- [ ] Section 6: Resilience (power quality, outage sensitivity)
- [ ] Section 7: Planning (add rooms, pool, EV chargers, solar)

**Day 4: Calculator Service (4 hours)**
- [ ] Create `src/services/hotel16QCalculator.ts`
- [ ] Clone car wash calculator structure
- [ ] Implement hotel-specific logic:
  ```typescript
  // Base load calculation
  const baseKWPerRoom = {
    economy: 5,      // kW per room
    midscale: 7,
    upscale: 10,
    luxury: 15
  };
  
  // Equipment loads
  const equipmentKW = {
    hvac: rooms * 3,           // 3 kW per room for HVAC
    water_heaters: rooms * 2,  // 2 kW per room
    kitchen: 150,              // Base kitchen load
    laundry: 75,               // Industrial laundry
    pool_heater: 100,          // If has pool
    elevators: 15 per elevator
  };
  
  // Concurrency factor (hotels never 100%)
  const hotelConcurrency = 0.70;  // 70% peak demand
  ```
- [ ] Add confidence scoring
- [ ] Add TrueQuote™ audit trail
- [ ] Write unit tests

**Day 5: Integration + Testing (4 hours)**
- [ ] Create `src/components/wizard/hotelIntegration.ts`
- [ ] Map question answers to calculator input
- [ ] Update `Step3Integration.tsx`:
  ```typescript
  if (industry === 'hotel' && Object.keys(answers).length > 0) {
    hotelMetrics = calculateHotelMetrics(answers);
    if (hotelMetrics) {
      console.log('🏨 Hotel Power Metrics Updated:', {
        peakKW: hotelMetrics.peakDemandKW,
        bessKW: hotelMetrics.bessRecommendedKW,
        bessKWh: hotelMetrics.bessRecommendedKWh,
        confidence: hotelMetrics.confidence,
      });
    }
  }
  ```
- [ ] Build + test locally
- [ ] Manual smoke test
- [ ] SSOT audit
- [ ] Deploy to staging (if available)

---

## Success Metrics Week 1

### Technical
- [ ] Car wash deployed to production
- [ ] 16 questions loading correctly
- [ ] Calculator returns confidence > 0.7
- [ ] Build time < 5 seconds
- [ ] SSOT audit passes (0 violations)

### Business
- [ ] Hotel migration 80% complete (ready for Week 2 deploy)
- [ ] Zero production bugs from car wash
- [ ] At least 1 test quote generated successfully

### Preparation
- [ ] Truck stop research started (Week 3 prep)
- [ ] Team briefed on rollout plan
- [ ] Monitoring dashboard configured

---

## Quick Reference

### File Locations
```
database/migrations/
  └── 20260121_carwash_16q_v3.sql          ✅ Ready
  └── 20260129_hotel_16q.sql                ⏳ Create Day 3

src/services/
  ├── carWash16QCalculator.ts               ✅ Exists
  ├── hotel16QCalculator.ts                 ⏳ Create Day 4
  ├── truckStop16QCalculator.ts             ⏳ Week 3
  ├── evCharging16QCalculator.ts            ⏳ Week 4
  ├── hospital16QCalculator.ts              ⏳ Week 5
  ├── dataCenter16QCalculator.ts            ⏳ Week 6
  └── office16QCalculator.ts                ⏳ Week 7

src/components/wizard/
  ├── carWashIntegration.ts                 ✅ Exists
  ├── hotelIntegration.ts                   ⏳ Create Day 5
  ├── Step3Integration.tsx                  ✅ Update Day 5
  └── [others TBD]
```

### Commands You'll Use
```bash
# Development
npm run dev                    # Start local server
npm run build                  # Verify TypeScript compiles
npm run lint                   # Check for errors

# Deployment
flyctl deploy                  # Deploy to production
flyctl logs --app merlin3      # Monitor logs

# Auditing
./audit-v6-ssot.sh src/        # Check SSOT compliance
node audit_all_industries.mjs  # Industry coverage audit

# Database
# Use Supabase SQL Editor (web UI) for migrations
```

---

## Immediate Next Steps

**RIGHT NOW:**
1. Copy car wash SQL migration
2. Open Supabase Dashboard
3. Execute migration in SQL Editor
4. Test wizard locally
5. Deploy to production

**TOMORROW (Day 2):**
Start hotel research and planning

**THIS WEEK GOAL:**
- ✅ Car wash live in production
- ✅ Hotel 80% ready for Week 2 deployment
- ✅ Zero blocking bugs

---

**Status:** READY TO EXECUTE  
**Start Time:** Now  
**First Milestone:** Car wash deployed (today)


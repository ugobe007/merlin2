# Complete Use Case Questions Audit
## December 12, 2025 - All 26 Use Cases

## ✅ COMPLETE WITH INDUSTRY-SPECIFIC QUESTIONS (6 use cases)

### 1. Gas Station ✅ **DEPLOYED**
- **Questions**: 16 industry-specific
- **Migration**: `20251212_fix_gas_station_questions.sql`
- **Status**: Deployed Dec 12, verified working
- **Key Fields**: `fuelDispensers`, `storeSqFt`, `hasCarWash`, `carWashType`, `hasServiceBays`
- **Specs**: 2-36 dispensers, 1k-25k sq ft store, car wash/service options

### 2. EV Charging Hub ✅ **READY TO DEPLOY**
- **Questions**: 16 industry-specific
- **Migration**: `20251212_fix_ev_charging_questions.sql`
- **Status**: Ready for deployment
- **Key Fields**: `hubSize`, `level2Chargers`, `dcfc50kwChargers`, `dcfc150kwChargers`, `dcfc350kwChargers`, `megawattChargers`
- **Specs**: Small/Medium/Super sites, 0.5-60+ MW, L2/50kW/150kW/350kW/1MW+ chargers

### 3. Hospital ✅ **READY TO DEPLOY**
- **Questions**: 19 industry-specific
- **Migration**: `20251212_fix_hospital_questions.sql`
- **Status**: Ready for deployment
- **Key Fields**: `hospitalSize`, `bedCount`, `operatingRooms`, `icuBeds`, `imagingEquipment`, `traumaCenterLevel`
- **Specs**: Small/Community/Regional/Major/Academic, 25-1,000+ beds, NEC 517/NFPA 99 compliant

### 4. Warehouse ✅ **READY TO DEPLOY**
- **Questions**: 17 industry-specific
- **Migration**: `20251212_fix_warehouse_questions.sql`
- **Status**: Ready for deployment
- **Key Fields**: `warehouseSize`, `warehouseSqFt`, `warehouseType`, `coldStorageSqFt`, `forkliftCount`
- **Specs**: Small/Medium/Large/Mega, 25k-1.5M+ sq ft, Distribution/Fulfillment/Cold Storage types

### 5. Manufacturing ✅ **READY TO DEPLOY**
- **Questions**: 19 industry-specific
- **Migration**: `20251212_fix_manufacturing_questions.sql`
- **Status**: Ready for deployment
- **Key Fields**: `manufacturingSize`, `squareFootage`, `industryType`, `productionEquipment`, `weldingScale`
- **Specs**: Small/Medium/Large/Heavy, 10k-600k+ sq ft, 8 industry types (Food, Auto, Electronics, Metals, etc.)

### 6. Data Center ✅ **READY TO DEPLOY**
- **Questions**: 18 industry-specific
- **Migration**: `20251212_fix_data_center_questions.sql`
- **Status**: Ready for deployment
- **Key Fields**: `dataCenterTier`, `itLoadMW`, `rackDensity`, `rackCount`, `targetPUE`, `upsConfiguration`
- **Specs**: Tier I/II/III/IV/Hyperscale, 0.5-500+ MW IT load, PUE 1.05-2.5

---

## ⚠️ NEEDS AUDIT - Has Questions but Unknown Quality (20 use cases)

These use cases have existing questions but need verification against industry standards:

### Commercial (10 use cases)
7. **Office Building** - `office`
8. **Hotel** - `hotel`
9. **Retail & Commercial** - `retail`
10. **Shopping Center/Mall** - `shopping-center`
11. **Car Wash** - `car-wash` (has dedicated CarWashWizard)
12. **Casino & Gaming** - `casino`
13. **Microgrid & Renewable** - `microgrid`
14. **Government & Public** - `government`
15. **College & University** - `college`
16. **Airport** - `airport`

### Residential (1 use case)
17. **Apartment Complex** - `apartment`
18. **Residential** - `residential`

### Agricultural (2 use cases)
19. **Indoor Farm** - `indoor-farm`
20. **Agricultural** - `agricultural`

### Industrial (2 use cases)
21. **Cold Storage** - `cold-storage` (distinct from warehouse cold storage)
22. **Warehouse & Logistics** - `warehouse` ⚠️ May need update based on new specs

### Institutional (2 use cases)
23. **Hospital** - `hospital` ⚠️ Being replaced with new 19-question migration
24. **Data Center** - `data-center` ⚠️ Being replaced with new 18-question migration

### Other (1 use case)
25. **Manufacturing Facility** - `manufacturing` ⚠️ Being replaced with new 19-question migration

---

## 🔍 RECOMMENDED NEXT AUDITS (Priority Order)

### High Priority - Premium Tier Use Cases
1. **Airport** - Major infrastructure, complex power needs
2. **College & University** - Campus-wide microgrid opportunity
3. **Government & Public** - Municipal facilities, fire stations, police

### Medium Priority - Common Commercial
4. **Office Building** - Already has dedicated specs (Dec 10, 2025)
5. **Hotel** - Already has dedicated specs + HotelWizard
6. **Retail & Commercial** - High volume use case
7. **Shopping Center/Mall** - Multi-tenant complexity

### Lower Priority - Specialized
8. **Casino & Gaming** - High power density, 24/7 ops
9. **Microgrid & Renewable** - Advanced applications
10. **Indoor Farm** - Specialized agricultural
11. **Cold Storage** - Specialized industrial

---

## 📊 SUMMARY STATISTICS

| Category | Count | Status |
|----------|-------|--------|
| **Complete with industry specs** | 6 | ✅ Ready (1 deployed, 5 to deploy) |
| **Has questions (needs audit)** | 20 | ⚠️ Unknown quality |
| **Total use cases** | 26 | Active in database |

### Questions by Status
- **Industry-specific questions**: 105 (6 use cases × avg 17.5 questions)
- **Existing questions**: Unknown count (needs audit)
- **Missing questions**: 0 (all use cases have something)

---

## 🎯 DEPLOYMENT PLAN

### Phase 1: Deploy Completed Migrations (NOW)
Run `scripts/deploy-industry-questions.sh` to deploy:
- EV Charging Hub (16 questions)
- Hospital (19 questions)
- Warehouse (17 questions)
- Manufacturing (19 questions)
- Data Center (18 questions)

### Phase 2: Audit High-Priority Use Cases
Get industry specs for:
1. Airport (similar to Hospital - critical infrastructure)
2. College & University (similar to Hotel - campus facilities)
3. Government & Public (similar to Data Center - uptime critical)

### Phase 3: Audit Common Commercial
Verify and enhance:
1. Office Building (specs already exist from Dec 10)
2. Hotel (specs already exist + HotelWizard)
3. Retail & Commercial
4. Shopping Center/Mall

### Phase 4: Audit Specialized Use Cases
Complete remaining 11 use cases

---

## 🔧 AUDIT SCRIPT USAGE

To audit any use case:

```bash
# Check current questions for a use case
node scripts/audit-with-specs.mjs

# Or use SQL directly
psql $DATABASE_URL << EOF
SELECT 
  cq.display_order,
  cq.question_text,
  cq.field_name,
  cq.question_type,
  jsonb_array_length(cq.options) as option_count
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'use-case-slug'
ORDER BY cq.display_order;
EOF
```

---

## 📋 FIELD NAME STANDARDS

All new migrations follow these conventions:

### Universal Fields (All Use Cases)
- `monthlyElectricBill` - Monthly electricity cost (dropdown ranges)
- `monthlyDemandCharges` - Peak demand charges (dropdown ranges)
- `gridCapacityKW` - Electrical service size (dropdown ranges)
- `existingSolarKW` - Solar already installed (dropdown ranges)
- `wantsSolar` - Boolean interest in solar
- `primaryBESSApplication` - How BESS will be used (select)
- `operatingHours` - When facility operates (select)

### Industry-Specific Fields
Each use case has 8-12 unique fields matching its industry:
- Gas Station: `fuelDispensers`, `storeSqFt`, `hasCarWash`
- EV Charging: `hubSize`, `level2Chargers`, `dcfc150kwChargers`
- Hospital: `bedCount`, `operatingRooms`, `traumaCenterLevel`
- Warehouse: `warehouseSqFt`, `coldStorageSqFt`, `forkliftCount`
- Manufacturing: `industryType`, `productionEquipment`, `weldingScale`
- Data Center: `dataCenterTier`, `itLoadMW`, `rackDensity`, `targetPUE`

---

## 🚀 TESTING CHECKLIST

After deploying migrations, test each use case:

### StreamlinedWizard Flow
1. [ ] Select use case from industry dropdown
2. [ ] Verify all questions appear in Section 2 (Facility Details)
3. [ ] Confirm dropdowns have correct options
4. [ ] Check default values are sensible
5. [ ] Test conditional questions (if applicable)

### Quote Generation
1. [ ] Fill out all required questions
2. [ ] Progress to Section 4 (Configuration)
3. [ ] Verify power/demand calculations
4. [ ] Generate quote via `calculateQuote()`
5. [ ] Check equipment breakdown
6. [ ] Verify financial metrics (payback, NPV, IRR)

### Data Validation
1. [ ] Check field names match power calculation functions
2. [ ] Verify help_text is useful
3. [ ] Confirm dropdown ranges make sense
4. [ ] Test with realistic values

---

*Document Generated: December 12, 2025*
*Status: 6 of 26 use cases have complete industry-specific questions*
*Next: Deploy 5 new migrations, then audit remaining 20 use cases*

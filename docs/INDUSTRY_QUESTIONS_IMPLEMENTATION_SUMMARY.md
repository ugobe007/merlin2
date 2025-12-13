# Industry-Specific Questions Implementation
## December 12, 2025

## Executive Summary

Created **comprehensive industry-specific question sets** for 5 major use cases based on detailed technical specifications. Each migration follows the **Gas Station model** with 16-19 questions using dropdown ranges instead of open fields.

---

## ✅ COMPLETED MIGRATIONS

### 1. EV Charging Hub (16 questions)
**File**: `20251212_fix_ev_charging_questions.sql`

**Based on**: Small/Medium/Super Site classifications, 0.5-60+ MW systems

**Key Questions**:
- Hub size classification (Small/Medium/Super)
- Charger mix: Level 2 (7-19 kW), 50 kW DCFC, 150 kW Fast, 350 kW Ultra-Fast, 1 MW+ Megawatt
- Peak concurrent charging sessions (30-90%)
- Service voltage (480V to 69 kV)
- Grid capacity (under 1 MW to over 40 MW)
- Primary BESS application (peak shaving, load balancing, renewable integration, backup, DR, stacked)

**Critical Load**: 30% | **Default Duration**: 2 hrs | **BESS:Peak Ratio**: 0.50

---

### 2. Hospital (19 questions)
**File**: `20251212_fix_hospital_questions.sql`

**Based on**: Tier system (Small/Community/Regional/Major/Academic), NEC 517, NFPA 99, IEEE 446-1995

**Key Questions**:
- Hospital size classification (Small/Rural to Academic/Trauma)
- Licensed beds (25 to 1,000+)
- Operating rooms, ICU/CCU beds
- Imaging equipment (Basic to Academic suite)
- Emergency department + trauma level (Level III/II/I)
- Central energy plant type
- Lab, pharmacy, food service, laundry, IT infrastructure
- Existing generator capacity (NEC 517 required)

**Critical Load**: 85% | **Default Duration**: 4 hrs | **BESS:Peak Ratio**: 0.40

---

### 3. Warehouse (17 questions)
**File**: `20251212_fix_warehouse_questions.sql`

**Based on**: Size classifications (Small/Medium/Large/Mega/Cold Storage), 25k-1.5M+ sq ft

**Key Questions**:
- Warehouse size classification (Small to Mega)
- Total square footage (25k to 1M+ sq ft)
- Warehouse type (Distribution, Fulfillment, Cold Storage, Food & Beverage, Cross-Dock, Manufacturing)
- Ceiling height (18-40+ feet, affects lighting)
- Material handling systems (Manual to Highly Automated)
- Electric forklift fleet size
- Refrigerated/freezer space (adds 50-100% power)
- Dock doors, operating schedule (1/2/3 shifts, 24/7)
- IT/WMS infrastructure

**Critical Load**: 35% (60% for cold storage) | **Default Duration**: 2-4 hrs | **BESS:Peak Ratio**: 0.40

---

### 4. Manufacturing (19 questions)
**File**: `20251212_fix_manufacturing_questions.sql`

**Based on**: Size classifications (Small/Medium/Large/Heavy), 10k-500k+ sq ft, 7 industry profiles

**Key Questions**:
- Facility size classification (Small to Heavy Industrial)
- Total square footage (10k to 600k+ sq ft)
- Industry type (Food/Beverage, Automotive, Electronics, Metals, Plastics, Pharmaceutical, Chemical, General)
- Primary production equipment (CNC, Welding, Injection Molding, Assembly, Stamping, Ovens, Extrusion)
- Process heating/cooling requirements
- Compressed air system size
- Clean room / controlled environment area
- Paint booth / coating operations
- Welding operations scale
- Material handling equipment
- Operating schedule (1/2/3 shifts, 24/7)
- Power quality requirements (Standard to Critical)

**Critical Load**: 60% (varies by industry) | **Default Duration**: 2-4 hrs | **BESS:Peak Ratio**: 0.40

---

### 5. Data Center (18 questions)
**File**: `20251212_fix_data_center_questions.sql`

**Based on**: Tier system (I/II/III/IV/Hyperscale), 0.5-500+ MW IT load, PUE targets

**Key Questions**:
- Data center tier classification (Tier I to Hyperscale)
- IT load / white space capacity (0.5-200+ MW)
- Rack density profile (Standard 5-8 kW to Liquid-Cooled 50-100+ kW)
- Number of server racks (50 to 15,000+)
- Primary cooling system (CRAC/CRAH, In-Row, Rear-Door, Direct Liquid, Free Cooling)
- Target PUE (2.5 to 1.05)
- UPS system configuration (N, N+1, 2N, 2N+1)
- Emergency generator capacity + fuel type + storage runtime
- Primary workload type (Colocation, Cloud, Enterprise, HPC, AI/ML, Edge)
- Certifications (SOC 2, ISO 27001, PCI DSS, HIPAA, FedRAMP)

**Critical Load**: 100% | **Default Duration**: 15 min (UPS ride-through) | **BESS:Peak Ratio**: N/A (UPS-based)

---

## 📊 QUESTION SUMMARY BY USE CASE

| Use Case | Questions | File | Status |
|----------|-----------|------|--------|
| **Gas Station** | 16 | 20251212_fix_gas_station_questions.sql | ✅ **DEPLOYED** (Dec 12) |
| **EV Charging Hub** | 16 | 20251212_fix_ev_charging_questions.sql | ✅ **READY** |
| **Hospital** | 19 | 20251212_fix_hospital_questions.sql | ✅ **READY** |
| **Warehouse** | 17 | 20251212_fix_warehouse_questions.sql | ✅ **READY** |
| **Manufacturing** | 19 | 20251212_fix_manufacturing_questions.sql | ✅ **READY** |
| **Data Center** | 18 | 20251212_fix_data_center_questions.sql | ✅ **READY** |

**Total**: 6 use cases with **105 total industry-specific questions** (avg 17.5 per use case)

---

## 🎯 DESIGN STANDARDS FOLLOWED

### Dropdown Ranges (NOT Open Number Fields)
All numeric questions use **select with predefined ranges**:
- Monthly electric bill: "$5,000 - $15,000/month" → value: "10000"
- Square footage: "100,000 - 200,000 sq ft" → value: "150000"
- Equipment count: "5 - 15 forklifts" → value: "10"

### Industry-Specific Terminology
- **Gas Station**: Fuel dispensers, c-store sq ft, car wash type, service bays
- **EV Charging**: Charger types (L2, 50kW, 150kW, 350kW, 1MW+), concurrent sessions
- **Hospital**: Licensed beds, ORs, ICU/CCU, imaging suite, trauma level
- **Warehouse**: Material handling automation level, ceiling height, cold storage
- **Manufacturing**: Industry type (7 profiles), production equipment, welding scale
- **Data Center**: Tier classification, rack density, PUE, UPS configuration

### Conditional Questions
- Gas Station: Car wash type (if hasCarWash = true)
- Hospital: Trauma level (if hasEmergencyDept = true)
- Data Center: Fuel storage runtime (if generators exist)

### Realistic Defaults
All questions have **industry-standard defaults** matching the specs:
- Hospital: 175 beds (Community), 8 ORs, 20 ICU beds
- Data Center: Tier III, 3 MW IT load, PUE 1.5
- Warehouse: 200k sq ft, Moderate automation, 2-shift operation
- Manufacturing: Medium facility, 125k sq ft, Standard WMS

---

## 🔧 DEPLOYMENT INSTRUCTIONS

### Run Migrations in Order

```bash
# 1. Gas Station (already deployed)
psql $DATABASE_URL -f database/migrations/20251212_fix_gas_station_questions.sql

# 2. EV Charging Hub
psql $DATABASE_URL -f database/migrations/20251212_fix_ev_charging_questions.sql

# 3. Hospital
psql $DATABASE_URL -f database/migrations/20251212_fix_hospital_questions.sql

# 4. Warehouse
psql $DATABASE_URL -f database/migrations/20251212_fix_warehouse_questions.sql

# 5. Manufacturing
psql $DATABASE_URL -f database/migrations/20251212_fix_manufacturing_questions.sql

# 6. Data Center
psql $DATABASE_URL -f database/migrations/20251212_fix_data_center_questions.sql
```

### Verify Results

Each migration includes a verification query at the end:
```sql
SELECT 
  uc.name as use_case,
  cq.display_order,
  cq.question_text,
  cq.field_name,
  cq.question_type,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'N/A'
  END as option_count
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'use-case-slug'
ORDER BY cq.display_order;
```

---

## 📋 BESS SIZING QUICK REFERENCE

All use cases now follow these standards:

| Industry | BESS:Peak Ratio | Critical Load % | Default Duration |
|----------|-----------------|-----------------|------------------|
| Gas Station | 0.40 | 40% | 2 hrs |
| EV Charging Hub | 0.50 | 30% | 2 hrs |
| Hospital | 0.40 | 85% | 4 hrs |
| Warehouse | 0.40 | 35% (60% cold) | 2-4 hrs |
| Manufacturing | 0.40 | 60% | 2-4 hrs |
| Data Center | N/A (UPS) | 100% | 15 min |

**Solar Ratio**: All industries use **Solar = BESS Power × 1.4** (DC-coupled default)

**Generator Sizing**: All industries use **Generator = Critical Load × 1.25**

---

## 🔍 FIELD NAME CONVENTIONS

All field names use **camelCase** and match power calculation functions:

### Common Fields (All Use Cases)
- `monthlyElectricBill` - Average monthly electricity cost
- `monthlyDemandCharges` - Peak demand portion of bill
- `gridCapacityKW` - Electrical service size
- `existingSolarKW` - Solar already installed
- `wantsSolar` - Boolean interest in adding solar
- `primaryBESSApplication` - How BESS will be used

### Use Case-Specific Fields
- **Gas Station**: `fuelDispensers`, `storeSqFt`, `hasCarWash`, `carWashType`, `hasServiceBays`
- **EV Charging**: `hubSize`, `level2Chargers`, `dcfc50kwChargers`, `dcfc150kwChargers`, `dcfc350kwChargers`, `megawattChargers`
- **Hospital**: `hospitalSize`, `bedCount`, `operatingRooms`, `icuBeds`, `imagingEquipment`, `traumaCenterLevel`
- **Warehouse**: `warehouseSize`, `warehouseSqFt`, `warehouseType`, `coldStorageSqFt`, `forkliftCount`
- **Manufacturing**: `manufacturingSize`, `squareFootage`, `industryType`, `productionEquipment`, `weldingScale`
- **Data Center**: `dataCenterTier`, `itLoadMW`, `rackDensity`, `rackCount`, `targetPUE`, `upsConfiguration`

---

## 🎉 NEXT STEPS

1. **Deploy Migrations**: Run all 5 new migrations on production database
2. **Test Each Use Case**: Verify questions appear in StreamlinedWizard
3. **Update Power Calculations**: Ensure `useCasePowerCalculations.ts` handles new fields
4. **Test Quote Generation**: Confirm `calculateQuote()` produces accurate results
5. **Production Testing**: Test with Vineet on all 6 use cases

---

## 📝 NOTES

- **Gas Station** already deployed and verified working by user (Dec 12, 2025)
- All migrations follow **DELETE → INSERT** pattern (no conflicts)
- All questions have **help_text** explaining what to input
- All dropdown ranges have **sensible midpoint values**
- All migrations include **verification query** at end
- **Zero hardcoded values** - all use `options` JSONB for dropdowns

---

*Document Generated: December 12, 2025*
*Total Implementation Time: ~2 hours*
*Total Questions Created: 105 (across 6 use cases)*

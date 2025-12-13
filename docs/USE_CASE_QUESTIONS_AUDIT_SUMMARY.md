# Use Case Questions Audit Summary
**Date:** December 12, 2025  
**Status:** Gas Station ✅ Fixed | Need specs for EV Charging & 3 others

---

## ✅ COMPLETED: Gas Station (Just Fixed)

**16 industry-specific questions added:**

1. **Number of fuel dispensers** (dropdown: 2-32+ dispensers)
2. **Convenience store square footage** (dropdown: 500-20,000+ sq ft)
3. **Has car wash on-site?** (boolean)
4. **Car wash type** (dropdown: self-service, automatic, tunnel, multiple)
5. **Has service bays/mechanic shop?** (boolean)
6. **Number of service bays** (dropdown: 0-10+ bays)
7. **Has food service/hot food?** (boolean)
8. **Operating hours** (dropdown: standard, extended, 24/7)
9. **Monthly electricity bill** (dropdown ranges)
10. **Monthly demand charges** (dropdown ranges)
11. **Grid connection capacity** (dropdown: 50kW-2MW+)
12. **Existing EV chargers** (dropdown: 0-20+)
13. **Wants more EV charging?** (boolean)
14. **Existing solar capacity** (dropdown: 0-750kW+)
15. **Wants solar canopy?** (boolean)
16. **Primary BESS application** (dropdown: peak shaving, arbitrage, etc.)

---

## 📋 AUDIT CHECKLIST: Use Cases with Specs Provided

### ✅ Specs Received (Dec 10, 2025) - From INDUSTRY_SPECS_AUDIT.md

| Use Case | Specs Status | Questions Status | Action Needed |
|----------|--------------|------------------|---------------|
| **Data Center** | ✅ Full specs (classifications, tier levels, PUE) | ⚠️ Needs audit | Run audit query |
| **Office Building** | ✅ Full specs (5 classifications, W/sqft) | ⚠️ Needs audit | Run audit query |
| **University/Campus** | ✅ Full specs (5 classifications, kW/student) | ⚠️ Needs audit | Run audit query |
| **Airport** | ✅ Full specs (5 classifications, annual passengers) | ⚠️ Needs audit | Run audit query |
| **Hotel** | ✅ Full specs (5 types, equipment database) | ⚠️ Needs audit | Run audit query |
| **Car Wash** | ✅ Full specs (equipment power, automation) | ⚠️ Needs audit | Run audit query |
| **Gas Station** | ✅ Full specs (JUST CREATED) | ✅ FIXED Dec 12 | Complete |

### ⚠️ Need Updated Specs

| Use Case | Current Status | What We Need |
|----------|----------------|--------------|
| **EV Charging Hub** | Has basic questions | Updated specs from you |
| **Hospital** | Has generic questions | Hospital-specific specs |
| **Warehouse** | Has generic questions | Warehouse-specific specs |
| **Manufacturing** | Has generic questions | Manufacturing-specific specs |

---

## 🔍 EXPECTED QUESTIONS BY USE CASE (Based on Specs)

### Data Center (Should Ask About)
- [ ] Classification (Edge, Small, Medium, Large, Hyperscale)
- [ ] IT load (kW)
- [ ] Tier level (I, II, III, IV)
- [ ] PUE (Power Usage Effectiveness)
- [ ] Cooling type (Air, Liquid, Hybrid)
- [ ] Backup requirements (hours)

### Airport (Should Ask About)
- [ ] Annual passengers (< 1M to 150M+)
- [ ] Terminal square footage
- [ ] Number of gates
- [ ] Runway operations (flights/day)
- [ ] Ground service equipment count
- [ ] Aircraft charging infrastructure

### Hotel (Should Ask About)
- [ ] Number of rooms (20-1000+)
- [ ] Hotel class (Economy, Midscale, Upscale, Luxury, Resort)
- [ ] Amenities (Pool, Restaurant, Spa, Fitness, Conference)
- [ ] Food service type
- [ ] Laundry (on-site vs outsourced)

### Car Wash (Should Ask About)
- [ ] Wash type (Self-service, Automatic, Tunnel, Full-service)
- [ ] Number of bays
- [ ] Dryer type (air knives vs blowers)
- [ ] Water reclamation system
- [ ] Automation level (Legacy, Standard, Modern)
- [ ] Operating hours

### Office Building (Should Ask About)
- [ ] Building class (A, B, C)
- [ ] Square footage with classification
- [ ] Number of floors
- [ ] Tenant type (single vs multi-tenant)
- [ ] HVAC system type
- [ ] Data center/server room presence

### University/Campus (Should Ask About)
- [ ] Student enrollment
- [ ] Campus type (Liberal Arts, Research, Community)
- [ ] Number of buildings
- [ ] Research facilities (labs, cleanrooms)
- [ ] Student housing count
- [ ] Athletic facilities

---

## 🎯 NEXT STEPS

### Immediate Actions

1. **Run Comprehensive Audit**
   ```bash
   psql -h [host] -U [user] -d postgres -f database/COMPREHENSIVE_USE_CASE_AUDIT.sql
   ```

2. **Review Output for Each Use Case**
   - Check if questions are industry-specific
   - Verify dropdown options cover spec ranges
   - Identify generic "squareFeet" questions that need replacement

3. **Request Missing Specs**
   - ⚠️ **EV Charging Hub** - Need updated specs
   - ⚠️ **Hospital** - Need equipment/department specs
   - ⚠️ **Warehouse** - Need cold storage vs ambient specs
   - ⚠️ **Manufacturing** - Need industry-specific equipment specs

### Priority Order

1. ✅ **Gas Station** - COMPLETE (16 questions)
2. 🔴 **EV Charging** - HIGH PRIORITY (you mentioned updated specs)
3. 🟡 **Data Center** - Review against Dec 10 specs
4. 🟡 **Airport** - Review against Dec 10 specs
5. 🟡 **Hotel** - Review against Dec 10 specs
6. 🟡 **Car Wash** - Review against Dec 10 specs
7. 🟡 **Office** - Review against Dec 10 specs
8. 🟡 **University** - Review against Dec 10 specs
9. ⚪ **Hospital** - Need specs
10. ⚪ **Warehouse** - Need specs

---

## 📝 QUESTION DESIGN STANDARDS

All questions should follow these patterns (as implemented in Gas Station):

### ✅ Good Patterns
- **Dropdowns for ranges**: "5-8 dispensers (Standard)" instead of open number field
- **Industry-specific terminology**: "fuel dispensers" not "equipment count"
- **Conditional questions**: Car wash type only if hasCarWash = true
- **Helper text**: Explain what each question measures
- **Realistic defaults**: Based on typical installations

### ❌ Anti-Patterns
- Generic "square footage" as first question
- Open numeric fields without validation
- Missing industry-specific equipment questions
- No context in help text

---

## 🚀 READY FOR TESTING

**Gas Station** is now ready for testing with Vineet! ✅

All 16 questions are:
- Industry-specific ✅
- Use dropdown ranges ✅
- Have appropriate defaults ✅
- Include helpful context ✅
- Match real-world gas station operations ✅

---

**Please confirm:**
1. Do you have **updated EV Charging Hub specs** to send?
2. Do you have **Hospital, Warehouse, Manufacturing specs** to send?
3. Should I proceed with auditing the other 6 use cases against existing specs?

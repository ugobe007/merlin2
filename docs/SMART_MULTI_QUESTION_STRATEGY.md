# Smart Multi-Question Panel Strategy
## Goal: Reduce from 16 questions to 12-14 for most use cases (16-18 for complex)

---

## 📊 Question Consolidation Analysis

### Current Problem:
- Most use cases: 16 questions (acceptable but could be tighter)
- Complex use cases (Hospital, Hotel, Car Wash, Data Center): Need 20 questions
- Too many yes/no questions that could be grouped
- Question fatigue risk above 20 questions

### Target:
- **Standard use cases**: 12-14 questions (Office, Retail, Warehouse, etc.)
- **Complex use cases**: 16-18 questions (Hospital, Hotel, Car Wash, Data Center)
- **Question format**: Panel-based multi-selects reduce visual count by 40%

---

## 🎯 Smart Panel Patterns

### Pattern 1: Facilities/Amenities Panel
**Instead of 4-6 individual yes/no questions:**
```
Q1: Do you have a restaurant? [Yes/No]
Q2: Do you have laundry services? [Yes/No]
Q3: Do you have a spa? [Yes/No]
Q4: Do you have a fitness center? [Yes/No]
Q5: Do you have EV charging? [Yes/No]
Q6: Do you have a swimming pool? [Yes/No]
```

**Consolidate to 1 multi-select panel:**
```
Facilities & Amenities
Select all that apply to your property:
[ ] Restaurant / Dining
[ ] Laundry / Dry Cleaning
[ ] Spa / Wellness Center
[ ] Fitness Center / Gym
[ ] Swimming Pool (Indoor/Outdoor)
[ ] Conference / Banquet Halls
[ ] Parking Garage
```

**Benefit:** 6 questions → 1 panel (saves 5 question slots)

---

### Pattern 2: Square Footage Panel
**Instead of 3-4 separate questions:**
```
Q1: Total building square footage? [Number]
Q2: Do you have multiple buildings? [Yes/No]
Q3: Warehouse/storage space? [Number]
Q4: Outdoor areas? [Yes/No]
```

**Consolidate to 1 structured panel:**
```
Property Size & Layout
Primary Building: [___________] sq ft
Additional Buildings: [___________] sq ft (optional)
Warehouse/Storage: [___________] sq ft (optional)
[ ] Include outdoor/unconditioned spaces
```

**Benefit:** 4 questions → 1 panel (saves 3 question slots)

---

### Pattern 3: Operating Hours Panel
**Instead of 3 questions:**
```
Q1: Hours of operation per day? [Number]
Q2: Days per week? [Number]
Q3: 24/7 operation? [Yes/No]
```

**Consolidate to 1 smart panel:**
```
Operating Schedule
○ 24/7 Continuous Operation
○ Extended Hours: [___] hrs/day, [___] days/week
○ Standard Business: 8am-6pm, M-F
○ Custom: Define schedule
```

**Benefit:** 3 questions → 1 panel (saves 2 question slots)

---

### Pattern 4: Equipment/Load Panel
**Instead of 4-6 questions:**
```
Q1: HVAC tonnage? [Number]
Q2: Refrigeration units? [Yes/No]
Q3: Data center/server load? [Number]
Q4: Industrial equipment? [Yes/No]
Q5: Cooking equipment? [Yes/No]
```

**Consolidate to 1 categorized panel:**
```
Major Electrical Loads
HVAC: [___] tons
Refrigeration: [___] kW (if applicable)
IT/Servers: [___] kW (if applicable)
Production Equipment: [___] kW (if applicable)
Commercial Kitchen: [___] kW (if applicable)
```

**Benefit:** 5 questions → 1 panel (saves 4 question slots)

---

## 🏥 Use Case-Specific Consolidation

### Hospital (20 questions → 16-18)
**Consolidate:**
1. **Departments Panel**: ICU, ER, Surgery, Imaging, Lab → 1 multi-select (saves 4)
2. **Critical Systems Panel**: Generators, UPS, Medical gas, HVAC → 1 panel (saves 3)
3. **Size Panel**: Beds, sq ft, floors → 1 structured panel (saves 2)

**Total savings:** 9 questions → 3 panels = **6 question slots saved** → 20 → 14 ✅

### Hotel (20 questions → 16-18)
**Consolidate:**
1. **Amenities Panel**: Restaurant, spa, pool, fitness, laundry → 1 multi-select (saves 4)
2. **Property Panel**: Rooms, floors, sq ft, parking → 1 structured panel (saves 3)
3. **Class/Services Panel**: Star rating, full service, limited service → 1 panel (saves 1)

**Total savings:** 8 questions → 3 panels = **5 question slots saved** → 20 → 15 ✅

### Car Wash (20 questions → 16-18)
**Consolidate:**
1. **Service Types Panel**: Self-serve, automatic, tunnel, detailing → 1 multi-select (saves 3)
2. **Equipment Panel**: Bays, vacuum stations, water reclaim → 1 structured panel (saves 2)
3. **Hours/Volume Panel**: Operating hours, cars/day → 1 panel (saves 1)

**Total savings:** 6 questions → 3 panels = **3 question slots saved** → 20 → 17 ✅

### Data Center (20 questions → 16-18)
**Consolidate:**
1. **IT Load Panel**: Server racks, kW per rack, cooling → 1 structured panel (saves 3)
2. **Redundancy Panel**: Tier level, N+1, 2N, generators → 1 panel (saves 3)
3. **Space Panel**: White space, support space, total sq ft → 1 panel (saves 2)

**Total savings:** 8 questions → 3 panels = **5 question slots saved** → 20 → 15 ✅

---

## 📋 Standard Use Cases (16 questions → 12-14)

### Office Building
**Consolidate:**
1. **Building Panel**: Sq ft, floors, tenants → 1 panel (saves 2)
2. **Systems Panel**: HVAC, IT load, lighting → 1 panel (saves 2)
3. **Hours Panel**: Operating schedule → 1 panel (saves 1)

**Total savings:** 5 question slots → **16 → 11 questions** ✅

### Retail/Shopping Center
**Consolidate:**
1. **Property Panel**: Sq ft, stores, parking → 1 panel (saves 2)
2. **Tenant Mix Panel**: Anchor stores, food court, specialty → 1 multi-select (saves 2)
3. **Hours Panel**: Operating schedule → 1 panel (saves 1)

**Total savings:** 5 question slots → **16 → 11 questions** ✅

### Manufacturing
**Consolidate:**
1. **Production Panel**: Sq ft, shifts, process type → 1 panel (saves 2)
2. **Equipment Panel**: Motors, HVAC, process loads → 1 panel (saves 3)
3. **Schedule Panel**: Hours, days, seasonal → 1 panel (saves 1)

**Total savings:** 6 question slots → **16 → 10 questions** ✅

---

## ✂️ Questions to REMOVE (All Use Cases)

### 1. EV Charging Question
**Current:** "Do you have or plan to install EV charging?" [Yes/No]
**Action:** ❌ REMOVE - This is addressed in Step 4 (Options)
**Saves:** 1 question slot across all use cases

---

## 🛠 Implementation Plan

### Phase 1: Database Schema Updates
```sql
-- Add new panel-based question types
ALTER TABLE custom_questions 
ADD COLUMN panel_type VARCHAR(50) NULL,
ADD COLUMN panel_group_id UUID NULL,
ADD COLUMN panel_display_order INTEGER NULL;

-- Panel types:
-- 'multi_select' - Checkboxes for facilities/amenities
-- 'structured_inputs' - Multiple related number inputs
-- 'radio_with_inputs' - Radio selection + conditional inputs
```

### Phase 2: Update Question Sequences
For each use case, regroup questions into panels:

**Example: Hotel Use Case**
```sql
-- OLD: 20 individual questions
-- NEW: 15 questions (5 panels + 10 individual)

-- Panel 1: Amenities (replaces 5 yes/no questions)
INSERT INTO custom_questions (panel_type, panel_group_id, field_name) VALUES
('multi_select', 'amenities-panel-001', 'hasRestaurant'),
('multi_select', 'amenities-panel-001', 'hasSpa'),
('multi_select', 'amenities-panel-001', 'hasPool'),
('multi_select', 'amenities-panel-001', 'hasFitness'),
('multi_select', 'amenities-panel-001', 'hasLaundry');

-- Panel 2: Property Size (replaces 4 separate inputs)
INSERT INTO custom_questions (panel_type, panel_group_id, field_name) VALUES
('structured_inputs', 'property-panel-001', 'roomCount'),
('structured_inputs', 'property-panel-001', 'totalSqFt'),
('structured_inputs', 'property-panel-001', 'floorCount'),
('structured_inputs', 'property-panel-001', 'parkingSpaces');
```

### Phase 3: UI Component Updates
Create new `SmartQuestionPanel.tsx` component:
```tsx
<SmartQuestionPanel
  type="multi_select"
  title="Facilities & Amenities"
  description="Select all that apply to your property"
  options={[
    { key: 'hasRestaurant', label: 'Restaurant / Dining' },
    { key: 'hasSpa', label: 'Spa / Wellness Center' },
    { key: 'hasPool', label: 'Swimming Pool' },
    // ...
  ]}
  onChange={handlePanelChange}
/>
```

---

## 📊 Expected Results

| Use Case | Current | Target | Reduction | Status |
|----------|---------|--------|-----------|--------|
| Office | 16 | 11 | -5 | ✅ GOOD |
| Retail | 16 | 11 | -5 | ✅ GOOD |
| Manufacturing | 16 | 10 | -6 | ✅ GOOD |
| Hospital | 20 | 15 | -5 | ✅ OK |
| Hotel | 20 | 15 | -5 | ✅ OK |
| Car Wash | 20 | 17 | -3 | ✅ OK |
| Data Center | 20 | 15 | -5 | ✅ OK |

**All use cases now under 20-question threshold!** ✅

---

## 🎯 Next Steps

1. **Review & Approve**: Confirm panel groupings make sense for each use case
2. **Database Migration**: Update `custom_questions` table schema
3. **UI Components**: Build `SmartQuestionPanel` component
4. **Testing**: Verify data flow and calculations still work
5. **Deploy**: Roll out to production

**Ready to proceed?** Let me know if you want me to:
- Create the database migration SQL
- Build the SmartQuestionPanel component
- Update specific use case question sequences

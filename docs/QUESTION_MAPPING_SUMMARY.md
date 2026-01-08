# Question Mapping Summary - Per Use Case

## ✅ Current Implementation Status

### Fixed Issues:

1. **✅ Dynamic Question Loading**
   - `Step3Details.tsx` now loads questions from database based on `state.industry`
   - No longer hardcoded to `CAR_WASH_QUESTIONS`
   - Supports all use cases with database questions

2. **✅ Field Name Mapping**
   - Database schema uses `question_key`, migrations use `field_name`
   - Transformation handles both for compatibility
   - Service layer returns both formats

3. **✅ Options Format**
   - Database schema uses `select_options` (JSONB)
   - Migrations use `options` (JSONB)
   - Transformation handles both formats

4. **✅ Question Type Mapping**
   - Database: `'number' | 'select' | 'boolean' | 'percentage' | 'text' | 'range'`
   - UI: `'buttons' | 'slider' | 'number_buttons' | 'toggle' | 'area_input'`
   - Automatic mapping based on type and presence of min/max values

5. **✅ Section Mapping**
   - Uses `section_name` from database if available
   - Falls back to intelligent inference from field names
   - Groups questions into: `facility`, `operations`, `energy`, `solar`

## 🔄 Question Loading Flow

```
Step 2: User selects industry
  └─> state.industry = 'heavy_duty_truck_stop'

Step 3: Component loads
  └─> Step3Details.tsx: useEffect(() => loadQuestions())

1. Normalize slug
   └─> 'heavy_duty_truck_stop'.replace(/-/g, '_') = 'heavy_duty_truck_stop'

2. Fetch from database
   └─> UseCaseService.getUseCaseBySlug('heavy_duty_truck_stop')
       └─> SELECT * FROM use_cases WHERE slug = 'heavy_duty_truck_stop'
       └─> SELECT * FROM custom_questions WHERE use_case_id = <id> ORDER BY display_order

3. Transform questions
   └─> transformDatabaseQuestion(q, index) for each question
       └─> Maps database format → UI Question interface
       └─> Handles field_name/question_key, select_options/options
       └─> Maps question types (number → slider/number_buttons)
       └─> Maps sections (section_name or inference)

4. Render in UI
   └─> QuestionnaireEngine displays questions one at a time
   └─> QuestionRenderer renders based on question type
   └─> ProgressSidebar shows progress per section
   └─> MerlinGuide provides contextual tips (future: from database)
```

## 📋 Use Case → Questions Mapping

### Car Wash
- **Database Slug**: `car-wash` or `car_wash`
- **Questions Source**: Database (if exists) OR `CAR_WASH_QUESTIONS` config (fallback)
- **Question Count**: 18 questions
- **Sections**: Facility Basics, Operations, Energy Systems, Solar Potential

### Truck Stop / Travel Center
- **Database Slug**: `heavy_duty_truck_stop`
- **Questions Source**: Database (20 questions)
- **Question Count**: 20 questions
- **Sections**: 
  - Facility (facility size, square footage)
  - Energy Systems (MCS chargers, DCFC, Level 2, service bays, truck wash)
  - Operations (operating hours, monthly bills)
  - Solar Potential (existing solar, backup requirements)

### Hotel / Hospitality
- **Database Slug**: `hotel` or `hotel-hospitality`
- **Questions Source**: Database
- **Question Count**: Varies
- **Sections**: Facility, Operations, Energy, Solar

### Data Center
- **Database Slug**: `data_center` or `data-center`
- **Questions Source**: Database
- **Question Count**: Varies
- **Sections**: Facility, Operations, Energy, Solar

## 🧙 Merlin Guidance System

### Current Status:
- `MerlinGuide` component is positioned at top-left of screen
- Provides step-specific and industry-specific guidance
- Uses `step`, `industry`, and `state` props for context

### Future Enhancement:
- Add `merlin_tip` column to `custom_questions` table
- Store per-question Merlin tips in database
- Display tips in `QuestionRenderer` via `MerlinTip` component
- Tips should be context-aware per use case

### Example Merlin Tips by Use Case:

**Truck Stop:**
- MCS Chargers: "MCS chargers pull extreme power spikes - BESS sizing critical for demand charge management"
- Service Bays: "Maintenance bays have high inrush current - size BESS to handle motor starts"
- Climate Zone: "Hot zones require additional cooling for battery systems (30 kW parasitic load)"

**Car Wash:**
- Facility Type: "Express tunnels have higher throughput and energy demands"
- Water Reclaim: "Full reclaim systems reduce water heating load by 40%"
- EV Chargers: "Adding EV chargers creates new peak demand - BESS can smooth spikes"

## 🔍 Verification Checklist

For each use case, verify:

- [ ] Questions load from database (not hardcoded)
- [ ] Field names match calculation logic (e.g., `mcsChargers` → `calculateTruckStopLoad()`)
- [ ] Question types render correctly:
  - [ ] `select` → `buttons` (card layout with icons/descriptions)
  - [ ] `number` (with min/max) → `slider` (large value display)
  - [ ] `number` (without min/max) → `number_buttons` (+/- inputs)
  - [ ] `boolean` → `toggle` (Yes/No buttons)
- [ ] Options parse correctly (JSONB → array)
- [ ] Sections group correctly (facility/operations/energy/solar)
- [ ] Default values pre-fill correctly
- [ ] Help text displays below questions
- [ ] Smart defaults applied (if applicable)
- [ ] Conditional questions show/hide (if applicable)
- [ ] Merlin guidance is context-aware per use case

## 🐛 Known Issues & Solutions

### Issue 1: Schema Mismatch ✅ RESOLVED
- **Problem**: TypeScript types say `question_key`/`select_options`, but migrations use `field_name`/`options`
- **Solution**: Transformation handles both formats

### Issue 2: Section Mapping ⚠️ PARTIALLY RESOLVED
- **Problem**: Truck stop migration doesn't include `section_name`
- **Solution**: Intelligent inference from field names
- **Better Solution**: Add `section_name` to truck stop questions in database

### Issue 3: Question Type Inference ✅ RESOLVED
- **Problem**: Database `number` type needs to map to `slider` or `number_buttons`
- **Solution**: Checks for `min_value`/`max_value` to determine type

### Issue 4: Options Parsing ✅ RESOLVED
- **Problem**: JSONB options may be string or array
- **Solution**: Automatic parsing and format normalization

## 🚀 Next Steps

1. **Add `section_name` to truck stop questions** in database
   ```sql
   UPDATE custom_questions 
   SET section_name = 'Energy Systems'
   WHERE field_name IN ('mcsChargers', 'dcfc350', 'level2', 'serviceBays', 'truckWashBays')
   AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
   ```

2. **Add `merlin_tip` column** to `custom_questions` table
   ```sql
   ALTER TABLE custom_questions 
   ADD COLUMN IF NOT EXISTS merlin_tip TEXT;
   ```

3. **Populate Merlin tips** per use case
   ```sql
   UPDATE custom_questions 
   SET merlin_tip = 'MCS chargers pull extreme power spikes - BESS sizing critical for demand charge management'
   WHERE field_name = 'mcsChargers' 
   AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
   ```

4. **Test all use cases** to verify questions load correctly

5. **Verify field name mapping** to calculation functions (e.g., `mcsChargers` → `calculateTruckStopLoad()`)

## ✅ Success Criteria

The mapping system is working correctly when:

1. ✅ Each use case shows its own specific questions
2. ✅ Questions are grouped into logical sections
3. ✅ Question types render correctly (buttons, sliders, toggles)
4. ✅ Options display with icons and descriptions (if provided)
5. ✅ Default values pre-fill correctly
6. ✅ Help text displays below questions
7. ✅ Merlin guidance is context-aware (step + industry)
8. ✅ Field names match calculation function parameters
9. ✅ Data flows correctly from UI → calculations → results

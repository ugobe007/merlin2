# Quick Test Reference

## What You Should See

### ✅ WORKING (Template Loaded)
**Console:**
```
[UseCaseQuestionService] Looking for template: "hotel" → normalized: "hotel"
[UseCaseQuestionService] Found template: Hotel with 13 questions
[UseCaseQuestionService] Questions: ['numberOfRooms', 'hotelCategory', ...]
```

**UI:**
- Specific questions for that use case
- Custom field names
- Relevant help text

### ❌ BROKEN (Fallback Questions)
**Console:**
```
[UseCaseQuestionService] Template not found: xyz, using fallback questions
```

**UI:**
- "Facility size?" (dropdown with micro/small/medium/large)
- "Estimated peak load?" (MW input)
- "Operating hours per day?" (hours input)

---

## Fixed Mappings

| Step1 ID | Template Slug | Status |
|----------|---------------|--------|
| car-wash | car-wash | ✅ Direct |
| ev-charging | ev-charging | ✅ Direct |
| hotel | hotel | ✅ Direct |
| indoor-farm | indoor-farm | ✅ Direct |
| apartment | apartments | ✅ Mapped |
| datacenter | data-center | ✅ Mapped |
| **office** | **office-building** | ✅ **FIXED** |
| **retail** | **shopping-center** | ✅ **FIXED** |
| **agriculture** | **indoor-farm** | ✅ **FIXED** |
| **college** | **college-university** | ✅ **FIXED** |

---

## Test Order (Recommended)

1. **Car Wash** - Simple (3 questions)
2. **Office** - Just fixed, verify no fallback
3. **Retail** - Just fixed, verify no fallback
4. **Indoor Farm** - Test field name fix (cultivationArea)
5. **Hotel** - Complex (13 questions + amenity calculations)
6. **Apartments** - Complex (14 questions)
7. **College** - Just fixed mapping
8. Rest as time permits

---

## Testing Each Use Case

```bash
# For each use case:
1. Clear console (Cmd+K)
2. Refresh page (Cmd+R)
3. Start Smart Wizard
4. Select use case
5. Check console output
6. Check UI questions
7. Fill out test data
8. Check calculation
9. Update COMPLETE_USE_CASE_TEST.md
```

---

## Quick Console Check

If you see **ANY** of these in console = **FAILURE**:
- `Template not found`
- `using fallback questions`

If you see **ALL** of these = **SUCCESS**:
- `Looking for template`
- `Found template: X with N questions`
- `Questions: [...]`

---

## Report Format

For each test, report:
- ✅ or ❌
- Question count (e.g., "Found 13 questions")
- Calculation result (e.g., "1.57 MW")
- Any issues

Example:
```
Hotel: ✅ 13 questions loaded, 400 rooms → 1.57 MW calculated correctly
Car Wash: ❌ Showing fallback questions instead of template
```

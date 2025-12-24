# Hotel Questions Prioritization

## Overview
This document explains how hotel questions are prioritized into **Main Form** (max 18 questions) and **Advanced Questions** (shown in optional popup modal).

## Question Categories

### Main Form Questions (Essential - Max 18)
These questions are shown in the main Step 3 form and are required for accurate BESS sizing:

1. **roomCount** - Number of guest rooms (essential for power calculation)
2. **hotelCategory** - Hotel category/star rating (1-5 star, boutique, non-classified) - affects energy intensity
3. **squareFeet** - Total building square footage (optional but useful for HVAC sizing)
4. **avgOccupancy** - Average annual occupancy rate (affects demand profile)
5. **amenities** - Major amenities (pool, spa, fitness, etc.) - affects power load
6. **foodBeverage** - **PRIME QUESTION** - Food & beverage facilities (dining, restaurants, kitchens) - Commercial kitchens add significant load
7. **laundryOperations** - **PRIME QUESTION** - Laundry operations (commercial in-house, guest laundry, valet, none)
8. **guestServices** - **PRIME QUESTION** - Guest services and concierge (concierge, guest services desk, valet parking, bell service, business center)
9. **meetingSpace** - **PRIME QUESTION** - Meeting and event space (size, AV level)
10. **parking** - **PRIME QUESTION** - Parking facilities (surface lot, garage, spaces) - affects solar canopy potential
11. **existingSolar** - Existing solar installation status and size
12. **solarInterest** - Interest in adding solar
13. **existingEV** - Existing EV charging stations
14. **evInterest** - Interest in adding EV charging
15. **backupRequirements** - Backup power requirements and duration
16. **energyGoals** - Primary energy goals (cost reduction, sustainability, etc.)

**Total: 16 essential questions** (under the 18 question limit)

### Advanced Questions (Optional - Popup Modal)
These detailed questions are shown in an optional "Advanced Questions" modal that users can access if they want to provide more detailed information:

*Currently no advanced questions - all essential questions are in the main form*

**Note:** Meeting space and parking are considered prime/essential questions as they significantly impact power load and solar potential.

## Implementation

### Database Schema
Questions are marked as advanced using the `metadata` JSONB column:
```sql
UPDATE custom_questions
SET metadata = metadata || '{"is_advanced": true}'::jsonb
WHERE field_name IN ('meetingSpace', 'parking');
```

### Frontend Filtering
- `Step3FacilityDetails.tsx` filters out questions with `metadata.is_advanced = true`
- Advanced questions are shown in `AdvancedQuestionsModal` component
- Users can complete the form without answering advanced questions

### UI Elements
- **Advanced Questions Button**: Appears above the main questions when advanced questions exist
- Shows count of available advanced questions
- Opens modal when clicked
- Modal has its own progress tracking

## Benefits

1. **Reduced Form Fatigue**: Main form stays focused on essential questions
2. **Better UX**: Users can skip detailed questions and still get a quote
3. **Flexibility**: Advanced users can provide more detail for more accurate quotes
4. **Scalability**: Easy to add more advanced questions without bloating the main form

## Migration

Run the SQL migration to mark questions as advanced:
```bash
psql -f database/migrations/20250103_prioritize_hotel_questions.sql
```

Or in Supabase SQL Editor:
1. Run `20250103_prioritize_hotel_questions.sql`
2. Verify questions are marked correctly:
```sql
SELECT field_name, metadata->>'is_advanced' as is_advanced
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
ORDER BY display_order;
```


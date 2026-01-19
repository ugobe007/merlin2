# Questionnaire Audit Complete - January 19, 2026

## Summary

**All 23 industries now have unique display_order values for their questions.**

### Migration Details

| Metric                                | Value                                                     |
| ------------------------------------- | --------------------------------------------------------- |
| Industries Fixed                      | 18                                                        |
| Industries Already OK                 | 5 (car-wash, data-center, ev-charging, hotel, restaurant) |
| Total Questions Updated               | 527                                                       |
| Total Questions Across All Industries | ~660                                                      |

### Industries & Question Counts

| Industry              | Questions | Status |
| --------------------- | --------- | ------ |
| agricultural          | 31        | ✅ OK  |
| airport               | 30        | ✅ OK  |
| apartment             | 29        | ✅ OK  |
| car-wash              | 32        | ✅ OK  |
| casino                | 29        | ✅ OK  |
| cold-storage          | 32        | ✅ OK  |
| college               | 32        | ✅ OK  |
| data-center           | 32        | ✅ OK  |
| ev-charging           | 32        | ✅ OK  |
| gas-station           | 29        | ✅ OK  |
| government            | 30        | ✅ OK  |
| heavy_duty_truck_stop | 22        | ✅ OK  |
| hospital              | 30        | ✅ OK  |
| hotel                 | 34        | ✅ OK  |
| indoor-farm           | 29        | ✅ OK  |
| manufacturing         | 30        | ✅ OK  |
| microgrid             | 32        | ✅ OK  |
| office                | 29        | ✅ OK  |
| residential           | 24        | ✅ OK  |
| restaurant            | 13        | ✅ OK  |
| retail                | 28        | ✅ OK  |
| shopping-center       | 31        | ✅ OK  |
| warehouse             | 30        | ✅ OK  |

## Data Flow Verification

Verified that all industry field names in the database match what `loadCalculator.ts` expects:

| Industry        | Calculation Method | Key Field(s) Found                                      |
| --------------- | ------------------ | ------------------------------------------------------- |
| hotel           | per_unit           | roomCount                                               |
| hospital        | per_unit           | bedCount                                                |
| apartment       | per_unit           | totalUnits                                              |
| gas-station     | per_unit           | dispenserCount, fuelPositions                           |
| manufacturing   | per_sqft           | manufacturingSqFt                                       |
| warehouse       | per_sqft           | warehouseSqFt                                           |
| office          | per_sqft           | officeSqFt, totalSqFt                                   |
| retail          | per_sqft           | retailSqFt, storeSqFt                                   |
| shopping-center | per_sqft           | mallSqFt, glaSqFt, squareFeet                           |
| government      | per_sqft           | governmentSqFt, totalSqFt, squareFeet                   |
| airport         | per_sqft           | terminalSqFt, squareFeet                                |
| casino          | per_sqft           | gamingFloorSqFt, totalSqFt, squareFeet                  |
| indoor-farm     | per_sqft           | growingAreaSqFt                                         |
| college         | per_sqft           | totalSqFt, squareFeet                                   |
| cold-storage    | per_sqft           | refrigeratedSqFt, squareFeet, squareFootage             |
| agricultural    | per_sqft           | squareFeet, totalAcres, farmAcres                       |
| residential     | per_sqft           | squareFeet                                              |
| restaurant      | per_sqft           | squareFootage                                           |
| car-wash        | custom             | bayCount, vacuumStations, waterHeaterType, waterReclaim |
| data-center     | custom             | itLoadKW, rackCount                                     |
| ev-charging     | custom             | level2Count, dcFastCount, ultraFastCount                |
| microgrid       | custom             | sitePeakLoad, connectedBuildings                        |

## Scripts Created

| Script                                    | Purpose                                           |
| ----------------------------------------- | ------------------------------------------------- |
| `scripts/verify_display_orders.mjs`       | Audit all industries for duplicate display_orders |
| `scripts/fix_display_orders_service.mjs`  | Fix duplicates using service role key             |
| `scripts/generate_fix_sql.mjs`            | Generate SQL for manual Supabase execution        |
| `scripts/debug_duplicates.mjs`            | Debug specific industry duplicates                |
| `src/tests/wizardDataFlowVerification.ts` | Verify field_name → loadCalculator mapping        |

## Next Steps

1. ✅ Questionnaire display_order duplicates - **FIXED**
2. ✅ Data flow verification - **VERIFIED**
3. ⏳ Test wizard flow locally
4. ⏳ Commit and deploy

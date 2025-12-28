# Pricing Tier Implementation Plan

**Date**: December 25, 2025  
**Status**: Implementation Ready  
**Approach**: Phased, Quick Implementation

## Executive Summary

Enhancing existing `pricing_configurations` table with size-based pricing tiers supporting:
- **5 pricing levels**: low, low+, mid, mid+, high
- **Dual unit support**: kW for most systems, MWh for very large systems (e.g., 300 MW data centers)
- **Size-based tiers**: Different pricing based on system size
- **Seed data**: Matches current Q4 2024 - Q1 2025 pricing values exactly

---

## Database Schema Enhancements

### New Columns Added to `pricing_configurations`

```sql
size_min_kw DECIMAL      -- Minimum system size in kW
size_max_kw DECIMAL      -- Maximum system size in kW (NULL = no upper limit)
size_min_mwh DECIMAL     -- Minimum system size in MWh (for very large systems)
size_max_mwh DECIMAL     -- Maximum system size in MWh (NULL = no upper limit)
```

### Enhanced JSONB Structure

The `config_data` JSONB field now includes:

```json
{
  "price_low": 101,
  "price_low_plus": 107,
  "price_mid": 110,
  "price_mid_plus": 117.5,
  "price_high": 125,
  "price_unit": "$/kWh",
  "equipment_pct": 0.60,
  "bos_pct": 0.12,
  "labor_pct": 0.15,
  "soft_costs_pct": 0.13,
  "annual_om_pct": 2.5,
  "source_type": "market_intel",
  "source_name": "Q4 2024 - Q1 2025 Market Reality",
  "source_date": "2024-10-01",
  "notes": "..."
}
```

### Helper Function

`get_pricing_tier(category, size_kw, size_mwh)` - Returns appropriate pricing tier for a system size.

---

## Seed Data (Matching Current Q4 2024 Pricing)

### BESS Pricing Tiers

| Tier | Size Range | Price Mid | Market Range | Notes |
|------|------------|-----------|--------------|-------|
| Utility 3-10 MW | 3,000-10,000 kW | $110/kWh | $101-125/kWh | LFP container systems |
| Utility 10-50 MW | 10,000-50,000 kW | $110/kWh | $95-115/kWh | Volume discounts |
| Utility 50+ MW | 50,000+ kW | $95/kWh | $85-105/kWh | Large project pricing |
| Commercial 100-500 kWh | 100-500 kWh | $325/kWh | $250-400/kWh | Small commercial |
| Commercial 500-3000 kWh | 500-3000 kWh | $250/kWh | $200-300/kWh | Mid commercial |
| Residential 5-20 kWh | 5-20 kWh | $650/kWh | $500-800/kWh | Home battery systems |

### Solar PV Pricing Tiers

| Tier | Size Range | Price Mid | Market Range | Notes |
|------|------------|-----------|--------------|-------|
| Utility ≥5 MW | 5,000+ kW | $0.65/W | $0.60-0.85/W | Validated: Hampton Heights |
| Commercial 50 kW - 5 MW | 50-5,000 kW | $1.05/W | $1.00-1.50/W | Validated: Tribal Microgrid |
| Residential 5-50 kW | 5-50 kW | $3.00/W | $2.50-3.50/W | NREL ATB 2024 |

---

## Implementation Phases

### Phase 1: Database Migration (IMMEDIATE)

**File**: `database/migrations/20251225_enhance_pricing_configurations_size_tiers.sql`

**Tasks**:
1. ✅ Add new columns to `pricing_configurations`
2. ✅ Create indexes for fast lookups
3. ✅ Create `get_pricing_tier()` helper function
4. ✅ Populate seed data with current pricing values
5. ✅ Add documentation comments

**Status**: Ready to execute

---

### Phase 2: Service Layer Updates (QUICK - Same Day)

**Files to Update**:

1. **`src/services/pricingConfigService.ts`**
   - Add `getPricingTier(sizeKW, sizeMWh, category, priceLevel)` function
   - Price level options: 'low', 'low_plus', 'mid', 'mid_plus', 'high'
   - Default to 'mid' if not specified
   - Maintain backward compatibility with existing `getPricingConfig()`

2. **`src/services/pricingModel.ts`**
   - Update `BESS_PRICING` to query database first
   - Fallback to hardcoded values if query fails
   - Use size-based pricing tiers

3. **`packages/core/src/calculations/equipmentCalculations.ts`**
   - Update battery pricing to use `getPricingTier()`
   - Convert system size to appropriate unit (kW or MWh)
   - Use price level based on quote settings (default: 'mid')

**Implementation Pattern**:

```typescript
// Example: Get BESS pricing for a 5 MW system
const pricing = await getPricingTier(
  sizeKW: 5000,
  sizeMWh: null,
  category: 'bess',
  priceLevel: 'mid' // or 'low', 'low_plus', 'mid', 'mid_plus', 'high'
);

// Returns:
// {
//   price_mid: 110,
//   price_unit: '$/kWh',
//   size_min_kw: 3000,
//   size_max_kw: 10000,
//   source_type: 'market_intel',
//   confidence_level: 'high',
//   ...
// }
```

---

### Phase 3: Testing & Validation (QUICK - Same Day)

**Test Scenarios**:

1. **Size Range Matching**
   - Test systems at tier boundaries (exactly 3 MW, 10 MW, 50 MW)
   - Test systems below minimum (should use smallest tier)
   - Test systems above maximum (should use largest tier)

2. **Unit Conversion**
   - Test kW-based systems (< 50 MW)
   - Test MWh-based systems (very large, e.g., 300 MW = 300 MWh at 1 hour)

3. **Price Level Selection**
   - Test all 5 price levels (low, low+, mid, mid+, high)
   - Verify default is 'mid'
   - Test quote generation with different price levels

4. **Backward Compatibility**
   - Verify existing quotes still work
   - Verify fallback to hardcoded values works
   - Verify existing `getPricingConfig()` still works

5. **TrueQuote Compliance**
   - Verify source tracking in quotes
   - Verify confidence levels displayed
   - Verify price level documented in quote metadata

---

### Phase 4: Admin Dashboard Integration (QUICK - Next Day)

**Files to Update**:

1. **Pricing Admin Dashboard** (if exists)
   - Add UI to view pricing tiers
   - Add UI to update pricing tiers
   - Add UI to set price levels (low, low+, mid, mid+, high)
   - Display source tracking and confidence levels

2. **Quote Builder UI**
   - Add pricing tier selector (optional, defaults to 'mid')
   - Display selected price level in quote preview
   - Show source and confidence in quote details

---

## Cost Breakdown Percentages

**Question**: Should cost breakdown percentages override calculations or serve as metadata?

**Recommendation**: **Metadata Only** (Reference/Validation)

**Rationale**:
- Existing calculation logic in `equipmentCalculations.ts` is well-tested
- Percentages serve as validation/comparison reference
- Can be used for "pricing breakdown" display in quotes
- Don't override existing calculation formulas

**Usage**:
- Display in quote breakdown: "Equipment: 60%, BOS: 12%, Labor: 15%, Soft Costs: 13%"
- Validate calculations: Alert if calculated percentages deviate significantly
- Reference for future calculation improvements

---

## Query Logic for Size Ranges

**Fixed Query Pattern**:

```typescript
async function getPricingTier(
  category: string,
  sizeKW?: number,
  sizeMWh?: number
): Promise<PricingTier | null> {
  const { data, error } = await supabase
    .from('pricing_configurations')
    .select('*')
    .eq('config_category', category)
    .eq('is_active', true)
    .or(
      sizeKW !== undefined
        ? `size_min_kw.is.null,size_min_kw.lte.${sizeKW},size_max_kw.is.null,size_max_kw.gte.${sizeKW}`
        : `size_min_mwh.is.null,size_min_mwh.lte.${sizeMWh},size_max_mwh.is.null,size_max_mwh.gte.${sizeMWh}`
    )
    .order(sizeKW !== undefined ? 'size_min_kw' : 'size_min_mwh', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.warn(`No pricing tier found for ${sizeKW || sizeMWh} ${category}`);
    return null; // Fallback to hardcoded pricing
  }

  return data;
}
```

**Better Approach: Use Helper Function**:

```typescript
// Use the database function we created
const { data, error } = await supabase.rpc('get_pricing_tier', {
  p_category: category,
  p_size_kw: sizeKW || null,
  p_size_mwh: sizeMWh || null
});
```

---

## Migration Checklist

- [ ] **Phase 1**: Execute database migration SQL
- [ ] **Phase 2a**: Update `pricingConfigService.ts` with `getPricingTier()`
- [ ] **Phase 2b**: Update `pricingModel.ts` to use size-based tiers
- [ ] **Phase 2c**: Update `equipmentCalculations.ts` to query database
- [ ] **Phase 3a**: Run size range matching tests
- [ ] **Phase 3b**: Run unit conversion tests
- [ ] **Phase 3c**: Run price level selection tests
- [ ] **Phase 3d**: Run backward compatibility tests
- [ ] **Phase 3e**: Run TrueQuote compliance tests
- [ ] **Phase 4a**: Update admin dashboard (if exists)
- [ ] **Phase 4b**: Update quote builder UI
- [ ] **Documentation**: Update API documentation
- [ ] **Deploy**: Deploy to production

---

## Risk Mitigation

### Risk 1: Breaking Existing Quotes

**Mitigation**:
- Maintain backward compatibility with existing `getPricingConfig()`
- Fallback to hardcoded values if database query fails
- Extensive testing before removing fallbacks

### Risk 2: Performance Impact

**Mitigation**:
- Use indexes for fast lookups
- Cache pricing tiers in memory (5-minute TTL)
- Use database function for efficient queries

### Risk 3: Seed Data Accuracy

**Mitigation**:
- Seed data matches current pricing exactly
- Review all values before migration
- Test quote generation with seed data

---

## Next Steps

1. **Review migration SQL** - Verify seed data matches current pricing
2. **Execute Phase 1** - Run database migration
3. **Implement Phase 2** - Update service layer
4. **Test Phase 3** - Comprehensive testing
5. **Deploy Phase 4** - Admin dashboard and UI updates

**Timeline**: All phases can be completed within 1-2 days if focused.

---

## Questions & Answers

**Q: What about the cost breakdown percentages?**  
A: Metadata only - for reference/validation, not to override calculations.

**Q: How do we choose between kW and MWh?**  
A: Use kW for systems < 50 MW. Use MWh for very large systems (e.g., 300 MW data centers where 300 MWh makes more sense).

**Q: What's the default price level?**  
A: 'mid' - most common/realistic pricing.

**Q: Can we still use hardcoded fallbacks?**  
A: Yes, during migration phase. Eventually remove once database is proven stable.




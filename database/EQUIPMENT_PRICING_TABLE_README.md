# Equipment Pricing Table Setup

## Purpose

Creates the `equipment_pricing` table to track vendor-specific equipment pricing for market intelligence and accurate quoting. This eliminates 404 errors from the pricing service trying to query this table.

## Table Schema

### Equipment Types Supported
- `battery` - Battery energy storage systems ($/kWh)
- `inverter` - Power inverters ($/kW)
- `solar` - Solar panels ($/W)
- `wind` - Wind turbines ($/kW)
- `generator` - Backup generators ($/kW)
- `transformer` - Power transformers ($/MVA)

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `equipment_type` | TEXT | Type of equipment (see above) |
| `manufacturer` | TEXT | Equipment manufacturer (e.g., Tesla, CATL) |
| `model` | TEXT | Specific model name |
| `price_per_kwh` | NUMERIC | Battery pricing ($/kWh) |
| `price_per_kw` | NUMERIC | Inverter/generator/wind pricing ($/kW) |
| `price_per_watt` | NUMERIC | Solar pricing ($/W) |
| `price_per_mva` | NUMERIC | Transformer pricing ($/MVA) |
| `region` | TEXT | Geographic region pricing applies to |
| `is_active` | BOOLEAN | Whether pricing is current |
| `confidence_level` | TEXT | high/medium/low (based on source) |
| `source` | TEXT | Where pricing data came from |

### Security (RLS Policies)

- **Public**: Can read active pricing
- **Authenticated**: Can read all pricing (including inactive)
- **Admin**: Full CRUD access

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/_/sql/new
2. Copy contents of `database/migrations/20251213_create_equipment_pricing_table.sql`
3. Paste into SQL Editor
4. Click "Run"

### Option 2: Supabase CLI

```bash
cd /Users/robertchristopher/merlin2
supabase db push
```

### Option 3: Manual via psql

```bash
psql $DATABASE_URL -f database/migrations/20251213_create_equipment_pricing_table.sql
```

## Verification

After applying migration, verify:

```bash
node run_equipment_pricing_migration.mjs
```

Expected output:
```
⚠️  Table equipment_pricing already exists
   Current rows: 12
✅ Migration already applied (skipping)
```

## Sample Data Included

Migration seeds table with vendor pricing from Q4 2025:

### Batteries
- CATL LFP: $115/kWh
- BYD Blade: $120/kWh
- Tesla Megapack: $125/kWh

### Inverters
- SMA Sunny Central: $75/kW
- ABB PVS980: $82/kW

### Generators
- Caterpillar C175-20: $700/kW
- Cummins QSK60-G14: $680/kW

### Solar
- LONGi Hi-MO 6: $0.65/W
- Trina Vertex N: $0.67/W
- First Solar Series 7: $0.70/W

### Transformers
- ABB Power Transformer: $48,000/MVA
- Siemens GEAFOL: $52,000/MVA

## Code Integration

The pricing service (`src/services/unifiedPricingService.ts`) already queries this table:

```typescript
// PRIORITY 2: Try equipment_pricing table (vendor-specific)
const { data, error } = await supabase
  .from('equipment_pricing')
  .select('*')
  .eq('equipment_type', 'battery')
  .eq('is_active', true)
  .order('updated_at', { ascending: false })
  .limit(1)
  .single();
```

**Fallback Hierarchy**:
1. `calculation_constants` table (user overrides)
2. `equipment_pricing` table (vendor data) ← **NEW**
3. NREL ATB 2024 defaults (if no vendor data)

## Benefits

✅ **Eliminates 404 errors** - Table now exists
✅ **Market intelligence** - Track vendor pricing trends
✅ **Accurate quotes** - Use real vendor prices
✅ **Multi-region support** - Region-specific pricing
✅ **Confidence tracking** - Know data quality
✅ **Admin controls** - Secure pricing management

## Future Enhancements

- **Automated scraping**: Pull pricing from vendor websites
- **Price alerts**: Notify when pricing changes
- **Historical tracking**: Track pricing over time
- **Quote integration**: Auto-populate from RFQs
- **Vendor API**: Direct integration with vendor price APIs

## Related Files

- **Migration**: `database/migrations/20251213_create_equipment_pricing_table.sql`
- **Script**: `run_equipment_pricing_migration.mjs`
- **Service**: `src/services/unifiedPricingService.ts`
- **Docs**: This file

## Status

- **Created**: December 13, 2025
- **Status**: ✅ Ready to apply
- **Impact**: Eliminates 404 errors, enables vendor pricing tracking
- **Breaking Changes**: None (table didn't exist before)

---

**Next Steps**: Apply migration via Supabase Dashboard → SQL Editor

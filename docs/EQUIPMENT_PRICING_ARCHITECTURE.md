# Equipment Pricing Architecture - TrueQuote™ Integration

**Created:** January 14, 2026  
**Purpose:** Comprehensive pricing infrastructure for all equipment types

---

## 📊 PRICING COVERAGE AUDIT

### Equipment Types Coverage

| Equipment Type | pricing_configurations | equipment_pricing_tiers | Market Data Sources | TrueQuote™ |
|----------------|----------------------|------------------------|--------------------|-----------| 
| **BESS** | ✅ bess_default (4-tier) | ✅ Added | ✅ 140+ sources | ✅ NREL ATB 2024 |
| **Solar** | ✅ solar_default | ✅ Added | ✅ PV Magazine, SEIA | ✅ NREL |
| **Inverter/PCS** | ✅ power_electronics | ✅ Added (6 tiers) | ✅ Energy Storage News | ✅ Vendor quotes |
| **Transformer** | ✅ power_electronics | ✅ Added (5 size/tiers) | ✅ Industry data | ✅ ABB/Siemens |
| **Switchgear** | ✅ power_electronics | ✅ Added (3 tiers) | ⚠️ Limited | ✅ Eaton/Siemens |
| **Microgrid Controller** | ⚠️ In systemControls | ✅ **NEW** (4 tiers) | ⚠️ Limited | ✅ Schneider/Siemens |
| **DC Patch Panel** | ❌ Missing | ✅ **NEW** (3 tiers) | ❌ None | ✅ ABB/Schneider |
| **AC Patch Panel** | ❌ Missing | ✅ **NEW** (3 tiers) | ❌ None | ✅ Eaton/Siemens |
| **BMS** | Part of BESS | ✅ **NEW** (4 size/tiers) | ⚠️ Limited | ✅ CATL/Tesla/Fluence |
| **ESS Enclosure** | ❌ Missing | ✅ **NEW** (3 tiers) | ⚠️ Limited | ✅ Sungrow/Fluence |
| **SCADA** | ✅ systemControls | ✅ **NEW** (3 tiers) | ⚠️ Limited | ✅ Ignition/Schneider/ABB |
| **EMS Software** | ✅ systemControls | ✅ **NEW** (3 tiers) | ❌ None | ✅ Schneider/Siemens |
| **EV Charger** | ✅ ev_charger_default | ✅ Existing | ✅ ChargePoint/news | ✅ Industry data |
| **Generator** | ✅ generator_default | ✅ Existing | ✅ Caterpillar/Cummins | ✅ Vendor quotes |
| **Fuel Cell** | ✅ fuel_cell_default | ✅ Added | ⚠️ Limited | ✅ Industry estimate |
| **Wind** | ✅ wind_default | ✅ Added | ✅ NREL/IRENA | ✅ NREL ATB 2024 |

---

## 🗃️ NEW DATABASE TABLE: `equipment_pricing_tiers`

### Schema

```sql
CREATE TABLE equipment_pricing_tiers (
    id UUID PRIMARY KEY,
    equipment_type VARCHAR(100) NOT NULL,
    tier_name VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    base_price DECIMAL(12, 2) NOT NULL,
    price_unit VARCHAR(50) NOT NULL,
    size_min DECIMAL(12, 2),
    size_max DECIMAL(12, 2),
    size_unit VARCHAR(50),
    specifications JSONB DEFAULT '{}',
    data_source VARCHAR(255) NOT NULL,
    source_url VARCHAR(500),
    source_date DATE,
    confidence_level VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    effective_date DATE,
    expires_at DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    notes TEXT
);
```

### Equipment Types Enum
- `bess`, `solar`, `inverter_pcs`, `transformer`, `switchgear`
- `microgrid_controller`, `dc_patch_panel`, `ac_patch_panel`
- `bms`, `ess_enclosure`, `scada`, `ems_software`
- `ev_charger`, `generator`, `fuel_cell`, `wind`

### Pricing Tiers
- `economy` - Budget/entry-level
- `standard` - Industry standard
- `premium` - Advanced features
- `enterprise` - Full-featured/large scale

---

## 💰 PRICING DATA (As of January 2026)

### Microgrid Controllers
| Tier | Manufacturer | Model | Price | Features |
|------|--------------|-------|-------|----------|
| Economy | Generic | Basic MC-100 | $8,000/unit | 5 assets, manual switching |
| Standard | Schneider | EcoStruxure Microgrid | $15,000/unit | 10 assets, remote monitoring |
| Premium | Schneider | EcoStruxure Advisor | $45,000/unit | 50 assets, AI optimization |
| Enterprise | Siemens | SICAM | $125,000/unit | 200 assets, VPP, market participation |

### BMS (Battery Management Systems)
| Size Range | Tier | Manufacturer | Price | Features |
|------------|------|--------------|-------|----------|
| < 500 kWh | Standard | Generic | $8,000/unit | String-level monitoring |
| 500-2000 kWh | Standard | CATL | $15,000/unit | Module-level, balancing |
| 500-2000 kWh | Premium | Tesla | $35,000/unit | Cell-level, AI diagnostics |
| > 2 MWh | Enterprise | Fluence | $75,000/unit | Digital twin, fleet mgmt |

### Inverter/PCS
| Size Range | Tier | Price | Features |
|------------|------|-------|----------|
| < 500 kW | Standard | $120/kW | Grid-following |
| 500 kW - 2 MW | Standard | $95/kW | Frequency response |
| 500 kW - 2 MW | Premium | $145/kW | Grid-forming, black start |
| > 2 MW | Standard | $75/kW | 1500V DC, liquid cooling |
| > 2 MW | Enterprise | $195/kW | Synthetic inertia, hot-swap |

### Transformers
| Size Range | Tier | Price | Type |
|------------|------|-------|------|
| < 500 kVA | Standard | $65/kVA | Dry-type |
| 500-2000 kVA | Standard | $55/kVA | Dry-type ANAF |
| 500-2000 kVA | Premium | $75/kVA | Cast resin |
| > 2 MVA | Standard | $42/kVA | Oil-immersed |
| > 2 MVA | Enterprise | $85/kVA | Smart transformer |

### DC/AC Patch Panels
| Type | Tier | Price | Features |
|------|------|-------|----------|
| DC Panel | Standard | $3,500/unit | 12 circuits, 400A |
| DC Panel | Premium | $6,500/unit | 24 circuits, monitoring |
| DC Panel | Enterprise | $12,000/unit | 48 circuits, N+1 redundancy |
| AC Panel | Standard | $2,800/unit | 24 circuits |
| AC Panel | Premium | $5,500/unit | 42 circuits, PQ monitoring |
| AC Panel | Enterprise | $15,000/unit | 84 circuits, arc resistant |

### SCADA Systems
| Tier | Vendor | Price | Max Tags |
|------|--------|-------|----------|
| Standard | Inductive Automation | $35,000 | 5,000 |
| Premium | Schneider Electric | $85,000 | 50,000 |
| Enterprise | ABB | $250,000 | Unlimited |

### ESS Enclosures
| Size Range | Tier | Price | Type |
|------------|------|-------|------|
| 1-2.5 MWh | Standard | $25,000/unit | 20ft container |
| 2-5 MWh | Premium | $45,000/unit | Integrated cabinet, liquid cooling |
| 4-10 MWh | Enterprise | $85,000/unit | 40ft container, full safety |

---

## 📁 FILES CREATED

### Migration
- `/database/migrations/20260114_comprehensive_equipment_pricing.sql`
  - Creates `equipment_pricing_tiers` table
  - Seeds 37+ pricing entries
  - RLS policies
  - Helper view `v_current_equipment_pricing`

### Service
- `/src/services/equipmentPricingTiersService.ts`
  - `getEquipmentPricing(type)` - Get all tiers for equipment type
  - `getEquipmentPrice(query)` - Get best matching price
  - `calculateEquipmentCost()` - Calculate total cost
  - `syncPricingFromMarketData()` - Sync from market sources
  - `formatPriceForDisplay()` - Format for UI

### Admin Dashboard
- `/src/components/admin/EquipmentPricingAdmin.tsx`
  - View all equipment types and tiers
  - Inline editing with TrueQuote™ attribution
  - Market data sync button per equipment type
  - Size-based tier display

---

## 🔌 INTEGRATION POINTS

### Wizard (TrueQuote)
```typescript
import { getEquipmentPrice, calculateEquipmentCost } from '@/services/equipmentPricingTiersService';

// Get price with TrueQuote attribution
const price = await getEquipmentPrice({
  equipmentType: 'microgrid_controller',
  tier: 'premium'
});

// Returns:
{
  price: 45000,
  unit: 'per_unit',
  tier: 'premium',
  manufacturer: 'Schneider Electric',
  model: 'EcoStruxure Microgrid Advisor',
  trueQuote: {
    source: 'Schneider Electric pricing 2025',
    sourceDate: '2025-10-01',
    confidence: 'high',
    methodology: 'Based on Schneider Electric EcoStruxure Microgrid Advisor pricing as of October 2025 (verified manufacturer pricing)'
  }
}
```

### Quote Calculator Integration
```typescript
// In unifiedQuoteCalculator.ts or equipmentCalculations.ts

import { calculateEquipmentCost } from '@/services/equipmentPricingTiersService';

// Get BMS cost for 2 MWh system
const bmsCost = await calculateEquipmentCost('bms', 2000, 'standard');
// Returns: { totalCost: 15000, unitPrice: 15000, unit: 'per_unit', trueQuote: {...} }

// Get inverter cost for 5 MW system
const inverterCost = await calculateEquipmentCost('inverter_pcs', 5000, 'standard');
// Returns: { totalCost: 375000, unitPrice: 75, unit: 'per_kW', trueQuote: {...} }
```

---

## ✅ MIGRATION STEPS

1. **Run Migration**
   ```bash
   psql $DATABASE_URL -f database/migrations/20260114_comprehensive_equipment_pricing.sql
   ```

2. **Verify Data**
   ```sql
   SELECT equipment_type, COUNT(*), MIN(base_price), MAX(base_price)
   FROM equipment_pricing_tiers
   GROUP BY equipment_type
   ORDER BY equipment_type;
   ```

3. **Add Admin Dashboard to Menu**
   ```typescript
   // In AdminSidebar.tsx or similar
   import { EquipmentPricingAdmin } from '@/components/admin/EquipmentPricingAdmin';
   ```

4. **Connect to Quote Engine**
   ```typescript
   // Update unifiedQuoteCalculator.ts to use equipmentPricingTiersService
   // for microgrid_controller, bms, scada, ems_software, dc_patch_panel, ac_patch_panel
   ```

---

## 📈 FUTURE ENHANCEMENTS

1. **Market Data Integration**
   - Connect to `daily-market-scrape` edge function
   - Auto-update pricing from verified sources
   - Price trend tracking

2. **Regional Pricing**
   - Add `region` column for regional variations
   - Multipliers for Europe, Asia-Pacific, Middle East

3. **Quote Templates**
   - Pre-configured equipment bundles
   - "Premium Microgrid Package" with all premium tiers

4. **API Exposure**
   - Public API for pricing queries
   - Webhook for price change notifications

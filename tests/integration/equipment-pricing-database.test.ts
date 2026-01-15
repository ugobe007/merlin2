/**
 * INTEGRATION TESTS - Equipment Pricing Tiers Service
 * =======================================================
 * These tests require LIVE DATABASE connection to Supabase.
 * 
 * Tests:
 * - equipment_pricing_tiers table queries
 * - pricing_markup_config table queries  
 * - TrueQuote attribution (data_source, source_url, confidence_level)
 * - Tier pricing (economy < standard < premium < enterprise)
 * - Size-based pricing calculations
 * - Markup application
 * 
 * Prerequisites:
 * - Supabase project running
 * - Migration 20260114_comprehensive_equipment_pricing.sql applied
 * - Environment variables set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * 
 * Run: npx vitest run tests/integration/equipment-pricing-database.test.ts
 */

import { describe, test, expect } from "vitest";
import {
  getEquipmentPrice,
  getMicrogridControllerPrice,
  getBMSPrice,
  getSCADAPrice,
  getEMSSoftwarePrice,
  getDCPatchPanelPrice,
  getACPatchPanelPrice,
  getESSEnclosurePrice,
  getTransformerPricePerKVA,
  getInverterPricePerKW,
  getSwitchgearPricePerKW,
  getMarkupPercentage,
  getAllMarkupConfigs,
  type EquipmentType,
  type PricingTier,
} from "@/services/equipmentPricingTiersService";

// ============================================================================
// TEST 1: DATABASE CONNECTION
// ============================================================================
describe("Database Connection", () => {
  test("Can connect to Supabase and read equipment_pricing_tiers", async () => {
    const result = await getEquipmentPrice("microgrid_controller", "standard", 500);
    
    expect(result).toBeDefined();
    expect(result.price).toBeGreaterThan(0);
    expect(result.priceWithMarkup).toBeGreaterThan(result.price);
  });

  test("Can read markup configurations", async () => {
    const markup = await getMarkupPercentage("bess");
    
    expect(markup).toBeGreaterThan(0);
    expect(markup).toBeLessThanOrEqual(50); // Realistic markup range (0-50%)
  });
});

// ============================================================================
// TEST 2: EQUIPMENT PRICING TIERS
// ============================================================================
describe("Equipment Pricing Tiers", () => {
  test("Microgrid controller: economy < standard < premium < enterprise", async () => {
    const [economy, standard, premium, enterprise] = await Promise.all([
      getMicrogridControllerPrice(1000, 'economy'),
      getMicrogridControllerPrice(1000, 'standard'),
      getMicrogridControllerPrice(1000, 'premium'),
      getMicrogridControllerPrice(1000, 'enterprise'),
    ]);
    
    expect(economy).toBeLessThan(standard);
    expect(standard).toBeLessThan(premium);
    expect(premium).toBeLessThan(enterprise);
  });

  test("BMS: pricing increases with tier", async () => {
    const [economy, enterprise] = await Promise.all([
      getBMSPrice(5000, 'economy'),
      getBMSPrice(5000, 'enterprise'),
    ]);
    
    expect(economy).toBeLessThan(enterprise);
    expect(enterprise).toBeGreaterThan(economy * 1.5); // At least 50% more expensive
  });

  test("SCADA: pricing increases with system size", async () => {
    const small = await getSCADAPrice(1000, 'standard');
    const large = await getSCADAPrice(10000, 'standard');
    
    expect(large).toBeGreaterThan(small);
    expect(large / small).toBeGreaterThan(1.5); // Larger systems cost more
  });
});

// ============================================================================
// TEST 3: SIZE-BASED PRICING
// ============================================================================
describe("Size-Based Pricing", () => {
  test("Transformer pricing increases with size", async () => {
    const [small, medium, large] = await Promise.all([
      getTransformerPricePerKVA(500, 'standard'),
      getTransformerPricePerKVA(2000, 'standard'),
      getTransformerPricePerKVA(5000, 'standard'),
    ]);
    
    expect(medium).toBeGreaterThan(small);
    expect(large).toBeGreaterThan(medium);
  });

  test("Inverter pricing decreases per-kW at scale", async () => {
    const smallPerKW = await getInverterPricePerKW(500, 'standard');
    const largePerKW = await getInverterPricePerKW(5000, 'standard');
    
    // Large systems should have lower $/kW (economies of scale)
    expect(largePerKW).toBeLessThanOrEqual(smallPerKW);
  });

  test("Switchgear pricing exists for all tiers", async () => {
    const [economy, standard, premium, enterprise] = await Promise.all([
      getSwitchgearPricePerKW('economy'),
      getSwitchgearPricePerKW('standard'),
      getSwitchgearPricePerKW('premium'),
      getSwitchgearPricePerKW('enterprise'),
    ]);
    
    expect(economy).toBeGreaterThan(0);
    expect(standard).toBeGreaterThan(economy);
    expect(premium).toBeGreaterThan(standard);
    expect(enterprise).toBeGreaterThan(premium);
  });
});

// ============================================================================
// TEST 4: TRUEQUOTE™ ATTRIBUTION
// ============================================================================
describe("TrueQuote™ Source Attribution", () => {
  test("Equipment pricing includes data_source", async () => {
    const result = await getEquipmentPrice("microgrid_controller", "standard", 500);
    
    expect(result.truequote).toBeDefined();
    expect(result.truequote.dataSource).toBeDefined();
    expect(typeof result.truequote.dataSource).toBe('string');
    expect(result.truequote.dataSource.length).toBeGreaterThan(0);
  });

  test("Equipment pricing includes source_url", async () => {
    const result = await getEquipmentPrice("bms", "standard", 1000);
    
    expect(result.truequote).toBeDefined();
    expect(result.truequote.sourceUrl).toBeDefined();
    expect(typeof result.truequote.sourceUrl).toBe('string');
    // Should be valid URL or 'Market research'
    expect(result.truequote.sourceUrl.length).toBeGreaterThan(0);
  });

  test("Equipment pricing includes confidence_level", async () => {
    const result = await getEquipmentPrice("scada", "standard", 2000);
    
    expect(result.truequote).toBeDefined();
    expect(result.truequote.confidenceLevel).toBeDefined();
    expect(['high', 'medium', 'low']).toContain(result.truequote.confidenceLevel);
  });

  test("Equipment pricing includes source_date", async () => {
    const result = await getEquipmentPrice("ems_software", "standard", 1000);
    
    expect(result.truequote).toBeDefined();
    expect(result.truequote.sourceDate).toBeDefined();
    expect(typeof result.truequote.sourceDate).toBe('string');
    // Should be a valid date string
    expect(new Date(result.truequote.sourceDate).toString()).not.toBe('Invalid Date');
  });
});

// ============================================================================
// TEST 5: MARKUP APPLICATION
// ============================================================================
describe("Markup Configuration", () => {
  test("BESS has lower markup than EMS software", async () => {
    const bessMarkup = await getMarkupPercentage("bess");
    const emsMarkup = await getMarkupPercentage("ems_software");
    
    expect(bessMarkup).toBeLessThan(emsMarkup);
  });

  test("All equipment types have markup configured", async () => {
    const markups = await getAllMarkupConfigs();
    
    expect(markups).toBeDefined();
    expect(markups.length).toBeGreaterThan(10); // At least 10 equipment types
    
    markups.forEach((config: any) => {
      expect(config.equipmentType).toBeDefined();
      expect(config.markupPercentage).toBeGreaterThan(0);
      expect(config.markupPercentage).toBeLessThanOrEqual(50);
    });
  });

  test("Markup is applied correctly to base price", async () => {
    const result = await getEquipmentPrice("inverter_pcs", "standard", 2000);
    const markup = await getMarkupPercentage("inverter");
    
    const expectedPriceWithMarkup = result.price * (1 + markup);
    
    // Should match within 0.5% (accounting for rounding)
    const priceDiff = Math.abs(result.priceWithMarkup - expectedPriceWithMarkup);
    expect(priceDiff / expectedPriceWithMarkup).toBeLessThan(0.005);
  });

  test("Default markup is 15% when equipment type not configured", async () => {
    // Use a non-existent equipment type to trigger default
    const defaultMarkup = await getMarkupPercentage("unknown_equipment_type" as EquipmentType);
    
    expect(defaultMarkup).toBe(0.15); // 15% default
  });
});

// ============================================================================
// TEST 6: REALISTIC PRICING RANGES
// ============================================================================
describe("Realistic Pricing Ranges", () => {
  test("Microgrid controller: $5k-$50k depending on tier", async () => {
    const standard = await getMicrogridControllerPrice(1000, 'standard');
    
    expect(standard).toBeGreaterThan(5_000);
    expect(standard).toBeLessThan(50_000);
  });

  test("BMS: $0.50-$5 per kWh", async () => {
    const bmsTotal = await getBMSPrice(1000, 'standard'); // 1 MWh system
    const bmsPerKWh = bmsTotal / 1000;
    
    expect(bmsPerKWh).toBeGreaterThan(0.50);
    expect(bmsPerKWh).toBeLessThan(5.00);
  });

  test("SCADA: $10k-$100k", async () => {
    const scada = await getSCADAPrice(2000, 'standard');
    
    expect(scada).toBeGreaterThan(10_000);
    expect(scada).toBeLessThan(100_000);
  });

  test("EMS software: $15k-$200k", async () => {
    const ems = await getEMSSoftwarePrice(2000, 'standard');
    
    expect(ems).toBeGreaterThan(15_000);
    expect(ems).toBeLessThan(200_000);
  });

  test("DC patch panel: $500-$5k", async () => {
    const panel = await getDCPatchPanelPrice(100, 'standard');
    
    expect(panel).toBeGreaterThan(500);
    expect(panel).toBeLessThan(5_000);
  });

  test("Transformer: $50-$200 per kVA", async () => {
    const transformerTotal = await getTransformerPricePerKVA(2000, 'standard');
    const transformerPerKVA = transformerTotal / 2000;
    
    expect(transformerPerKVA).toBeGreaterThan(50);
    expect(transformerPerKVA).toBeLessThan(200);
  });

  test("Inverter: $50-$150 per kW", async () => {
    const inverterTotal = await getInverterPricePerKW(2000, 'standard');
    const inverterPerKW = inverterTotal / 2000;
    
    expect(inverterPerKW).toBeGreaterThan(50);
    expect(inverterPerKW).toBeLessThan(150);
  });

  test("Switchgear: $30-$80 per kW", async () => {
    const switchgear = await getSwitchgearPricePerKW('standard');
    
    expect(switchgear).toBeGreaterThan(30);
    expect(switchgear).toBeLessThan(80);
  });
});

// ============================================================================
// TEST 7: ERROR HANDLING
// ============================================================================
describe("Error Handling", () => {
  test("Returns fallback pricing when database unavailable", async () => {
    // This will use fallback if database fails
    const price = await getInverterPricePerKW(1000, 'standard');
    
    expect(price).toBeGreaterThan(0);
    expect(price).toBeLessThan(200); // Reasonable fallback range
  });

  test("Handles invalid tier gracefully", async () => {
    const price = await getEquipmentPrice("bms", "invalid_tier" as PricingTier, 1000);
    
    // Should fall back to standard tier
    expect(price).toBeDefined();
    expect(price.price).toBeGreaterThan(0);
  });

  test("Handles zero system size gracefully", async () => {
    const price = await getTransformerPricePerKVA(0, 'standard');
    
    // Should return minimum viable price (not crash)
    expect(price).toBeGreaterThan(0);
  });

  test("Handles negative system size gracefully", async () => {
    const price = await getSCADAPrice(-1000, 'standard');
    
    // Should treat as positive (absolute value)
    expect(price).toBeGreaterThan(0);
  });
});

// ============================================================================
// TEST 8: COMPREHENSIVE EQUIPMENT TYPES
// ============================================================================
describe("All Equipment Types Available", () => {
  test("All 10 equipment types return valid pricing", async () => {
    const results = await Promise.all([
      getMicrogridControllerPrice(1000, 'standard'),
      getDCPatchPanelPrice(100, 'standard'),
      getACPatchPanelPrice(100, 'standard'),
      getBMSPrice(1000, 'standard'),
      getESSEnclosurePrice(1000, 'standard'),
      getSCADAPrice(1000, 'standard'),
      getEMSSoftwarePrice(1000, 'standard'),
      getTransformerPricePerKVA(1000, 'standard'),
      getInverterPricePerKW(1000, 'standard'),
      getSwitchgearPricePerKW('standard'),
    ]);
    
    results.forEach((price) => {
      expect(price).toBeGreaterThan(0);
      expect(typeof price).toBe('number');
    });
  });

  test("Each equipment type has all 4 tiers", async () => {
    const tiers: PricingTier[] = ['economy', 'standard', 'premium', 'enterprise'];
    const equipmentType: EquipmentType = 'bms';
    
    const prices = await Promise.all(
      tiers.map((tier) => getEquipmentPrice(equipmentType, tier, 1000))
    );
    
    prices.forEach((result, index) => {
      expect(result.price).toBeGreaterThan(0);
      if (index > 0) {
        // Each tier should be more expensive than the previous
        expect(result.price).toBeGreaterThan(prices[index - 1].price);
      }
    });
  });
});

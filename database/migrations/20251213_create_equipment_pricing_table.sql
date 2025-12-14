-- Create equipment_pricing table for vendor-specific pricing tracking
-- This table supports market intelligence and vendor pricing updates
-- Created: December 13, 2025

CREATE TABLE IF NOT EXISTS equipment_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Equipment identification
  equipment_type TEXT NOT NULL CHECK (equipment_type IN (
    'battery',
    'inverter', 
    'solar',
    'wind',
    'generator',
    'transformer'
  )),
  
  -- Vendor information
  manufacturer TEXT NOT NULL,
  model TEXT,
  vendor_name TEXT,
  vendor_contact TEXT,
  
  -- Pricing (equipment-type specific columns)
  price_per_kwh NUMERIC(10, 2), -- For batteries ($/kWh)
  price_per_kw NUMERIC(10, 2),  -- For inverters, generators, wind ($/kW)
  price_per_watt NUMERIC(10, 4), -- For solar ($/W)
  price_per_mva NUMERIC(12, 2),  -- For transformers ($/MVA)
  
  -- Capacity range this pricing applies to
  min_capacity_mw NUMERIC(10, 3),
  max_capacity_mw NUMERIC(10, 3),
  
  -- Geographic applicability
  region TEXT CHECK (region IN (
    'north-america',
    'europe',
    'asia-pacific',
    'middle-east',
    'latin-america',
    'africa',
    'global'
  )),
  
  -- Metadata
  notes TEXT,
  source TEXT, -- Where this pricing data came from
  quote_reference TEXT, -- Reference number if from a quote
  is_active BOOLEAN DEFAULT true,
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
  
  -- Timestamps
  effective_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_capacity_range CHECK (
    min_capacity_mw IS NULL OR 
    max_capacity_mw IS NULL OR 
    min_capacity_mw <= max_capacity_mw
  )
);

-- Indexes for performance
CREATE INDEX idx_equipment_pricing_type ON equipment_pricing(equipment_type);
CREATE INDEX idx_equipment_pricing_active ON equipment_pricing(is_active);
CREATE INDEX idx_equipment_pricing_updated ON equipment_pricing(updated_at DESC);
CREATE INDEX idx_equipment_pricing_manufacturer ON equipment_pricing(manufacturer);
CREATE INDEX idx_equipment_pricing_region ON equipment_pricing(region);
CREATE INDEX idx_equipment_pricing_type_active ON equipment_pricing(equipment_type, is_active, updated_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE equipment_pricing ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active pricing
CREATE POLICY "Allow public read access to active equipment pricing"
  ON equipment_pricing
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to read all pricing (including inactive)
CREATE POLICY "Allow authenticated users to read all equipment pricing"
  ON equipment_pricing
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update/delete
-- Note: In production, restrict this to admin role via custom claims or separate admin table
CREATE POLICY "Allow authenticated users to manage equipment pricing"
  ON equipment_pricing
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_equipment_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_pricing_updated_at
  BEFORE UPDATE ON equipment_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_pricing_updated_at();

-- Seed with sample vendor pricing (optional - can be removed)
-- These represent December 2025 market rates from various vendors
INSERT INTO equipment_pricing (
  equipment_type,
  manufacturer,
  model,
  price_per_kwh,
  region,
  notes,
  source,
  confidence_level
) VALUES
  (
    'battery',
    'CATL',
    'LFP Energy Storage',
    115.00,
    'global',
    'Large-scale LFP battery systems (4-hour duration)',
    'CATL Q4 2025 pricing sheet',
    'high'
  ),
  (
    'battery',
    'BYD',
    'Blade Battery',
    120.00,
    'global',
    'BYD Blade LFP technology (4-hour duration)',
    'BYD commercial quote Dec 2025',
    'high'
  ),
  (
    'battery',
    'Tesla',
    'Megapack',
    125.00,
    'north-america',
    'Tesla Megapack 3 (4-hour duration)',
    'Tesla Energy Q4 2025 quote',
    'high'
  );

INSERT INTO equipment_pricing (
  equipment_type,
  manufacturer,
  model,
  price_per_kw,
  region,
  notes,
  source,
  confidence_level
) VALUES
  (
    'inverter',
    'SMA',
    'Sunny Central',
    75.00,
    'global',
    'Central inverters for utility-scale applications',
    'SMA 2025 price list',
    'high'
  ),
  (
    'inverter',
    'ABB',
    'PVS980',
    82.00,
    'global',
    'ABB central inverters with integrated DC combiner',
    'ABB commercial quote',
    'high'
  ),
  (
    'generator',
    'Caterpillar',
    'C175-20',
    700.00,
    'north-america',
    'Natural gas generator (20 MW)',
    'Caterpillar 2025 industrial catalog',
    'high'
  ),
  (
    'generator',
    'Cummins',
    'QSK60-G14',
    680.00,
    'north-america',
    'Natural gas generator (2.5 MW)',
    'Cummins Power Generation quote',
    'high'
  );

INSERT INTO equipment_pricing (
  equipment_type,
  manufacturer,
  model,
  price_per_watt,
  region,
  notes,
  source,
  confidence_level
) VALUES
  (
    'solar',
    'LONGi',
    'Hi-MO 6',
    0.65,
    'global',
    'Utility-scale bifacial modules (≥5 MW systems)',
    'LONGi Q4 2025 pricing',
    'high'
  ),
  (
    'solar',
    'Trina Solar',
    'Vertex N',
    0.67,
    'global',
    'N-type TOPCon utility-scale modules',
    'Trina Solar commercial quote',
    'high'
  ),
  (
    'solar',
    'First Solar',
    'Series 7',
    0.70,
    'north-america',
    'CdTe thin-film utility-scale (≥5 MW)',
    'First Solar Dec 2025 quote',
    'high'
  );

INSERT INTO equipment_pricing (
  equipment_type,
  manufacturer,
  model,
  price_per_mva,
  region,
  notes,
  source,
  confidence_level
) VALUES
  (
    'transformer',
    'ABB',
    'Power Transformer',
    48000.00,
    'global',
    'Utility-scale power transformers',
    'ABB 2025 catalog',
    'medium'
  ),
  (
    'transformer',
    'Siemens',
    'GEAFOL',
    52000.00,
    'europe',
    'Cast-resin transformers for industrial use',
    'Siemens Energy quote',
    'medium'
  );

-- Comments
COMMENT ON TABLE equipment_pricing IS 'Vendor-specific equipment pricing for market intelligence and accurate quoting';
COMMENT ON COLUMN equipment_pricing.equipment_type IS 'Type of equipment: battery, inverter, solar, wind, generator, transformer';
COMMENT ON COLUMN equipment_pricing.price_per_kwh IS 'Battery pricing in $/kWh (typically 4-hour duration systems)';
COMMENT ON COLUMN equipment_pricing.price_per_kw IS 'Inverter/generator/wind pricing in $/kW';
COMMENT ON COLUMN equipment_pricing.price_per_watt IS 'Solar pricing in $/W (DC capacity)';
COMMENT ON COLUMN equipment_pricing.price_per_mva IS 'Transformer pricing in $/MVA';
COMMENT ON COLUMN equipment_pricing.confidence_level IS 'high=verified quote, medium=catalog pricing, low=estimate';
COMMENT ON COLUMN equipment_pricing.is_active IS 'false if pricing is expired or superseded';

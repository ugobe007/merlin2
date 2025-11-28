-- Seed basic use cases for Smart Wizard
-- Run this in Supabase SQL Editor

-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS use_cases (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  required_tier TEXT DEFAULT 'FREE',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow public read access
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON use_cases;
CREATE POLICY "Allow public read access" 
  ON use_cases FOR SELECT 
  USING (is_active = true);

-- Insert basic use cases
INSERT INTO use_cases (id, slug, name, description, category, display_order, required_tier) VALUES
  ('office', 'office', 'Office Building', 'Commercial office buildings with typical energy consumption patterns', 'commercial', 1, 'FREE'),
  ('datacenter', 'data-center', 'Data Center', 'High-reliability power for mission-critical data center operations', 'commercial', 2, 'PREMIUM'),
  ('hotel', 'hotel-hospitality', 'Hotel & Hospitality', 'Hotels, resorts, and hospitality facilities', 'commercial', 3, 'FREE'),
  ('manufacturing', 'manufacturing', 'Manufacturing Facility', 'Industrial manufacturing with demand charge optimization', 'industrial', 4, 'PREMIUM'),
  ('ev-charging', 'ev-charging', 'EV Charging Station', 'Electric vehicle charging infrastructure', 'transportation', 5, 'FREE'),
  ('residential', 'residential', 'Residential', 'Single-family homes and residential complexes', 'residential', 6, 'FREE'),
  ('retail', 'retail', 'Retail & Commercial', 'Retail stores and commercial facilities', 'commercial', 7, 'FREE'),
  ('microgrid', 'microgrid', 'Microgrid & Renewable Integration', 'Microgrids with renewable energy integration', 'renewable', 8, 'PREMIUM')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

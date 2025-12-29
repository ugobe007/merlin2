-- ============================================================================
-- USE CASE BRANDS TABLE
-- December 26, 2025
-- 
-- Creates table for storing brand/chain information for use cases.
-- Used for pre-loading equipment defaults based on brand selection.
-- ============================================================================

CREATE TABLE IF NOT EXISTS use_case_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    brand_name VARCHAR(255) NOT NULL,
    brand_slug VARCHAR(100) NOT NULL,
    logo_url TEXT,
    description TEXT,
    equipment_defaults JSONB, -- Stores brand-specific equipment configurations
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique brand per use case
    UNIQUE(use_case_id, brand_slug)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_use_case_brands_use_case_id ON use_case_brands(use_case_id);
CREATE INDEX IF NOT EXISTS idx_use_case_brands_slug ON use_case_brands(brand_slug);
CREATE INDEX IF NOT EXISTS idx_use_case_brands_active ON use_case_brands(is_active) WHERE is_active = true;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_use_case_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_use_case_brands_updated_at
    BEFORE UPDATE ON use_case_brands
    FOR EACH ROW
    EXECUTE FUNCTION update_use_case_brands_updated_at();

-- ============================================================================
-- SEED DATA: Car Wash Brands
-- ============================================================================

DO $$
DECLARE
    v_car_wash_id UUID;
BEGIN
    -- Get car wash use case ID
    SELECT id INTO v_car_wash_id FROM use_cases WHERE slug = 'car-wash' LIMIT 1;
    
    IF v_car_wash_id IS NOT NULL THEN
        -- El Car Wash
        INSERT INTO use_case_brands (use_case_id, brand_name, brand_slug, description, equipment_defaults)
        VALUES (
            v_car_wash_id,
            'El Car Wash',
            'el-car-wash',
            'Express conveyor tunnel car wash with high-pressure systems and chemical applications',
            '{
                "pumpTypes": {
                    "highPressure": {"count": 10, "typicalPowerKW": 15},
                    "chemicalApplication": {"count": 15, "typicalPowerKW": 0.5},
                    "supportUtilities": {"count": 5, "typicalPowerKW": 7.5}
                },
                "dryers": {"count": 8, "typicalPowerKW": 30, "type": "standard"},
                "vacuumStations": {"count": 12, "typicalPowerKW": 5}
            }'::jsonb
        )
        ON CONFLICT (use_case_id, brand_slug) DO NOTHING;
        
        -- Tommy's Express Car Wash
        INSERT INTO use_case_brands (use_case_id, brand_name, brand_slug, description, equipment_defaults)
        VALUES (
            v_car_wash_id,
            'Tommy''s Express Car Wash',
            'tommys-express',
            'All-In-One pumping system with centralized 12-20+ pump configuration',
            '{
                "pumpTypes": {
                    "highPressure": {"count": 12, "typicalPowerKW": 15},
                    "chemicalApplication": {"count": 12, "typicalPowerKW": 0.5},
                    "supportUtilities": {"count": 6, "typicalPowerKW": 7.5}
                },
                "dryers": {"count": 6, "typicalPowerKW": 30, "type": "standard"},
                "vacuumStations": {"count": 10, "typicalPowerKW": 5}
            }'::jsonb
        )
        ON CONFLICT (use_case_id, brand_slug) DO NOTHING;
        
        RAISE NOTICE 'Seeded car wash brands';
    ELSE
        RAISE NOTICE 'Car wash use case not found, skipping brand seed';
    END IF;
END $$;

-- ============================================================================
-- SEED DATA: Hotel Brands
-- ============================================================================

DO $$
DECLARE
    v_hotel_id UUID;
BEGIN
    -- Get hotel use case ID
    SELECT id INTO v_hotel_id FROM use_cases WHERE slug = 'hotel' LIMIT 1;
    
    IF v_hotel_id IS NOT NULL THEN
        -- Hilton
        INSERT INTO use_case_brands (use_case_id, brand_name, brand_slug, description, equipment_defaults)
        VALUES (
            v_hotel_id,
            'Hilton',
            'hilton',
            'Full-service hotel with comprehensive amenities',
            '{
                "roomCount": {"typical": 150},
                "diningFacilities": {"restaurants": 2, "bars": 1},
                "amenities": {"pool": true, "gym": true, "spa": false}
            }'::jsonb
        )
        ON CONFLICT (use_case_id, brand_slug) DO NOTHING;
        
        -- Marriott
        INSERT INTO use_case_brands (use_case_id, brand_name, brand_slug, description, equipment_defaults)
        VALUES (
            v_hotel_id,
            'Marriott',
            'marriott',
            'Full-service hotel with comprehensive amenities',
            '{
                "roomCount": {"typical": 200},
                "diningFacilities": {"restaurants": 2, "bars": 1},
                "amenities": {"pool": true, "gym": true, "spa": true}
            }'::jsonb
        )
        ON CONFLICT (use_case_id, brand_slug) DO NOTHING;
        
        -- Hyatt
        INSERT INTO use_case_brands (use_case_id, brand_name, brand_slug, description, equipment_defaults)
        VALUES (
            v_hotel_id,
            'Hyatt',
            'hyatt',
            'Full-service hotel with comprehensive amenities',
            '{
                "roomCount": {"typical": 180},
                "diningFacilities": {"restaurants": 2, "bars": 1},
                "amenities": {"pool": true, "gym": true, "spa": true}
            }'::jsonb
        )
        ON CONFLICT (use_case_id, brand_slug) DO NOTHING;
        
        RAISE NOTICE 'Seeded hotel brands';
    ELSE
        RAISE NOTICE 'Hotel use case not found, skipping brand seed';
    END IF;
END $$;



-- ============================================================================
-- BUSINESS LOOKUP CACHE MIGRATION
-- ============================================================================
-- Created: January 22, 2026
-- Purpose: Cache verified business data from Google Places API lookups
--          Supports WizardV7 Step 1 business verification feature
-- 
-- This enables:
-- - Cache API results to reduce redundant calls
-- - Store business photos, logos, and metadata
-- - Track verification status and confidence
-- - Link businesses to industry classifications
--
-- Integration: WizardV7 Step1LocationV7 business lookup feature
-- ============================================================================

-- ============================================================================
-- CREATE BUSINESS LOOKUP CACHE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_lookup_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business identification
  business_name TEXT NOT NULL,
  street_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Normalized search key (for cache lookup)
  search_key TEXT NOT NULL UNIQUE,  -- LOWER(business_name || '|' || postal_code)
  
  -- Google Places data
  google_place_id TEXT,  -- Google Places API place_id
  google_photo_url TEXT,  -- Main business photo from Google Places
  google_photo_reference TEXT,  -- Photo reference for refresh
  
  -- Business metadata
  category TEXT,  -- "Car Wash", "Hotel", "Office Building", etc.
  industry_slug TEXT,  -- Links to use_cases.slug (car-wash, hotel, office, etc.)
  website TEXT,
  phone TEXT,
  
  -- Logo/branding
  logo_url TEXT,  -- Website favicon or logo
  logo_source TEXT,  -- 'clearbit', 'favicon', 'manual'
  
  -- Verification
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'stale')),
  verification_date TIMESTAMPTZ,
  confidence_score DECIMAL(3,2),  -- 0.00 to 1.00
  
  -- API source tracking
  data_source TEXT DEFAULT 'google-places' CHECK (data_source IN ('google-places', 'manual', 'import')),
  api_response JSONB,  -- Store full API response for debugging
  
  -- Usage tracking
  lookup_count INTEGER DEFAULT 0,
  last_looked_up TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_business_lookup_search_key ON business_lookup_cache(search_key);
CREATE INDEX IF NOT EXISTS idx_business_lookup_postal ON business_lookup_cache(postal_code);
CREATE INDEX IF NOT EXISTS idx_business_lookup_industry ON business_lookup_cache(industry_slug);
CREATE INDEX IF NOT EXISTS idx_business_lookup_status ON business_lookup_cache(verification_status);
CREATE INDEX IF NOT EXISTS idx_business_lookup_recent ON business_lookup_cache(last_looked_up DESC);

-- ============================================================================
-- HELPER FUNCTION: Generate Search Key
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_business_search_key(
  p_business_name TEXT,
  p_postal_code TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LOWER(TRIM(p_business_name) || '|' || TRIM(p_postal_code));
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Lookup Business (with cache)
-- ============================================================================
CREATE OR REPLACE FUNCTION lookup_business(
  p_business_name TEXT,
  p_postal_code TEXT,
  p_street_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  category TEXT,
  industry_slug TEXT,
  website TEXT,
  phone TEXT,
  photo_url TEXT,
  logo_url TEXT,
  verification_status TEXT,
  confidence_score DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_search_key TEXT;
  v_existing_record RECORD;
BEGIN
  -- Generate search key
  v_search_key := generate_business_search_key(p_business_name, p_postal_code);
  
  -- Check cache
  SELECT * INTO v_existing_record
  FROM business_lookup_cache
  WHERE search_key = v_search_key
    AND verification_status = 'verified'
    AND (NOW() - last_looked_up) < INTERVAL '30 days';  -- Cache valid for 30 days
  
  IF FOUND THEN
    -- Update lookup count
    UPDATE business_lookup_cache
    SET lookup_count = lookup_count + 1,
        last_looked_up = NOW()
    WHERE business_lookup_cache.id = v_existing_record.id;
    
    -- Return cached data
    RETURN QUERY
    SELECT 
      v_existing_record.id,
      v_existing_record.business_name,
      v_existing_record.street_address AS address,
      v_existing_record.city,
      v_existing_record.state,
      v_existing_record.postal_code,
      v_existing_record.category,
      v_existing_record.industry_slug,
      v_existing_record.website,
      v_existing_record.phone,
      v_existing_record.google_photo_url AS photo_url,
      v_existing_record.logo_url,
      v_existing_record.verification_status,
      v_existing_record.confidence_score;
  ELSE
    -- Cache miss - return NULL to trigger API call
    -- The application layer will call Google Places API and save result
    RETURN;
  END IF;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Save Business Lookup Result
-- ============================================================================
CREATE OR REPLACE FUNCTION save_business_lookup(
  p_business_name TEXT,
  p_street_address TEXT,
  p_city TEXT,
  p_state TEXT,
  p_postal_code TEXT,
  p_category TEXT DEFAULT NULL,
  p_industry_slug TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_google_place_id TEXT DEFAULT NULL,
  p_google_photo_url TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_confidence_score DECIMAL DEFAULT 0.8,
  p_api_response JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_search_key TEXT;
  v_result_id UUID;
BEGIN
  -- Generate search key
  v_search_key := generate_business_search_key(p_business_name, p_postal_code);
  
  -- Upsert (insert or update)
  INSERT INTO business_lookup_cache (
    business_name,
    street_address,
    city,
    state,
    postal_code,
    search_key,
    category,
    industry_slug,
    website,
    phone,
    google_place_id,
    google_photo_url,
    logo_url,
    verification_status,
    verification_date,
    confidence_score,
    data_source,
    api_response,
    lookup_count,
    last_looked_up
  ) VALUES (
    p_business_name,
    p_street_address,
    p_city,
    p_state,
    p_postal_code,
    v_search_key,
    p_category,
    p_industry_slug,
    p_website,
    p_phone,
    p_google_place_id,
    p_google_photo_url,
    p_logo_url,
    'verified',
    NOW(),
    p_confidence_score,
    'google-places',
    p_api_response,
    1,
    NOW()
  )
  ON CONFLICT (search_key) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    street_address = EXCLUDED.street_address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    category = COALESCE(EXCLUDED.category, business_lookup_cache.category),
    industry_slug = COALESCE(EXCLUDED.industry_slug, business_lookup_cache.industry_slug),
    website = COALESCE(EXCLUDED.website, business_lookup_cache.website),
    phone = COALESCE(EXCLUDED.phone, business_lookup_cache.phone),
    google_place_id = COALESCE(EXCLUDED.google_place_id, business_lookup_cache.google_place_id),
    google_photo_url = COALESCE(EXCLUDED.google_photo_url, business_lookup_cache.google_photo_url),
    logo_url = COALESCE(EXCLUDED.logo_url, business_lookup_cache.logo_url),
    verification_status = 'verified',
    verification_date = NOW(),
    confidence_score = EXCLUDED.confidence_score,
    api_response = EXCLUDED.api_response,
    lookup_count = business_lookup_cache.lookup_count + 1,
    last_looked_up = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_result_id;
  
  RETURN v_result_id;
END;
$$;

-- ============================================================================
-- DEMO DATA (for testing WizardV7)
-- ============================================================================
INSERT INTO business_lookup_cache (
  business_name,
  street_address,
  city,
  state,
  postal_code,
  search_key,
  category,
  industry_slug,
  website,
  google_photo_url,
  logo_url,
  verification_status,
  verification_date,
  confidence_score,
  data_source,
  lookup_count
) VALUES
(
  'WOW Car Wash',
  '123 Maryland Parkway',
  'San Francisco',
  'CA',
  '89052',
  generate_business_search_key('WOW Car Wash', '89052'),
  'Car Wash',
  'car-wash',
  'https://wowcarwash.com',
  '/assets/images/car_wash_1.jpg',  -- Fallback to local asset
  'https://wowcarwash.com/favicon.ico',
  'verified',
  NOW(),
  0.95,
  'manual',
  0
)
ON CONFLICT (search_key) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE business_lookup_cache IS 'Cache for Google Places API business lookups - reduces API calls and stores verified business data';
COMMENT ON COLUMN business_lookup_cache.search_key IS 'Normalized cache key: LOWER(business_name|postal_code) for fast lookups';
COMMENT ON COLUMN business_lookup_cache.confidence_score IS 'Match confidence 0.00-1.00: >0.9=high, 0.7-0.9=medium, <0.7=low';
COMMENT ON COLUMN business_lookup_cache.api_response IS 'Full Google Places API response stored as JSONB for debugging';
COMMENT ON FUNCTION lookup_business IS 'Cached business lookup with 30-day TTL - returns NULL on cache miss to trigger API call';
COMMENT ON FUNCTION save_business_lookup IS 'Upsert business lookup result from Google Places API';

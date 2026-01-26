-- ============================================================================
-- Migration: Add Fitness Center Industry Keywords
-- Date: January 24, 2026
-- Purpose: Fix "Orange Theory Fitness" being misclassified as "hospital"
-- ============================================================================

-- For now, map fitness centers to "retail" (similar commercial load profile)
-- TODO: Create dedicated fitness-center use case with proper questionnaire

INSERT INTO industry_keyword_mappings (keyword, industry_slug, confidence_weight, is_exact_match, case_sensitive) VALUES
  -- Fitness Center / Gym keywords
  ('fitness', 'retail', 0.95, FALSE, FALSE),
  ('gym', 'retail', 0.90, FALSE, FALSE),
  ('orange theory', 'retail', 1.00, FALSE, FALSE),
  ('orangetheory', 'retail', 1.00, FALSE, FALSE),
  ('crossfit', 'retail', 0.95, FALSE, FALSE),
  ('planet fitness', 'retail', 1.00, FALSE, FALSE),
  ('la fitness', 'retail', 1.00, FALSE, FALSE),
  ('gold gym', 'retail', 0.95, FALSE, FALSE),
  ('anytime fitness', 'retail', 1.00, FALSE, FALSE),
  ('equinox', 'retail', 0.95, FALSE, FALSE),
  ('lifetime fitness', 'retail', 1.00, FALSE, FALSE),
  ('24 hour fitness', 'retail', 1.00, FALSE, FALSE),
  ('workout', 'retail', 0.70, FALSE, FALSE),
  ('health club', 'retail', 0.85, FALSE, FALSE),
  ('yoga studio', 'retail', 0.80, FALSE, FALSE),
  ('pilates', 'retail', 0.80, FALSE, FALSE),
  ('boxing gym', 'retail', 0.85, FALSE, FALSE),
  ('martial arts', 'retail', 0.80, FALSE, FALSE),
  ('recreation center', 'retail', 0.75, FALSE, FALSE),
  ('athletic club', 'retail', 0.85, FALSE, FALSE)
ON CONFLICT (keyword, industry_slug) DO NOTHING;

-- ============================================================================
-- VALIDATION
-- ============================================================================
-- SELECT * FROM industry_keyword_mappings WHERE keyword ILIKE '%fitness%' OR keyword ILIKE '%gym%';

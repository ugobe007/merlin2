-- Clean Up Junk Opportunity Names
-- Created: March 20, 2026
-- Filters out low-quality company names from opportunities table

-- Delete opportunities with junk company names
DELETE FROM opportunities
WHERE 
  -- Too short (less than 3 characters)
  LENGTH(company_name) < 3
  
  -- Generic words that shouldn't be company names
  OR company_name IN ('New', 'Data', 'Green', 'First', 'How', 'Building', 'Trump', 'Opening', 'Microsoft', 'Amazon', 'Google')
  
  -- Starts with generic phrases
  OR company_name LIKE '% biggest %'
  OR company_name LIKE '% notable %'
  OR company_name LIKE 'How %'
  OR company_name LIKE 'Building %'
  OR company_name LIKE 'Groundbreaking %'
  
  -- Contains only numbers
  OR company_name ~ '^\d+$'
  
  -- Contains URLs
  OR company_name ~ 'https?://'
  
  -- Contains email addresses
  OR company_name ~ '@'
  
  -- Contains special characters that shouldn't be in company names
  OR company_name ~ '[<>{}[\]\\|]'
  
  -- Ends with common article fragments
  OR company_name LIKE '% Opening'
  OR company_name LIKE '% Celebrates'
  OR company_name LIKE '% And'
  OR company_name LIKE '% Announces'
  OR company_name LIKE '% Starts'
  OR company_name LIKE '% Acquires'
  
  -- All caps (likely headlines, not company names)
  OR (company_name = UPPER(company_name) AND LENGTH(company_name) > 5);

-- Add constraint to prevent future junk entries
ALTER TABLE opportunities 
ADD CONSTRAINT chk_company_name_quality 
CHECK (
  LENGTH(company_name) >= 3
  AND company_name !~ '^\d+$'
  AND company_name !~ 'https?://'
  AND company_name !~ '@'
  AND company_name !~ '[<>{}[\]\\|]'
);

-- Log cleanup results
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count FROM opportunities;
    RAISE NOTICE 'Cleanup complete. Remaining opportunities: %', remaining_count;
END $$;

-- Create view for high-quality opportunities only
CREATE OR REPLACE VIEW quality_opportunities AS
SELECT *
FROM opportunities
WHERE 
  confidence_score >= 50
  AND LENGTH(company_name) >= 5
  AND company_name !~ '^\d'  -- Doesn't start with number
  AND status = 'new'
ORDER BY confidence_score DESC, created_at DESC;

COMMENT ON VIEW quality_opportunities IS 'Filtered view of high-quality, actionable opportunities with clean company names';

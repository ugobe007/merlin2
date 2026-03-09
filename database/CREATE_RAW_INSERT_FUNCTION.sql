-- Raw SQL insert function that completely bypasses PostgREST schema cache
-- This uses dynamic SQL to avoid any schema validation

CREATE OR REPLACE FUNCTION insert_article_raw(
  p_source_id UUID,
  p_title TEXT,
  p_url TEXT,
  p_excerpt TEXT,
  p_content TEXT,
  p_published_at TIMESTAMPTZ,
  p_equipment_mentioned TEXT[],
  p_topics TEXT[],
  p_relevance_score DECIMAL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Use EXECUTE to bypass PostgREST schema cache entirely
  EXECUTE '
    INSERT INTO scraped_articles (
      source_id, title, url, excerpt, content, 
      published_at, equipment_mentioned, topics, 
      relevance_score, is_processed
    ) VALUES (
      $1, $2, $3, $4, $5, 
      $6, $7, $8, 
      $9, true
    ) RETURNING id
  ' INTO v_id
  USING p_source_id, p_title, p_url, p_excerpt, p_content,
        p_published_at, p_equipment_mentioned, p_topics,
        p_relevance_score;
  
  RETURN v_id;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION insert_article_raw TO service_role;
GRANT EXECUTE ON FUNCTION insert_article_raw TO postgres;

-- Create a function to insert articles (bypasses PostgREST schema cache)
CREATE OR REPLACE FUNCTION insert_scraped_article(
  p_source_id UUID,
  p_title VARCHAR(500),
  p_url VARCHAR(500),
  p_author VARCHAR(255),
  p_published_at TIMESTAMPTZ,
  p_content TEXT,
  p_excerpt TEXT,
  p_topics TEXT[],
  p_equipment_mentioned TEXT[],
  p_relevance_score DECIMAL(3,2),
  p_is_processed BOOLEAN,
  p_prices_extracted JSONB,
  p_regulations_mentioned JSONB
)
RETURNS TABLE (
  id UUID,
  inserted_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO scraped_articles (
    source_id,
    title,
    url,
    author,
    published_at,
    content,
    excerpt,
    topics,
    equipment_mentioned,
    relevance_score,
    is_processed,
    prices_extracted,
    regulations_mentioned
  )
  VALUES (
    p_source_id,
    p_title,
    p_url,
    p_author,
    p_published_at,
    p_content,
    p_excerpt,
    COALESCE(p_topics, '{}'),
    COALESCE(p_equipment_mentioned, '{}'),
    COALESCE(p_relevance_score, 0.5),
    COALESCE(p_is_processed, false),
    COALESCE(p_prices_extracted, '[]'::jsonb),
    COALESCE(p_regulations_mentioned, '[]'::jsonb)
  )
  ON CONFLICT (url) DO NOTHING
  RETURNING scraped_articles.id, scraped_articles.scraped_at;
END;
$$;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION insert_scraped_article TO service_role;
GRANT EXECUTE ON FUNCTION insert_scraped_article TO postgres;

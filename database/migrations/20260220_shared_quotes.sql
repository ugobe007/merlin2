-- Share Quote Feature
-- Created: Feb 20, 2026
-- Purpose: Store shareable public quote snapshots

-- Shared quotes table
CREATE TABLE IF NOT EXISTS shared_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(12) UNIQUE NOT NULL,
  
  -- Quote data (frozen snapshot)
  quote_data JSONB NOT NULL,
  
  -- Metadata
  created_by UUID,  -- References auth.users.id (optional: anonymous shares allowed)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Access control
  password_hash TEXT,
  is_public BOOLEAN DEFAULT true,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for shared_quotes
CREATE INDEX IF NOT EXISTS idx_shared_quotes_short_code ON shared_quotes(short_code);
CREATE INDEX IF NOT EXISTS idx_shared_quotes_created_by ON shared_quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_quotes_expires_at ON shared_quotes(expires_at);

-- View tracking (optional: detailed analytics)
CREATE TABLE IF NOT EXISTS shared_quote_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_quote_id UUID REFERENCES shared_quotes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Analytics metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT
);

-- Indexes for shared_quote_views
CREATE INDEX IF NOT EXISTS idx_shared_quote_views_shared_quote_id ON shared_quote_views(shared_quote_id);
CREATE INDEX IF NOT EXISTS idx_shared_quote_views_viewed_at ON shared_quote_views(viewed_at);

-- Cleanup job: Delete expired quotes (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_quotes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM shared_quotes
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE shared_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_quote_views ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read public shared quotes (no auth required)
CREATE POLICY "Public quotes are viewable by anyone"
  ON shared_quotes
  FOR SELECT
  USING (is_public = true AND expires_at > NOW());

-- Users can create shared quotes
CREATE POLICY "Users can create shared quotes"
  ON shared_quotes
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by OR
    auth.uid() IS NULL  -- Allow anonymous shares
  );

-- Users can update their own shared quotes
CREATE POLICY "Users can update their own shared quotes"
  ON shared_quotes
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete their own shared quotes
CREATE POLICY "Users can delete their own shared quotes"
  ON shared_quotes
  FOR DELETE
  USING (auth.uid() = created_by);

-- View tracking: Anyone can record views
CREATE POLICY "Anyone can record quote views"
  ON shared_quote_views
  FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE shared_quotes IS 'Shareable public quote snapshots with short codes';
COMMENT ON COLUMN shared_quotes.short_code IS 'Short URL code (e.g., X7mK9pQ2)';
COMMENT ON COLUMN shared_quotes.quote_data IS 'Frozen quote snapshot (JSONB)';
COMMENT ON COLUMN shared_quotes.password_hash IS 'Optional password protection (bcrypt hash)';
COMMENT ON COLUMN shared_quotes.view_count IS 'Number of times quote has been viewed';

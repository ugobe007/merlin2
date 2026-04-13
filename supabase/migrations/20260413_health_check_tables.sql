-- ============================================================================
-- HEALTH CHECK COLUMN PATCHES
-- April 13, 2026
--
-- PURPOSE
--   DB audit (run April 13) confirmed all health-check tables already exist
--   from prior migrations.  Two column gaps prevent health check queries
--   from running:
--
--     1. scraped_articles.created_at is missing (column is scraped_at).
--        systemHealthCheck.ts orders by created_at — PostgREST returns an
--        error and the Parsing Logic check scores 0.
--
--     2. ssot_alerts.category is missing.
--        health check reads only created_at so this doesn't block reads,
--        but the column is referenced in downstream alert writes.
--
--   No new tables are created; all 8 tables expected by checkDatabaseSchemas
--   already exist and pass.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. scraped_articles — add created_at, back-fill from scraped_at
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE scraped_articles
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

UPDATE scraped_articles
   SET created_at = scraped_at
 WHERE created_at IS NULL
   AND scraped_at IS NOT NULL;

-- For any rows where scraped_at is also null, default to now()
UPDATE scraped_articles
   SET created_at = now()
 WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS scraped_articles_created_at_idx
  ON scraped_articles (created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ssot_alerts — add category column
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE ssot_alerts
  ADD COLUMN IF NOT EXISTS category text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Verify scrape_jobs has the status + created_at the health check expects
--    (these exist — add indexes if missing for query performance)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS scrape_jobs_created_at_idx
  ON scrape_jobs (created_at DESC);

CREATE INDEX IF NOT EXISTS scrape_jobs_status_idx
  ON scrape_jobs (status);

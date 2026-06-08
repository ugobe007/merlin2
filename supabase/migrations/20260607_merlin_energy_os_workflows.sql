-- Merlin Energy OS workflow foundation
-- Durable project/workflow state for wizard, partner API, ops console, and customer workspace entry points.

CREATE TABLE IF NOT EXISTS merlin_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  source TEXT NOT NULL DEFAULT 'partner-api',
  industry TEXT NOT NULL,
  facility JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  quote_id TEXT,
  webhook_url TEXT,
  workflow JSONB NOT NULL DEFAULT '[]'::jsonb,
  workflow_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merlin_projects_partner_id ON merlin_projects(partner_id);
CREATE INDEX IF NOT EXISTS idx_merlin_projects_status ON merlin_projects(status);
CREATE INDEX IF NOT EXISTS idx_merlin_projects_industry ON merlin_projects(industry);
CREATE INDEX IF NOT EXISTS idx_merlin_projects_created_at ON merlin_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merlin_projects_workflow_summary ON merlin_projects USING GIN(workflow_summary);

CREATE TABLE IF NOT EXISTS merlin_project_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES merlin_projects(id) ON DELETE CASCADE,
  partner_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merlin_project_events_project_id ON merlin_project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_merlin_project_events_event_type ON merlin_project_events(event_type);
CREATE INDEX IF NOT EXISTS idx_merlin_project_events_created_at ON merlin_project_events(created_at DESC);

CREATE OR REPLACE FUNCTION update_merlin_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merlin_projects_updated_at ON merlin_projects;
CREATE TRIGGER merlin_projects_updated_at
  BEFORE UPDATE ON merlin_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_merlin_projects_updated_at();

ALTER TABLE merlin_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE merlin_project_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage merlin projects" ON merlin_projects;
CREATE POLICY "Service role can manage merlin projects"
  ON merlin_projects
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage merlin project events" ON merlin_project_events;
CREATE POLICY "Service role can manage merlin project events"
  ON merlin_project_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

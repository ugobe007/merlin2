-- Supabase Database Schema for Merlin BESS
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/dleickerygxdtodfxdmm/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  power_mw DECIMAL(10,2) NOT NULL,
  duration_hours DECIMAL(10,2) NOT NULL,
  location TEXT NOT NULL,
  grid_mode TEXT,
  use_case TEXT,
  bess_capex DECIMAL(15,2),
  grand_capex DECIMAL(15,2),
  annual_savings DECIMAL(15,2),
  simple_roi_years DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Financial Models Table (Advanced Metrics)
CREATE TABLE IF NOT EXISTS financial_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  levered_irr DECIMAL(10,4),
  unlevered_irr DECIMAL(10,4),
  dscr DECIMAL(10,4),
  npv DECIMAL(15,2),
  mirr DECIMAL(10,4),
  payback_period DECIMAL(10,2),
  discounted_payback DECIMAL(10,2),
  profitability_index DECIMAL(10,4),
  forecast_years INTEGER DEFAULT 40,
  monthly_forecast JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Battery Degradation Table
CREATE TABLE IF NOT EXISTS battery_degradation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  method TEXT CHECK (method IN ('linear', 'exponential', 'calendar', 'cycle', 'temp_adjusted', 'hybrid', 'warranty', 'measured')),
  year INTEGER NOT NULL,
  capacity_remaining DECIMAL(5,2) NOT NULL, -- percentage
  efc_count INTEGER NOT NULL, -- Equivalent Full Cycles
  soh DECIMAL(5,2) NOT NULL, -- State of Health
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, method, year)
);

-- 4. Revenue Streams Table
CREATE TABLE IF NOT EXISTS revenue_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('peak_shaving', 'arbitrage', 'rec', 'reserve_capacity', 'demand_charge', 'frequency_regulation')),
  name TEXT NOT NULL,
  annual_revenue DECIMAL(15,2) NOT NULL,
  monthly_breakdown JSONB,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Scenarios Table (Sensitivity Analysis)
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('best', 'base', 'worst', 'custom')),
  battery_cost_variation DECIMAL(5,2), -- percentage
  electricity_price_variation DECIMAL(5,2), -- percentage
  degradation_rate_variation DECIMAL(5,2), -- percentage
  result_npv DECIMAL(15,2),
  result_irr DECIMAL(10,4),
  result_dscr DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Hourly Optimization Table (for charge/discharge scheduling)
CREATE TABLE IF NOT EXISTS hourly_optimization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  action TEXT CHECK (action IN ('charge', 'discharge', 'idle')),
  power_mw DECIMAL(10,2),
  electricity_price DECIMAL(10,4),
  expected_revenue DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_financial_models_project_id ON financial_models(project_id);
CREATE INDEX idx_battery_degradation_project_id ON battery_degradation(project_id);
CREATE INDEX idx_revenue_streams_project_id ON revenue_streams(project_id);
CREATE INDEX idx_scenarios_project_id ON scenarios(project_id);
CREATE INDEX idx_hourly_optimization_project_id ON hourly_optimization(project_id);

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_degradation ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_optimization ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow users to see their own data)
-- Note: Adjust these based on your auth setup
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (user_id = auth.uid()::text);

-- Similar policies for related tables
CREATE POLICY "Users can view own financial models" ON financial_models
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can insert own financial models" ON financial_models
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects table
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - for testing)
-- INSERT INTO projects (user_id, project_name, power_mw, duration_hours, location, bess_capex, grand_capex, annual_savings, simple_roi_years)
-- VALUES ('test-user-123', 'Sample BESS Project', 10.0, 4.0, 'California', 5000000, 6000000, 800000, 7.5);

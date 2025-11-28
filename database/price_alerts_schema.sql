-- =====================================================
-- PRICE ALERTS SYSTEM SCHEMA
-- For tracking energy pricing trends from news & deals
-- =====================================================

-- Energy Price Alerts Table
-- Stores pricing data extracted from news articles and industry announcements
CREATE TABLE IF NOT EXISTS energy_price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Alert Metadata
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('battery_kwh', 'battery_mwh', 'solar_watt', 'wind_kw', 'market_trend')),
  alert_level VARCHAR(20) DEFAULT 'info' CHECK (alert_level IN ('info', 'good_deal', 'excellent_deal', 'warning', 'critical')),
  
  -- Pricing Data
  price_value DECIMAL(10,2) NOT NULL,
  price_unit VARCHAR(10) NOT NULL, -- 'kwh', 'mwh', 'watt', 'kw'
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Deal/Project Information
  deal_name VARCHAR(500),
  project_size_mw DECIMAL(10,2),
  project_location VARCHAR(255),
  vendor_company VARCHAR(255),
  
  -- Source Information
  source_title TEXT NOT NULL,
  source_url TEXT,
  source_publisher VARCHAR(255),
  publish_date TIMESTAMP WITH TIME ZONE,
  
  -- Context & Analysis
  deal_summary TEXT,
  market_impact TEXT,
  price_trend VARCHAR(20), -- 'declining', 'stable', 'rising'
  relevance_score INTEGER DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  
  -- Classification
  industry_sector VARCHAR(50), -- 'commercial', 'utility', 'residential', 'industrial'
  technology_type VARCHAR(50), -- 'lfp', 'nmc', 'flow', 'lithium-ion', etc.
  
  -- Comparison Metrics
  baseline_price DECIMAL(10,2), -- Historical average for comparison
  price_difference_percent DECIMAL(5,2), -- % difference from baseline
  is_below_market BOOLEAN DEFAULT false,
  
  -- System Fields
  extracted_by VARCHAR(50) DEFAULT 'openai_scout',
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Notifications
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price Trends Table
-- Aggregated pricing trends over time
CREATE TABLE IF NOT EXISTS energy_price_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  trend_type VARCHAR(20) NOT NULL, -- 'battery_kwh', 'battery_mwh', 'solar_watt'
  time_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Pricing Statistics
  avg_price DECIMAL(10,2) NOT NULL,
  min_price DECIMAL(10,2) NOT NULL,
  max_price DECIMAL(10,2) NOT NULL,
  median_price DECIMAL(10,2),
  sample_size INTEGER DEFAULT 0,
  
  -- Trend Analysis
  price_change_percent DECIMAL(5,2),
  trend_direction VARCHAR(20), -- 'declining', 'stable', 'rising'
  confidence_level VARCHAR(20), -- 'low', 'medium', 'high'
  
  -- Regional Data
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'USA',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate periods
  UNIQUE(trend_type, time_period, period_start, region)
);

-- Alert Subscriptions Table
-- User preferences for receiving price alerts
CREATE TABLE IF NOT EXISTS alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Can be NULL for anonymous subscriptions
  email VARCHAR(255) NOT NULL,
  
  -- Subscription Preferences
  alert_types VARCHAR(20)[] DEFAULT ARRAY['battery_kwh', 'battery_mwh'], -- Array of alert types
  min_relevance_score INTEGER DEFAULT 70,
  notify_on_excellent_deals BOOLEAN DEFAULT true,
  notify_on_price_drops BOOLEAN DEFAULT true,
  price_drop_threshold_percent DECIMAL(5,2) DEFAULT 10.0, -- Notify if price drops >10%
  
  -- Regional Preferences
  regions VARCHAR(100)[] DEFAULT ARRAY['USA'],
  
  -- Notification Settings
  email_enabled BOOLEAN DEFAULT true,
  email_frequency VARCHAR(20) DEFAULT 'instant', -- 'instant', 'daily_digest', 'weekly_digest'
  last_notification_sent TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  confirmed BOOLEAN DEFAULT false,
  confirmation_token VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_price_alerts_type ON energy_price_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_price_alerts_level ON energy_price_alerts(alert_level);
CREATE INDEX IF NOT EXISTS idx_price_alerts_date ON energy_price_alerts(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_alerts_relevance ON energy_price_alerts(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_price_alerts_verified ON energy_price_alerts(verified, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_price_alerts_below_market ON energy_price_alerts(is_below_market) WHERE is_below_market = true;

CREATE INDEX IF NOT EXISTS idx_price_trends_type_period ON energy_price_trends(trend_type, time_period, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_price_trends_region ON energy_price_trends(region, trend_type);

CREATE INDEX IF NOT EXISTS idx_alert_subs_email ON alert_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_alert_subs_active ON alert_subscriptions(is_active) WHERE is_active = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE energy_price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_price_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read access for price alerts (verified only)
CREATE POLICY "Public read verified alerts"
  ON energy_price_alerts FOR SELECT
  USING (verified = true);

-- Admin write access for alerts
CREATE POLICY "Admin write alerts"
  ON energy_price_alerts FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Public read access for price trends
CREATE POLICY "Public read trends"
  ON energy_price_trends FOR SELECT
  USING (true);

-- Admin write access for trends
CREATE POLICY "Admin write trends"
  ON energy_price_trends FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Users can manage their own subscriptions
CREATE POLICY "Users manage own subscriptions"
  ON alert_subscriptions FOR ALL
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate price trend
CREATE OR REPLACE FUNCTION calculate_price_trend(
  p_trend_type VARCHAR,
  p_time_period VARCHAR,
  p_period_start DATE,
  p_period_end DATE,
  p_region VARCHAR DEFAULT 'USA'
) RETURNS VOID AS $$
DECLARE
  v_avg_price DECIMAL(10,2);
  v_min_price DECIMAL(10,2);
  v_max_price DECIMAL(10,2);
  v_median_price DECIMAL(10,2);
  v_sample_size INTEGER;
  v_prev_avg DECIMAL(10,2);
  v_price_change DECIMAL(5,2);
  v_trend_direction VARCHAR(20);
BEGIN
  -- Calculate statistics from alerts
  SELECT 
    AVG(price_value),
    MIN(price_value),
    MAX(price_value),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_value),
    COUNT(*)
  INTO
    v_avg_price,
    v_min_price,
    v_max_price,
    v_median_price,
    v_sample_size
  FROM energy_price_alerts
  WHERE alert_type = p_trend_type
    AND publish_date BETWEEN p_period_start AND p_period_end
    AND project_location LIKE '%' || p_region || '%'
    AND verified = true;
  
  -- Get previous period average for comparison
  SELECT avg_price INTO v_prev_avg
  FROM energy_price_trends
  WHERE trend_type = p_trend_type
    AND time_period = p_time_period
    AND period_end < p_period_start
    AND region = p_region
  ORDER BY period_end DESC
  LIMIT 1;
  
  -- Calculate change percentage
  IF v_prev_avg IS NOT NULL AND v_prev_avg > 0 THEN
    v_price_change := ((v_avg_price - v_prev_avg) / v_prev_avg) * 100;
    
    IF v_price_change < -2 THEN
      v_trend_direction := 'declining';
    ELSIF v_price_change > 2 THEN
      v_trend_direction := 'rising';
    ELSE
      v_trend_direction := 'stable';
    END IF;
  ELSE
    v_price_change := 0;
    v_trend_direction := 'stable';
  END IF;
  
  -- Insert or update trend
  INSERT INTO energy_price_trends (
    trend_type, time_period, period_start, period_end,
    avg_price, min_price, max_price, median_price, sample_size,
    price_change_percent, trend_direction, region,
    confidence_level
  ) VALUES (
    p_trend_type, p_time_period, p_period_start, p_period_end,
    v_avg_price, v_min_price, v_max_price, v_median_price, v_sample_size,
    v_price_change, v_trend_direction, p_region,
    CASE 
      WHEN v_sample_size >= 10 THEN 'high'
      WHEN v_sample_size >= 5 THEN 'medium'
      ELSE 'low'
    END
  )
  ON CONFLICT (trend_type, time_period, period_start, region)
  DO UPDATE SET
    avg_price = EXCLUDED.avg_price,
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price,
    median_price = EXCLUDED.median_price,
    sample_size = EXCLUDED.sample_size,
    price_change_percent = EXCLUDED.price_change_percent,
    trend_direction = EXCLUDED.trend_direction,
    confidence_level = EXCLUDED.confidence_level,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

INSERT INTO energy_price_alerts (
  alert_type, alert_level, price_value, price_unit,
  deal_name, project_size_mw, project_location, vendor_company,
  source_title, source_url, source_publisher, publish_date,
  deal_summary, market_impact, price_trend, relevance_score,
  industry_sector, technology_type,
  baseline_price, price_difference_percent, is_below_market,
  verified
) VALUES
(
  'battery_kwh', 'excellent_deal', 118.50, 'kwh',
  'California Community Solar + Storage', 50.0, 'California, USA', 'Discovery Energy',
  'Discovery Energy Announces Record-Low $118.50/kWh Battery Pricing for 50MW California Project',
  'https://energystoragenews.com/discovery-118-kwh-deal',
  'Energy Storage News', NOW() - INTERVAL '2 days',
  'Discovery Energy secured a landmark deal providing 50MW/200MWh battery storage at $118.50/kWh, setting a new benchmark for utility-scale LFP systems in California.',
  'Significant - This pricing undercuts previous California deals by 15% and signals continued cost reduction in LFP battery systems.',
  'declining', 95,
  'utility', 'lfp',
  140.00, -15.36, true,
  true
),
(
  'battery_mwh', 'good_deal', 485000, 'mwh',
  'Texas Grid Stabilization Project', 100.0, 'Texas, USA', 'LiON Energy',
  'LiON Energy Wins $48.5M Texas BESS Contract',
  'https://utilitydive.com/lion-texas-contract',
  'Utility Dive', NOW() - INTERVAL '5 days',
  'LiON Energy awarded contract for 100MW/400MWh system at $485k/MWh total installed cost for ERCOT grid services.',
  'Moderate - Competitive pricing for Texas market, includes 15-year warranty and performance guarantees.',
  'stable', 88,
  'utility', 'lfp',
  520000, -6.73, true,
  true
),
(
  'battery_kwh', 'info', 165.00, 'kwh',
  'Commercial Building Portfolio Storage', 5.0, 'New York, USA', 'SimpliPhi Power',
  'SimpliPhi Powers 50-Building Portfolio in NYC',
  'https://commercialobserver.com/simpliphi-nyc',
  'Commercial Observer', NOW() - INTERVAL '1 week',
  'SimpliPhi deployed 5MW of modular battery storage across 50 commercial buildings at $165/kWh for demand response.',
  'Limited - Small commercial systems typically command premium pricing. Good for reference but not indicative of utility-scale trends.',
  'stable', 72,
  'commercial', 'lfp',
  170.00, -2.94, true,
  true
);

-- =====================================================
-- COMPLETE!
-- =====================================================

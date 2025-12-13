-- Add INSERT policies for AI Data Collection tables
-- These allow the anon key to insert data for automated collection

-- Battery Pricing - Allow inserts
CREATE POLICY "Allow public insert access" ON battery_pricing 
  FOR INSERT 
  WITH CHECK (true);

-- Product Catalog - Allow inserts
CREATE POLICY "Allow public insert access" ON product_catalog 
  FOR INSERT 
  WITH CHECK (true);

-- Financing Options - Allow inserts
CREATE POLICY "Allow public insert access" ON financing_options 
  FOR INSERT 
  WITH CHECK (true);

-- Industry News - Allow inserts
CREATE POLICY "Allow public insert access" ON industry_news 
  FOR INSERT 
  WITH CHECK (true);

-- Incentive Programs - Allow inserts
CREATE POLICY "Allow public insert access" ON incentive_programs 
  FOR INSERT 
  WITH CHECK (true);

-- Data Collection Log - Allow inserts
CREATE POLICY "Allow public insert access" ON data_collection_log 
  FOR INSERT 
  WITH CHECK (true);

-- Configuration Best Practices - Allow inserts
CREATE POLICY "Allow public insert access" ON configuration_best_practices 
  FOR INSERT 
  WITH CHECK (true);

-- Also add UPDATE policies for upsert operations
CREATE POLICY "Allow public update access" ON battery_pricing 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow public update access" ON product_catalog 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow public update access" ON financing_options 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow public update access" ON industry_news 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow public update access" ON incentive_programs 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow public update access" ON data_collection_log 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow public update access" ON configuration_best_practices 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

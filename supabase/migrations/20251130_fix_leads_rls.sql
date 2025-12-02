-- Fix RLS policy for leads table to allow anonymous inserts
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fvmpmozybmtzjvikrctq/sql

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;

-- Create new policy that actually allows anon inserts
CREATE POLICY "Allow anonymous lead inserts" ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Also allow service_role full access
CREATE POLICY "Service role full access" ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify the policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'leads';

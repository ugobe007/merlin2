-- ========================================
-- BACKUP SCRIPT - Run BEFORE deploying MASTER_SCHEMA.sql
-- ========================================
-- Purpose: Create backups of existing tables before migration
-- Date: November 2025
-- 
-- INSTRUCTIONS:
-- 1. Connect to Supabase SQL Editor
-- 2. Run this entire script
-- 3. Verify backups were created
-- 4. Then proceed with MASTER_SCHEMA deployment
-- ========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_nov2025;

-- ========================================
-- BACKUP EXISTING TABLES
-- ========================================

-- Backup pricing_configurations (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pricing_configurations') THEN
        EXECUTE 'CREATE TABLE backup_nov2025.pricing_configurations_old AS SELECT * FROM pricing_configurations';
        RAISE NOTICE '✓ Backed up pricing_configurations';
    ELSE
        RAISE NOTICE '⚠ pricing_configurations table does not exist - skipping backup';
    END IF;
END $$;

-- Backup use_cases (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'use_cases') THEN
        EXECUTE 'CREATE TABLE backup_nov2025.use_cases_old AS SELECT * FROM use_cases';
        RAISE NOTICE '✓ Backed up use_cases';
    ELSE
        RAISE NOTICE '⚠ use_cases table does not exist - skipping backup';
    END IF;
END $$;

-- Backup calculation_formulas (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calculation_formulas') THEN
        EXECUTE 'CREATE TABLE backup_nov2025.calculation_formulas_old AS SELECT * FROM calculation_formulas';
        RAISE NOTICE '✓ Backed up calculation_formulas';
    ELSE
        RAISE NOTICE '⚠ calculation_formulas table does not exist - skipping backup';
    END IF;
END $$;

-- Backup projects (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects') THEN
        EXECUTE 'CREATE TABLE backup_nov2025.projects_old AS SELECT * FROM projects';
        RAISE NOTICE '✓ Backed up projects';
    ELSE
        RAISE NOTICE '⚠ projects table does not exist - skipping backup';
    END IF;
END $$;

-- Backup market_pricing_data (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'market_pricing_data') THEN
        EXECUTE 'CREATE TABLE backup_nov2025.market_pricing_data_old AS SELECT * FROM market_pricing_data';
        RAISE NOTICE '✓ Backed up market_pricing_data';
    ELSE
        RAISE NOTICE '⚠ market_pricing_data table does not exist - skipping backup';
    END IF;
END $$;

-- ========================================
-- VERIFY BACKUPS
-- ========================================

-- List all backup tables
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'backup_nov2025'
ORDER BY tablename;

-- Show row counts
DO $$
DECLARE
    r RECORD;
    cnt INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BACKUP VERIFICATION - Row Counts';
    RAISE NOTICE '========================================';
    
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'backup_nov2025'
        ORDER BY tablename
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM backup_nov2025.%I', r.tablename) INTO cnt;
        RAISE NOTICE '% rows in %', cnt, r.tablename;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Backup complete!';
    RAISE NOTICE 'Next step: Deploy MASTER_SCHEMA.sql';
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ========================================
/*
IF SOMETHING GOES WRONG, run these commands to restore:

-- Drop new tables
DROP TABLE IF EXISTS pricing_configurations CASCADE;
DROP TABLE IF EXISTS use_cases CASCADE;
DROP TABLE IF EXISTS calculation_formulas CASCADE;

-- Restore from backup
CREATE TABLE pricing_configurations AS SELECT * FROM backup_nov2025.pricing_configurations_old;
CREATE TABLE use_cases AS SELECT * FROM backup_nov2025.use_cases_old;
CREATE TABLE calculation_formulas AS SELECT * FROM backup_nov2025.calculation_formulas_old;

-- Then re-create indexes and constraints as needed
*/

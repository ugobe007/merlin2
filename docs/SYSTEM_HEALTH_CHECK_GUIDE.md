# System Health Check Guide

**Created:** January 3, 2025  
**Purpose:** Comprehensive health monitoring for all Merlin system components

---

## Overview

The System Health Check service provides automated testing and validation of:

1. **Backend Scraper Health** - RSS feed parsing and data collection
2. **Parsing Logic** - Price extraction, topic classification, equipment detection
3. **Database Schemas** - Table existence and structure validation
4. **SSOT Compliance** - Single Source of Truth calculation validation
5. **Workflow Links** - Critical path smoke tests
6. **TrueQuote Compliance** - Benchmark audit data validation
7. **Nested Calculations** - Detection of errant or nested number issues
8. **Template Formats** - Energy loads, usage profiles, industry standards
9. **Wizard Functionality** - Question ordering, data integrity
10. **Quote Engine** - Financial model calculations
11. **Merlin Metrics** - Calibration data and validation frequency

---

## Accessing the Health Dashboard

### Method 1: Admin Dashboard UI

1. Access admin panel: Click the ⚙️ button (bottom-right) or use `Ctrl+Shift+A`
2. Navigate to **"System Health"** tab (second tab, after Dashboard)
3. View real-time health status for all components
4. Click any check card to expand details
5. Enable auto-refresh for continuous monitoring

### Method 2: Command Line Script

```bash
# Run health check
node scripts/run-health-check.mjs

# Save report to database
node scripts/run-health-check.mjs --save-report

# Output JSON format
node scripts/run-health-check.mjs --json
```

---

## Health Check Categories

### 1. Backend Scraper Health

**What it checks:**
- Active RSS feed sources
- Recent scrape job success rate
- Time since last successful scrape

**Status Indicators:**
- ✅ **Pass**: Active sources found, >70% success rate, last scrape <48 hours ago
- ⚠️ **Warning**: Last scrape >48 hours ago
- ❌ **Fail**: <70% success rate or no active sources

**Details shown:**
- Number of active sources
- Success rate percentage
- Hours since last scrape
- Recent job count

---

### 2. Parsing Logic

**What it checks:**
- Price extraction rate from articles
- Topic classification rate
- Equipment mention detection rate

**Status Indicators:**
- ✅ **Pass**: >70% average extraction rate
- ⚠️ **Warning**: 50-70% extraction rate
- ❌ **Fail**: <50% extraction rate

**Details shown:**
- Total articles analyzed
- Price extraction percentage
- Topic extraction percentage
- Equipment extraction percentage

---

### 3. Database Schemas

**What it checks:**
- Critical tables exist (`use_cases`, `custom_questions`, `pricing_configurations`, etc.)
- Tables are accessible
- No schema errors

**Status Indicators:**
- ✅ **Pass**: All critical tables exist and accessible
- ⚠️ **Warning**: Some tables have access issues
- ❌ **Fail**: Missing critical tables

**Details shown:**
- Number of tables checked
- Missing tables list
- Schema issues list

---

### 4. SSOT Compliance

**What it checks:**
- Quote generation uses SSOT services
- Calculations match industry benchmarks
- Validation warnings/errors

**Status Indicators:**
- ✅ **Pass**: Score ≥90%, no critical warnings
- ⚠️ **Warning**: Score 70-89%, some warnings
- ❌ **Fail**: Score <70% or critical errors

**Details shown:**
- Validation score
- Number of warnings
- Number of errors
- Full validation details

---

### 5. Workflow Links

**What it checks:**
- Critical workflow paths are accessible
- Routes are properly configured

**Status Indicators:**
- ✅ **Pass**: All paths accessible
- ⚠️ **Warning**: Some paths have issues

**Details shown:**
- Tested paths count
- Passed paths count

---

### 6. TrueQuote Compliance

**What it checks:**
- Benchmark audit data exists
- Source attribution present
- Assumptions documented

**Status Indicators:**
- ✅ **Pass**: All TrueQuote data present (100%)
- ⚠️ **Warning**: Incomplete data (50-99%)
- ❌ **Fail**: Missing critical data (<50%)

**Details shown:**
- Has benchmark audit
- Has sources
- Has assumptions
- Source count

---

### 7. Calculation Logic

**What it checks:**
- Multiple quote calculations for consistency
- No zero/negative costs
- No unrealistic values (e.g., payback >50 years)

**Status Indicators:**
- ✅ **Pass**: All calculations valid
- ⚠️ **Warning**: 1-2 issues found
- ❌ **Fail**: 3+ issues found

**Details shown:**
- Test cases run
- Issues list

---

### 8. Template Formats

**What it checks:**
- Use case templates have valid structure
- Power profiles exist
- Equipment arrays valid
- Financial params present

**Status Indicators:**
- ✅ **Pass**: All templates valid
- ⚠️ **Warning**: 1-3 template issues
- ❌ **Fail**: 4+ template issues

**Details shown:**
- Use cases checked
- Issues list

---

### 9. Wizard Functionality

**What it checks:**
- Question data integrity
- No duplicate display orders
- All questions have text

**Status Indicators:**
- ✅ **Pass**: No issues
- ⚠️ **Warning**: 1 issue
- ❌ **Fail**: 2+ issues

**Details shown:**
- Total questions
- Issues list

---

### 10. Quote Engine

**What it checks:**
- Financial calculations reasonable
- NPV, IRR, payback in valid ranges
- Costs are positive

**Status Indicators:**
- ✅ **Pass**: All calculations valid
- ⚠️ **Warning**: 1 issue
- ❌ **Fail**: 2+ issues

**Details shown:**
- Test cases run
- Issues list

---

### 11. Merlin Metrics

**What it checks:**
- Calibration data exists
- Last validation timestamp
- Frequency of validation runs

**Status Indicators:**
- ✅ **Pass**: Calibrated, validated within 24 hours
- ⚠️ **Warning**: Last validation >24 hours ago (consider daily)
- ⚠️ **Warning**: Last validation >7 days ago (should be weekly)

**Details shown:**
- Has calibration data
- Hours since last validation
- Calibration records count

---

## Overall Health Status

The dashboard calculates an overall health score (0-100%) based on all checks:

- **Healthy** (≥90%, no failures): System operating normally
- **Degraded** (70-89%, no errors): Some issues detected, but system functional
- **Critical** (<70% or errors): Immediate attention required

---

## Daily/Weekly Calibration

### Recommended Schedule

**Daily Checks:**
- Backend Scraper Health
- Parsing Logic
- Calculation Logic
- Quote Engine

**Weekly Checks:**
- Database Schemas
- SSOT Compliance
- TrueQuote Compliance
- Template Formats
- Wizard Functionality
- Merlin Metrics

### Automated Scheduling

Set up a cron job or scheduled task:

```bash
# Daily health check (9 AM)
0 9 * * * cd /path/to/merlin2 && node scripts/run-health-check.mjs --save-report

# Weekly full report (Monday 8 AM)
0 8 * * 1 cd /path/to/merlin2 && node scripts/run-health-check.mjs --save-report --json > weekly-report.json
```

---

## Troubleshooting

### Low Scraper Health

1. Check RSS feed URLs are still valid
2. Verify network connectivity
3. Review scrape job logs in database
4. Check `market_data_sources` table for active sources

### Parsing Quality Issues

1. Review recent scraped articles
2. Check price extraction patterns
3. Verify classification logic
4. Update regex patterns if needed

### Schema Mismatches

1. Run database migrations
2. Check migration logs
3. Verify table structures match expected schema
4. Review `database/migrations/` directory

### SSOT Compliance Failures

1. Check calculation services are using SSOT
2. Review validation warnings
3. Verify benchmark data is current
4. Check `calculation_constants` table

### TrueQuote Issues

1. Ensure `benchmarkAudit` is generated in quotes
2. Verify source attribution is populated
3. Check assumptions are documented
4. Review `QuoteEngine.generateQuote()` output

---

## API Usage

### Programmatic Access

```typescript
import { runSystemHealthCheck } from '@/services/systemHealthCheck';

// Run full health check
const report = await runSystemHealthCheck();

console.log(`Overall Status: ${report.overallStatus}`);
console.log(`Score: ${report.overallScore}%`);

// Check specific category
import { checkBackendScraperHealth } from '@/services/systemHealthCheck';
const scraperHealth = await checkBackendScraperHealth();
```

---

## Best Practices

1. **Run daily checks** for critical components (scraper, calculations)
2. **Review weekly reports** for trends and patterns
3. **Set up alerts** for critical status changes
4. **Document issues** found during health checks
5. **Track improvements** over time
6. **Calibrate metrics** weekly to ensure accuracy

---

## Support

For issues or questions:
- Check health check details in dashboard
- Review service logs
- Check database for error records
- Contact development team


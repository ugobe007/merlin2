# Industry Standards Quarterly Review Process

## Overview
This document outlines the quarterly review process for maintaining industry standard configurations in `src/config/industryStandards.ts`. Regular reviews ensure our energy storage sizing recommendations remain current with industry best practices and technological advances.

## Review Schedule
- **Q1 Review**: January (covers Q4 previous year updates)
- **Q2 Review**: April (covers Q1 updates)
- **Q3 Review**: July (covers Q2 updates)
- **Q4 Review**: October (covers Q3 updates)

**Next Review Due: January 2026** (for 2025-Q4 data)

## Review Checklist

### 1. Check Data Source Updates

#### NREL ATB (Annual Technology Baseline)
- **URL**: https://atb.nrel.gov/
- **Check for**: Annual updates (typically released Q2-Q3)
- **Focus Areas**: 
  - Battery energy storage costs
  - Commercial building reference models
  - Power capacity factors by industry type

#### ASHRAE 90.1 (Equipment Standards)
- **URL**: https://www.ashrae.org/technical-resources/bookstore/standard-90-1
- **Check for**: New versions or addenda (updates every 3 years)
- **Focus Areas**:
  - HVAC system sizing
  - Lighting power density
  - Building envelope requirements

#### IEEE 2450 (BESS Standards)
- **URL**: https://standards.ieee.org/standard/2450-2019.html
- **Check for**: New versions or technical corrections
- **Focus Areas**:
  - Battery system performance metrics
  - Safety requirements
  - Grid integration standards

#### DOE/EIA CBECS (Commercial Buildings Energy Consumption Survey)
- **URL**: https://www.eia.gov/consumption/commercial/
- **Check for**: New survey data (released every 4-5 years)
- **Focus Areas**:
  - Energy intensity by building type
  - Peak demand profiles
  - Regional variations

#### APPA (Higher Education Facilities)
- **URL**: https://www.appa.org/
- **Check for**: Annual facility reports and benchmarks
- **Focus Areas**:
  - Campus energy consumption
  - Utility cost trends
  - Sustainability initiatives

#### Uptime Institute (Data Center Standards)
- **URL**: https://uptimeinstitute.com/
- **Check for**: Annual data center surveys and tier updates
- **Focus Areas**:
  - Power usage effectiveness (PUE)
  - Redundancy requirements
  - Capacity planning

### 2. Review Industry-Specific Changes

For each industry type, check:
- [ ] Have typical system sizes changed?
- [ ] Are new technologies impacting power requirements?
- [ ] Have regulatory requirements changed?
- [ ] Are there new use cases to add?

### 3. Validate Current Values

Run validation checks:
```bash
# In your development environment
npm run dev
# Check console for validation warnings
```

Review validation output:
- All profiles pass `validateIndustryProfile()`
- No warnings from `validateConfigurationConsistency()`
- All three systems (baseline, AI optimal, template) remain aligned

### 4. Update Configuration

If changes are needed:

1. **Update values** in `src/config/industryStandards.ts`
2. **Update lastUpdated** field to current quarter (e.g., "2026-Q1")
3. **Document changes** in git commit message:
   ```
   Update industry standards for 2026-Q1
   
   Changes:
   - Hotel: Updated basePowerMW from 1.5 to 1.7 MW per NREL ATB 2026
   - Data Center: Updated solarRatio from 0.8 to 0.9 per Uptime Institute Report
   
   Sources:
   - NREL ATB 2026 (released March 2026)
   - Uptime Institute Data Center Survey 2025
   ```

### 5. Regression Testing

After updates:
- [ ] Run TypeScript compilation: `npm run build`
- [ ] Test Smart Wizard with updated values
- [ ] Test AI Wizard recommendations
- [ ] Verify template defaults load correctly
- [ ] Check for any calculation inconsistencies

### 6. Documentation

Update this file:
- [ ] Mark review as complete with date
- [ ] Note any significant changes
- [ ] Set next review date

## Review History

### 2025-Q4 (Initial Version)
- **Date**: November 10, 2025
- **Reviewer**: @copilot
- **Changes**: 
  - Initial centralized configuration created
  - Aligned all three calculation systems
  - Added comprehensive documentation
- **Next Review**: January 2026

### Template for Future Reviews

```markdown
### YYYY-QN
- **Date**: [Review Date]
- **Reviewer**: [Name]
- **Changes**: 
  - [List of changes]
- **Notes**: [Any important observations]
- **Next Review**: [Next quarter]
```

## Quick Reference: Key Metrics to Watch

| Industry | Current Baseline (MW) | Watch For |
|----------|----------------------|-----------|
| Hotel | 1.5 per 100 rooms | Guest energy usage trends, EV charging adoption |
| Hospital | 2.5 per 100 beds | Medical equipment advances, resilience requirements |
| Data Center | 2.0 per MW IT load | PUE improvements, AI workload growth |
| EV Charging | 0.5 per charger | Fast charging adoption, grid integration |
| Manufacturing | 2.0 per line | Process electrification, efficiency gains |

## Contact & Resources

- **Configuration File**: `src/config/industryStandards.ts`
- **Validation Code**: Same file, see `validateIndustryProfile()` and `runStartupValidation()`
- **Industry Pricing**: `src/utils/industryPricing.ts` (separate quarterly review)

## Automated Reminders

Set calendar reminders:
- **January 15**: Q1 Review Due
- **April 15**: Q2 Review Due
- **July 15**: Q3 Review Due
- **October 15**: Q4 Review Due

## Questions?

If you're unsure about a value or source:
1. Check the original source documentation (URLs in code comments)
2. Look for peer-reviewed publications
3. Consider consulting with industry experts
4. Document assumptions and reasoning in commit messages

---

**Last Updated**: November 10, 2025  
**Next Review**: January 2026  
**Version**: 1.0

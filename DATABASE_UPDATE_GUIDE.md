# Merlin Database Update Guide

## 📊 Data Tables Requiring Regular Updates

This document tracks all database tables that need periodic updates and their authoritative data sources.

---

## 🔴 HIGH FREQUENCY (Monthly/Quarterly)

### 1. `iso_market_prices` - Ancillary Services Revenue
| Field | Value |
|-------|-------|
| **Update Frequency** | Monthly |
| **Primary Source** | ISO/RTO Websites |
| **Why It Matters** | Ancillary service prices (frequency regulation, spinning reserve) fluctuate significantly |

**Data Sources by Region:**
| ISO | URL | Data Type |
|-----|-----|-----------|
| CAISO | https://www.caiso.com/market/Pages/ReportsBulletins/default.aspx | OASIS Reports |
| ERCOT | https://www.ercot.com/mktinfo/prices | Real-time/DA Prices |
| PJM | https://dataminer2.pjm.com/list | Regulation, Capacity |
| NYISO | https://www.nyiso.com/markets | Ancillary Services |
| ISO-NE | https://www.iso-ne.com/markets-operations | Regulation Clearing |
| MISO | https://www.misoenergy.org/markets-and-operations/ | Market Reports |

---

### 2. `equipment_vendors` - Battery & Inverter Pricing
| Field | Value |
|-------|-------|
| **Update Frequency** | Quarterly |
| **Primary Source** | NREL ATB + Vendor Websites |
| **Why It Matters** | Battery prices drop 10-15% annually; vendor specs change |

**Data Sources:**
| Source | URL | Data |
|--------|-----|------|
| NREL ATB | https://atb.nrel.gov/ | Battery cost projections |
| BloombergNEF | https://about.bnef.com/ | Battery price index (paid) |
| Tesla | https://www.tesla.com/megapack | Megapack specs |
| BYD | https://www.byd.com/us/battery | Cube-T pricing |
| CATL | https://www.catl.com/en/solution/ | EnerOne specs |
| Fluence | https://fluenceenergy.com/products/ | Gridstack pricing |

---

### 3. `ev_charger_catalog` - EV Charger Costs
| Field | Value |
|-------|-------|
| **Update Frequency** | Quarterly |
| **Primary Source** | NREL AFDC |
| **Why It Matters** | Hardware costs vary; new models released |

**Data Sources:**
| Source | URL | Data |
|--------|-----|------|
| NREL AFDC | https://afdc.energy.gov/fuels/electricity_infrastructure.html | Cost estimates |
| ChargePoint | https://www.chargepoint.com/businesses | Commercial pricing |
| ABB | https://new.abb.com/ev-charging | Terra series |
| Tritium | https://tritiumcharging.com/products/ | RTM/PKM series |
| ChargerHelp | https://www.chargerhelp.com/ | Installation data |

---

### 4. `state_incentives` - Rebates & Tax Credits
| Field | Value |
|-------|-------|
| **Update Frequency** | Quarterly |
| **Primary Source** | DSIRE Database |
| **Why It Matters** | Programs expire, funding depletes, new programs launch |

**Data Sources:**
| Source | URL | Data |
|--------|-----|------|
| DSIRE | https://www.dsireusa.org/ | All incentives |
| SGIP (CA) | https://www.selfgenca.com/ | California storage |
| NYSERDA | https://www.nyserda.ny.gov/All-Programs | New York programs |
| MassCEC | https://www.masscec.com/programs | Massachusetts |
| CT Green Bank | https://www.ctgreenbank.com/ | Connecticut |

**Key Programs to Monitor:**
- CA SGIP - Check funding levels quarterly
- MA SMART - Monitor block pricing
- NY VDER - Track tariff changes
- NJ Storage - Check budget availability

---

## 🟡 MEDIUM FREQUENCY (Semi-Annual/Annual)

### 5. `utility_rates` - Electricity Rates
| Field | Value |
|-------|-------|
| **Update Frequency** | Annually (June) |
| **Primary Source** | EIA |
| **Why It Matters** | Rates affect all ROI calculations |

**Data Sources:**
| Source | URL | Data |
|--------|-----|------|
| EIA State Profiles | https://www.eia.gov/electricity/state/ | State averages |
| EIA 861 | https://www.eia.gov/electricity/data/eia861/ | Utility-specific |
| OpenEI | https://openei.org/wiki/Utility_Rate_Database | Rate schedules |
| PG&E | https://www.pge.com/tariffs/ | California TOU |
| SCE | https://www.sce.com/regulatory/tariff-books | SoCal rates |
| ConEd | https://www.coned.com/en/accounts-billing/your-bill/rate-calculator | NYC rates |

---

### 6. `calculation_constants` - Financial Parameters
| Field | Value |
|-------|-------|
| **Update Frequency** | Annually (January) |
| **Primary Source** | IRS / DOE |
| **Why It Matters** | ITC rates, bonus depreciation change with tax law |

**Data Sources:**
| Source | URL | Data |
|--------|-----|------|
| IRS ITC | https://www.irs.gov/credits-deductions/businesses/investment-tax-credit-itc | Current ITC rate |
| DOE Solar | https://www.energy.gov/eere/solar/federal-tax-credits-solar-manufacturers | IRA credits |
| IRS Pub 946 | https://www.irs.gov/pub/irs-pdf/p946.pdf | MACRS rates |
| Fed Reserve | https://www.federalreserve.gov/releases/h15/ | Discount rate reference |

---

### 7. `depreciation_schedules` - MACRS Tables
| Field | Value |
|-------|-------|
| **Update Frequency** | Annually / When tax law changes |
| **Primary Source** | IRS Publication 946 |
| **Why It Matters** | Bonus depreciation phases down (60%→40%→20%) |

**Key Dates:**
| Year | Bonus Depreciation |
|------|-------------------|
| 2024 | 60% |
| 2025 | 40% |
| 2026 | 20% |
| 2027+ | 0% |

---

## 🟢 LOW FREQUENCY (As Needed)

### 8. `use_cases` & `use_case_configurations`
| Field | Value |
|-------|-------|
| **Update Frequency** | As new industries added |
| **Primary Source** | ASHRAE, CBECS |
| **Why It Matters** | Industry power profiles for sizing |

---

## 📋 Update Checklist Template

### Quarterly Update (Mar, Jun, Sep, Dec)
- [ ] `iso_market_prices` - Pull latest ISO reports
- [ ] `equipment_vendors` - Check vendor pricing pages
- [ ] `ev_charger_catalog` - Review NREL AFDC updates
- [ ] `state_incentives` - Check DSIRE for program changes
- [ ] Run verification queries to confirm data integrity

### Annual Update (January)
- [ ] `utility_rates` - Import new EIA data
- [ ] `calculation_constants` - Update ITC/bonus depreciation
- [ ] `depreciation_schedules` - Verify MACRS hasn't changed
- [ ] Archive previous year's data for comparison

---

## 🔄 SQL Queries for Updates

### Check Data Freshness
```sql
SELECT table_name, 
       update_frequency,
       last_updated,
       next_update_due,
       CASE 
         WHEN next_update_due < CURRENT_DATE THEN '🔴 OVERDUE'
         WHEN next_update_due < CURRENT_DATE + INTERVAL '7 days' THEN '🟡 DUE SOON'
         ELSE '🟢 OK'
       END as status
FROM data_update_schedule
ORDER BY next_update_due;
```

### Mark Table as Updated
```sql
UPDATE data_update_schedule
SET last_updated = NOW(),
    next_update_due = CASE update_frequency
      WHEN 'monthly' THEN CURRENT_DATE + INTERVAL '1 month'
      WHEN 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months'
      WHEN 'annually' THEN CURRENT_DATE + INTERVAL '1 year'
    END,
    updated_at = NOW()
WHERE table_name = 'TABLE_NAME_HERE';
```

---

## 🌐 API Integration Opportunities

Future automation candidates:
1. **EIA API** - https://api.eia.gov/ - State electricity prices
2. **NREL Developer API** - https://developer.nrel.gov/ - PVWatts, Utility rates
3. **OpenEI API** - https://openei.org/services/ - Utility rate database
4. **ISO APIs** - Various - Real-time market prices

---

## 📞 Contact for Data Questions

- **Utility Rates**: EIA Electricity Team - infoctr@eia.gov
- **Incentives**: DSIRE Support - dsirehelp@ncsu.edu
- **Equipment**: NREL ATB Team - atb@nrel.gov
- **Market Prices**: Contact individual ISOs

---

*Last Updated: December 2, 2025*
*Next Review: March 1, 2025*

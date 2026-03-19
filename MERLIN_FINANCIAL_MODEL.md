# Merlin Financial Model: Excel/Google Sheets Blueprint

**Purpose:** 3-year financial projections for investor due diligence  
**Format:** Excel or Google Sheets with multiple tabs  
**Date:** March 2026  
**Use:** Investor meetings, fundraising conversations, internal planning

---

## 📊 SPREADSHEET STRUCTURE

### Tabs to Create:

1. **Dashboard** - Executive summary with key metrics
2. **Revenue Model** - Detailed revenue projections
3. **Cost Structure** - All expenses by category
4. **P&L Statement** - Profit & Loss by month/quarter
5. **Cash Flow** - Monthly cash in/out
6. **Unit Economics** - CAC, LTV, payback, margins
7. **Scenarios** - Base, Conservative, Aggressive
8. **Cap Table** - Equity ownership and dilution
9. **Assumptions** - All inputs and drivers

---

## TAB 1: DASHBOARD

### Layout:

```
┌─────────────────────────────────────────────────────────────┐
│              MERLIN FINANCIAL DASHBOARD                     │
│              Last Updated: March 2026                       │
└─────────────────────────────────────────────────────────────┘

KEY METRICS (18-Month Projections)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Revenue:
  Month 6:    $110,000
  Month 12:   $1,300,000
  Month 18:   $3,900,000

Customers:
  Month 6:    50 enterprise + 5,000 leads
  Month 12:   100 enterprise + 25,000 leads
  Month 18:   200 enterprise + 50,000 leads

Unit Economics:
  CAC:        $500
  LTV:        $5,000+
  LTV/CAC:    10:1
  Payback:    14 months
  Gross Margin: 85%

Fundraising:
  Raising:    $500K - $1.5M
  Use:        60% Team, 30% Customer Acq, 10% Product
  Runway:     18 months
  Next Round: Series A @ $3M ARR

CHARTS:
[Line chart: Revenue growth over 18 months]
[Bar chart: MRR breakdown (SaaS vs Lead Gen)]
[Pie chart: Use of funds]
```

### Key Cells to Create:

```excel
Revenue (Month 18):     =SUM(Revenue!M1:M18)
Total Customers:        =SUM(Revenue!C2:C19)
Burn Rate:              =AVERAGE(CashFlow!O2:O19)
Cash Remaining:         =CashFlow!P19
Months of Runway:       =P4/P3
```

---

## TAB 2: REVENUE MODEL

### Column Structure (Months 1-36):

| Month | M1  | M2  | M3  | M4  | M5  | M6  | ... | M18 | M24 | M36 |
| ----- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Revenue Streams:

#### A. MERLIN PRO (B2B SaaS)

```
Row 1:  New Customers Added
Row 2:  Churned Customers
Row 3:  Total Active Customers (Cumulative)
Row 4:  Average Contract Value (ACV)
Row 5:  MRR from SaaS
```

**Formulas:**

```excel
C3:  =C1-C2+B3    (Cumulative customers)
C4:  =$B$4        (Fixed ACV, reference from Assumptions tab)
C5:  =C3*C4       (MRR = Customers × ACV)
```

**Assumptions to Use:**

```
Starting ACV: $500/month (blended average of $299-999 tiers)
Month 1-3: 5 customers/month (VP Sales ramping)
Month 4-6: 10 customers/month (SDRs onboarded)
Month 7-12: 15 customers/month (full team)
Month 13-18: 20 customers/month (scaling)
Churn rate: 2% monthly
```

**Sample Data:**

```
Month:        1    2    3    4    5    6    7    8    9   10   11   12
New Cust:     5    5    5   10   10   10   15   15   15   15   15   15
Churned:      0    0    0    0    0    1    1    1    1    2    2    2
Active:       5   10   15   25   35   44   58   72   86  99  112  125
ACV:        500  500  500  500  500  500  500  500  500  500  500  500
MRR:      2,500 5,000 7,500 12,500 17,500 22,000 29,000 36,000 43,000 49,500 56,000 62,500
```

#### B. SMB VERTICAL LEAD GENERATION

```
Row 6:  New Leads Generated
Row 7:  Lead Conversion Rate (%)
Row 8:  Qualified Leads
Row 9:  Average Lead Price
Row 10: Lead Gen Revenue
```

**Formulas:**

```excel
C8:  =C6*C7       (Qualified leads = Total × Conversion)
C10: =C8*C9       (Revenue = Qualified Leads × Price)
```

**Assumptions:**

```
Average lead price: $75 (blended $50-150)
Month 1-3: 100 leads/month (SEO ramping)
Month 4-6: 500 leads/month (verticals launching)
Month 7-12: 2,000 leads/month (SEO paying off)
Month 13-18: 4,000 leads/month (18 verticals mature)
Conversion rate: 60% (qualified leads)
```

**Sample Data:**

```
Month:           1    2    3    4    5    6    7    8    9   10   11   12
Total Leads:   100  200  300  500  750 1000 2000 2000 2000 2000 2000 2000
Qualified:      60  120  180  300  450  600 1200 1200 1200 1200 1200 1200
Price:          75   75   75   75   75   75   75   75   75   75   75   75
Revenue:     4,500 9,000 13,500 22,500 33,750 45,000 90,000 90,000 90,000 90,000 90,000 90,000
```

#### C. EMBEDDED FINANCING

```
Row 11: Projects Financed
Row 12: Average Project Size
Row 13: Revenue Share (%)
Row 14: Financing Revenue
```

**Formulas:**

```excel
C14: =C11*C12*C13    (Projects × Size × %)
```

**Assumptions:**

```
Revenue share: 1.5%
Month 1-6: 0 projects (partnerships forming)
Month 7-12: 5 projects/month @ $500K avg
Month 13-18: 10 projects/month @ $600K avg
```

#### D. TOTAL REVENUE

```
Row 15: Total Monthly Revenue
Row 16: MoM Growth Rate (%)
Row 17: Cumulative Revenue (YTD)
```

**Formulas:**

```excel
C15: =C5+C10+C14           (Sum all revenue streams)
C16: =(C15-B15)/B15        (Month-over-month growth)
C17: =SUM($B$15:C15)       (Year-to-date cumulative)
```

**18-Month Revenue Summary:**

```
Month 6:  MRR: $22K  | Lead Gen: $45K  | Financing: $0    | Total: $67K
Month 12: MRR: $63K  | Lead Gen: $90K  | Financing: $38K  | Total: $191K
Month 18: MRR: $100K | Lead Gen: $150K | Financing: $90K  | Total: $340K
```

---

## TAB 3: COST STRUCTURE

### Categories:

#### A. COST OF GOODS SOLD (COGS)

```
Row 1:  AWS/Hosting (Fly.io)
Row 2:  API Costs (Google Maps, weather)
Row 3:  Supabase Database
Row 4:  Total COGS
Row 5:  Gross Margin (%)
```

**Formulas:**

```excel
C4:  =SUM(C1:C3)
C5:  =(Revenue!C15-C4)/Revenue!C15
```

**Assumptions:**

```
Hosting: $500/month base + $10 per 1000 quotes
API costs: $200/month base + $5 per 1000 quotes
Database: $100/month + $0.50 per GB
Target gross margin: 85%
```

#### B. SALES & MARKETING (S&M)

```
Row 6:  VP Sales Salary
Row 7:  SDR Salaries (2 people)
Row 8:  Marketing Manager Salary
Row 9:  Advertising (Google, LinkedIn)
Row 10: Trade Shows & Events
Row 11: Sales Tools (Salesforce, etc.)
Row 12: Travel & Entertainment
Row 13: Total S&M
Row 14: S&M as % of Revenue
```

**Salaries:**

```
VP Sales: $120K/year ($10K/month) - starts Month 1
SDR 1: $60K/year ($5K/month) - starts Month 2
SDR 2: $60K/year ($5K/month) - starts Month 3
Marketing Mgr: $90K/year ($7.5K/month) - starts Month 3
```

**Marketing Spend:**

```
Month 1-3: $2K/month (bootstrap)
Month 4-6: $5K/month (paid ads start)
Month 7-12: $10K/month (scaling)
Month 13-18: $15K/month (aggressive growth)
```

**Trade Shows:**

```
RE+ 2026 (Month 8): $15K
Solar Power Intl (Month 10): $12K
Other events: $3K/quarter
```

#### C. RESEARCH & DEVELOPMENT (R&D)

```
Row 15: Backend Engineer Salary
Row 16: Frontend Engineer Salary
Row 17: Designer (Contract)
Row 18: Dev Tools (GitHub, etc.)
Row 19: Total R&D
Row 20: R&D as % of Revenue
```

**Engineering:**

```
Backend Engineer: $130K/year ($10.8K/month) - starts Month 6
Frontend Engineer: $120K/year ($10K/month) - starts Month 12
Designer (contract): $4K/month ongoing
Dev tools: $500/month
```

#### D. GENERAL & ADMINISTRATIVE (G&A)

```
Row 21: Founder Salary
Row 22: Office/Co-working
Row 23: Legal & Accounting
Row 24: Insurance
Row 25: Software Subscriptions
Row 26: Other G&A
Row 27: Total G&A
```

**G&A Costs:**

```
Founder salary: $0 (Month 1-12), $8K/month (Month 13+)
Office: $1K/month (co-working)
Legal: $2K/month
Accounting: $1K/month
Insurance: $500/month
Software: $1K/month (Slack, Notion, etc.)
```

#### E. TOTAL OPERATING EXPENSES

```
Row 28: Total OpEx
Row 29: OpEx as % of Revenue
Row 30: EBITDA
Row 31: EBITDA Margin (%)
```

**Formulas:**

```excel
C28: =C13+C19+C27         (S&M + R&D + G&A)
C29: =C28/Revenue!C15     (OpEx / Revenue)
C30: =Revenue!C15-C4-C28  (Revenue - COGS - OpEx)
C31: =C30/Revenue!C15     (EBITDA / Revenue)
```

---

## TAB 4: P&L STATEMENT

### Monthly P&L Structure:

```
                          M1      M2      M3      M6      M12     M18
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REVENUE
SaaS MRR                2,500   5,000   7,500   22,000  62,500  100,000
Lead Gen Revenue        4,500   9,000  13,500   45,000  90,000  150,000
Financing Revenue           0       0       0        0  37,500   90,000
─────────────────────────────────────────────────────────────────
Total Revenue           7,000  14,000  21,000   67,000 190,000  340,000

COST OF GOODS SOLD
Hosting & Infrastructure  600     650     700    1,200   2,500   4,000
API Costs                 250     300     350      600   1,200   1,800
Database                  150     180     220      400     800   1,200
─────────────────────────────────────────────────────────────────
Total COGS              1,000   1,130   1,270    2,200   4,500   7,000
─────────────────────────────────────────────────────────────────
GROSS PROFIT            6,000  12,870  19,730   64,800 185,500  333,000
Gross Margin %            86%     92%     94%      97%     98%     98%

OPERATING EXPENSES

Sales & Marketing
Salaries               10,000  15,000  22,500   30,000  35,000  40,000
Advertising             2,000   2,000   2,000    5,000  10,000  15,000
Trade Shows                 0       0       0    3,000  15,000   3,000
Tools & Software        1,000   1,000   1,000    1,500   2,000   2,500
Travel                    500     500     500    2,000   3,000   4,000
─────────────────────────────────────────────────────────────────
Total S&M              13,500  18,500  26,000   41,500  65,000  64,500

Research & Development
Engineering Salaries        0       0       0   10,800  21,600  21,600
Contract Designer       4,000   4,000   4,000    4,000   4,000   4,000
Dev Tools                 500     500     500      500     500     500
─────────────────────────────────────────────────────────────────
Total R&D               4,500   4,500   4,500   15,300  26,100  26,100

General & Admin
Founder Salary              0       0       0        0       0   8,000
Office/Co-working       1,000   1,000   1,000    1,000   1,000   1,000
Legal & Accounting      3,000   3,000   3,000    3,000   3,000   3,000
Insurance                 500     500     500      500     500     500
Software                1,000   1,000   1,000    1,000   1,000   1,000
─────────────────────────────────────────────────────────────────
Total G&A               5,500   5,500   5,500    5,500   5,500  13,500
─────────────────────────────────────────────────────────────────
Total Operating Expenses 23,500  28,500  36,000  62,300  96,600 104,100

EBITDA                (17,500)(15,630)(16,270)   2,500  88,900 228,900
EBITDA Margin %        -250%   -112%    -77%       4%     47%     67%

CASH FLOW
Beginning Cash         500,000 482,500 466,870
Net Cash Flow         (17,500)(15,630)(16,270)   2,500  88,900 228,900
Ending Cash           482,500 466,870 450,600  [calc] [calc] [calc]
```

---

## TAB 5: CASH FLOW STATEMENT

### Structure:

```
                          M1      M2      M3      M6      M12     M18
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CASH INFLOWS
SaaS Revenue (100% collected) 2,500   5,000   7,500   22,000  62,500  100,000
Lead Gen (90% collected)      4,050   8,100  12,150   40,500  81,000  135,000
Financing (100% collected)        0       0       0        0  37,500   90,000
Fundraising                 500,000       0       0        0       0  750,000*
─────────────────────────────────────────────────────────────────
Total Cash In              506,500  13,100  19,650   62,500 181,000  1,075,000

CASH OUTFLOWS
COGS                        1,000   1,130   1,270    2,200   4,500   7,000
Salaries                   14,000  19,000  26,500   44,800  60,600  73,600
Advertising                 2,000   2,000   2,000    5,000  10,000  15,000
Trade Shows                     0       0       0    3,000  15,000   3,000
Tools & Software            2,500   2,500   2,500    3,000   3,500   4,000
Travel                        500     500     500    2,000   3,000   4,000
Office & G&A                4,500   4,500   4,500    4,500   4,500  12,500
─────────────────────────────────────────────────────────────────
Total Cash Out             24,500  29,630  37,270   64,500 101,100 119,100

NET CASH FLOW             482,000 (16,530)(17,620)  (2,000) 79,900  955,900
Beginning Cash Balance          0 482,000 465,470  [calc] [calc] [calc]
Ending Cash Balance       482,000 465,470 447,850  [calc] [calc] [calc]

Burn Rate (if negative)      N/A  16,530  17,620    2,000     N/A     N/A
Months of Runway              N/A    28.2    25.4     [calc]  [calc]  [calc]
```

\*Assumes additional $750K raised at Month 18 for Series A bridge

---

## TAB 6: UNIT ECONOMICS

### Key Metrics:

```
CUSTOMER ACQUISITION COST (CAC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total S&M Spend (Quarterly):        $120,000
New Customers Acquired (Quarterly):  90 customers
CAC per Customer:                    $1,333

Blended CAC (SaaS + Leads):         $500
  - Enterprise CAC:                  $1,500
  - SMB Lead CAC:                    $50

LIFETIME VALUE (LTV)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Average Contract Value (ACV):       $500/month
Average Customer Lifetime:           36 months
Gross Margin:                        85%

LTV Calculation:
  $500/month × 36 months × 85% = $15,300

Conservative LTV (24-month):         $10,200
Aggressive LTV (48-month):          $20,400

LTV/CAC RATIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Base Case:    $15,300 / $1,333 = 11.5:1  ✅ Excellent
Conservative: $10,200 / $1,500 =  6.8:1  ✅ Good
Aggressive:   $20,400 / $1,000 = 20.4:1  ✅ Outstanding

Target: >3:1 (SaaS benchmark)
Status: Well above target

PAYBACK PERIOD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAC:                                 $1,333
Monthly Gross Profit per Customer:   $425 ($500 × 85%)

Payback Period:  $1,333 / $425 = 3.1 months  ✅ Excellent

Target: <12 months (SaaS benchmark)
Status: 4x better than benchmark

CHURN & RETENTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Monthly Churn Rate:                  2%
Annual Churn Rate:                   ~22%
Annual Retention Rate:               78%

Net Revenue Retention:               95%
  (Accounts for upsells offsetting churn)

Target: <5% monthly churn
Status: On target

COHORT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cohort: January 2026 (10 customers)
Month 1:  10 active ($5,000 MRR)
Month 3:   9 active ($4,500 MRR)
Month 6:   8 active ($4,000 MRR)
Month 12:  7 active ($3,500 MRR)

Revenue after 12 months:  $42,000
CAC investment:           $13,330
Net profit:               $28,670
ROI:                      215%
```

### Benchmarking:

```
METRIC          MERLIN    SAAS BENCHMARK    STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LTV/CAC         11.5:1      >3:1           ✅ Excellent
Payback         3.1 mo      <12 mo         ✅ Outstanding
Gross Margin    85%         70-80%         ✅ Above average
CAC             $1,333      Varies         ✅ Reasonable
Monthly Churn   2%          <5%            ✅ Good
```

---

## TAB 7: SCENARIOS

### Three Scenarios:

#### CONSERVATIVE CASE (50% slower growth)

```
                     M6        M12       M18
Customers:           25        50        100
Monthly Revenue:     $35K      $95K      $170K
Annual Run Rate:     $420K     $1.14M    $2.04M
Fundraise Amount:    $500K     -         -
```

#### BASE CASE (Current projections)

```
                     M6        M12       M18
Customers:           50        100       200
Monthly Revenue:     $67K      $190K     $340K
Annual Run Rate:     $800K     $2.28M    $4.08M
Fundraise Amount:    $1M       -         -
```

#### AGGRESSIVE CASE (2x growth)

```
                     M6        M12       M18
Customers:           100       200       400
Monthly Revenue:     $134K     $380K     $680K
Annual Run Rate:     $1.6M     $4.56M    $8.16M
Fundraise Amount:    $1.5M     -         $3M (Series A)
```

### Scenario Comparison Table:

```
METRIC                CONSERVATIVE    BASE        AGGRESSIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
18-Month Revenue      $2.04M          $4.08M      $8.16M
Customers (M18)       100             200         400
Monthly Churn         3%              2%          2%
CAC                   $750            $500        $400
Marketing Spend       $10K/mo         $15K/mo     $25K/mo
Team Size             8               12          18
Cash Remaining        $50K            $200K       $100K
Follow-on Funding     Yes (M15)       Yes (M20)   Yes (M18)
Probability           60%             70%         30%
```

### Sensitivity Analysis:

```
VARIABLE            -20%        BASE        +20%        IMPACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Customer Growth     $3.26M      $4.08M      $4.90M      High
Churn Rate          $4.49M      $4.08M      $3.67M      Medium
ACV                 $3.26M      $4.08M      $4.90M      High
CAC                 $4.28M      $4.08M      $3.88M      Medium
Lead Price          $3.67M      $4.08M      $4.49M      Medium
```

---

## TAB 8: CAP TABLE

### Pre-Seed Round Structure:

```
SHAREHOLDER              SHARES      OWNERSHIP    INVESTMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Founder (You)           8,000,000      80%          Sweat Equity
Friends & Family        1,000,000      10%          $100K
Advisors                  500,000       5%          Services
Employee Pool             500,000       5%          Reserved
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL                  10,000,000     100%          $100K
Pre-money Valuation:    -
Post-money Valuation:   $1M
```

### Seed Round (Current Raise):

```
SCENARIO: $1M @ $5M Pre-Money Valuation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         SHARES      % BEFORE    % AFTER
Founder                8,000,000       80.0%       66.7%
Friends & Family       1,000,000       10.0%        8.3%
Advisors                 500,000        5.0%        4.2%
Employee Pool            500,000        5.0%        4.2%
NEW INVESTORS          2,000,000         -         16.7%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL                 12,000,000      100.0%      100.0%

Post-money Valuation:   $6M
Price per Share:        $0.50
Dilution:              16.7%
```

### Series A Projection (18 Months):

```
SCENARIO: $3M @ $12M Pre-Money Valuation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         SHARES      % AFTER SEED  % AFTER A
Founder                8,000,000       66.7%         53.3%
Friends & Family       1,000,000        8.3%          6.7%
Advisors                 500,000        4.2%          3.3%
Employee Pool          1,000,000*       8.3%          6.7%
Seed Investors         2,000,000       16.7%         13.3%
SERIES A INVESTORS     2,500,000         -           16.7%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL                 15,000,000      100.0%        100.0%

*Expanded employee pool to 10% pre-Series A

Post-money Valuation:   $15M
Price per Share:        $1.20
Total Dilution (Founder): 46.7% (from 80% to 53.3%)
Total Raised:           $4.1M
```

### Dilution Waterfall:

```
ROUND       VALUATION    RAISE     DILUTION    FOUNDER %
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Start         -          -           -          100.0%
Pre-Seed     $1M        $100K       20.0%       80.0%
Seed         $6M        $1M         13.3%       66.7%
Series A    $15M        $3M         13.4%       53.3%
```

---

## TAB 9: ASSUMPTIONS

### All Input Variables:

```
REVENUE ASSUMPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SaaS:
  Starter Tier:        $299/month    (40% of customers)
  Growth Tier:         $599/month    (40% of customers)
  Enterprise Tier:     $999/month    (20% of customers)
  Blended ACV:         $500/month

Lead Generation:
  Lead Price Range:    $50-$150/lead
  Blended Price:       $75/lead
  Conversion Rate:     60% (qualified)
  Leads per Vertical:  2,000/month (mature)

Financing:
  Revenue Share:       1.5% of project value
  Average Project:     $500K (M7-12), $600K (M13-18)
  Projects per Month:  5 (M7-12), 10 (M13-18)

Growth Rates:
  SaaS Customer Growth:  100%/quarter (Q1-Q2)
                        80%/quarter (Q3-Q4)
                        60%/quarter (Q5-Q6)
  Lead Growth:          50%/month (M1-6)
                        20%/month (M7-12)
                        10%/month (M13-18)

Churn:
  Monthly Churn:       2%
  Annual Churn:        22%
  Churn Reasons:       Budget cuts (40%)
                       Switched to competitor (30%)
                       Out of business (20%)
                       Other (10%)

COST ASSUMPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COGS:
  Hosting (Fly.io):    $500 base + $10 per 1K quotes
  API Costs:           $200 base + $5 per 1K quotes
  Database:            $100 base + $0.50 per GB
  Target Gross Margin: 85%

Salaries:
  VP Sales:            $120K/year + 10% commission
  SDRs:                $60K/year + commission
  Marketing Manager:   $90K/year
  Backend Engineer:    $130K/year
  Frontend Engineer:   $120K/year
  Designer (contract): $4K/month

Marketing:
  Google Ads:          $3K/month
  LinkedIn Ads:        $2K/month
  Content/SEO:         $5K/month
  Trade Shows:         $15K each (2-3 per year)

Tools & Software:
  Salesforce:          $150/user/month
  Google Workspace:    $12/user/month
  Development Tools:   $500/month
  Other SaaS:          $500/month

HIRING TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Month 1:  VP Sales
Month 2:  SDR #1
Month 3:  SDR #2, Marketing Manager
Month 4:  -
Month 5:  -
Month 6:  Backend Engineer
Month 9:  SDR #3
Month 12: Frontend Engineer
Month 15: Sales Manager
Month 18: Customer Success Manager

FUNDRAISING ASSUMPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Seed Round:
  Amount:              $1M (base case)
  Pre-money:           $5M
  Post-money:          $6M
  Timing:              Month 0 (now)

Series A:
  Amount:              $3M
  Pre-money:           $12M
  Post-money:          $15M
  Timing:              Month 18-20
  Requirements:        $3M ARR, 200 customers

MARKET ASSUMPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TAM:
  Global BESS Market:  $120B by 2030
  US BESS Market:      $35B by 2028
  Serviceable Market:  $5B (EPCs + SMBs)

SAM:
  Commercial EPCs:     2,000 companies
  Battery OEMs:        50 companies
  SMB Facilities:      211,000 (car washes + hotels + data centers)

Competition:
  Homer Energy:        5% market share
  Aurora Solar:        3% market share
  Excel/Manual:        90% market share
  Others:              2% market share
```

---

## 📊 EXCEL FORMULAS QUICK REFERENCE

### Key Formulas to Use:

```excel
Revenue Growth:
  =C5*1.15                    (15% MoM growth)

Cumulative Total:
  =SUM($B$5:C5)               (YTD sum)

Percentage of Total:
  =C5/C$10                    (Row as % of total)

Conditional Formatting:
  =IF(C5>0,"Profit","Loss")   (Profit/loss indicator)

VLOOKUP for Assumptions:
  =VLOOKUP(A5,Assumptions!$A$2:$B$50,2,FALSE)

Moving Average:
  =AVERAGE(C5:E5)             (3-month average)

Year-over-Year Growth:
  =(C5-C17)/C17               (YoY growth %)

Cash Remaining:
  =B30+C29                    (Previous + Net Cash Flow)

Burn Rate:
  =IF(C29<0,ABS(C29),"")      (Only if negative)

Runway:
  =B30/C30                    (Cash / Burn Rate)
```

---

## 🎯 USING THE MODEL

### For Investor Meetings:

1. **Show Dashboard tab** - High-level overview
2. **Walk through Revenue Model** - Unit economics story
3. **Highlight Scenarios** - Conservative to aggressive
4. **Show Cap Table** - Dilution and ownership
5. **Answer questions** from Assumptions tab

### For Internal Planning:

1. Update **Assumptions tab** monthly with actuals
2. Compare **Revenue Model** vs. actual results
3. Adjust **Cost Structure** based on spending
4. Revise **Scenarios** as you learn more
5. Track **Cash Flow** weekly to avoid surprises

### Red Flags to Watch:

- ⚠️ Burn rate increasing faster than revenue
- ⚠️ CAC rising above $1,500
- ⚠️ Churn exceeding 3% monthly
- ⚠️ Runway below 9 months
- ⚠️ Gross margin below 80%

---

## ✅ MODEL VALIDATION CHECKLIST

Before sharing with investors:

- [ ] All formulas working correctly (no #REF, #DIV/0)
- [ ] Revenue adds up (SaaS + Leads + Financing = Total)
- [ ] Costs are reasonable (compare to industry benchmarks)
- [ ] Cash flow reconciles (Beginning + In - Out = Ending)
- [ ] Scenarios are plausible (not fantasy numbers)
- [ ] Cap table math checks out (ownership adds to 100%)
- [ ] Assumptions are documented and defensible
- [ ] Charts and graphs display correctly
- [ ] Numbers match pitch deck
- [ ] Someone else has reviewed it for errors

---

## 🚀 BUILD INSTRUCTIONS

### Option 1: Google Sheets (Recommended)

1. Create new Google Sheet
2. Name it "Merlin Financial Model - March 2026"
3. Create 9 tabs (Dashboard, Revenue, Costs, P&L, Cash Flow, Unit Econ, Scenarios, Cap Table, Assumptions)
4. Start with Assumptions tab (input all variables)
5. Build Revenue tab (reference Assumptions)
6. Build Costs tab (reference Assumptions)
7. Build P&L (reference Revenue and Costs)
8. Build Cash Flow (reference P&L)
9. Build Unit Economics (calculations)
10. Build Scenarios (copy base case, adjust variables)
11. Build Cap Table (ownership math)
12. Build Dashboard last (pull from all tabs)
13. Add charts to Dashboard
14. Format for readability
15. Share link with "View Only" access

**Time estimate:** 4-6 hours

### Option 2: Excel

Same process as Google Sheets, but:

- Save as .xlsx file
- Use Excel formulas (mostly same)
- Export as PDF for sharing
- Keep master copy locally

**Time estimate:** 4-6 hours

### Option 3: Use Template

1. Search "SaaS Financial Model Template"
2. Download from:
   - Carta (free for startups)
   - Lighter Capital (free template)
   - Baremetrics (SaaS-specific)
3. Customize with Merlin data
4. Adjust for dual revenue model

**Time estimate:** 2-3 hours

---

## 📞 NEXT STEPS

1. **This Week:** Build Assumptions and Revenue tabs
2. **Next Week:** Complete Costs, P&L, Cash Flow tabs
3. **Week 3:** Add scenarios and polish Dashboard
4. **Week 4:** Validate with advisor/accountant
5. **Month 2:** Use in first investor meetings

**Remember:** The model will evolve as you learn more about your business. Version it (v1.0, v1.1, etc.) and keep notes on what changed and why.

---

**Your financial model is now ready to build! This will be your most important fundraising tool after your pitch deck.** 💰📊

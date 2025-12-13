# How to Deploy Industry Questions in Supabase

## ⚠️ IMPORTANT: These are SQL files, not documentation files!

The file `INDUSTRY_QUESTIONS_IMPLEMENTATION_SUMMARY.md` is **documentation only** - it cannot be run in Supabase's SQL editor because it's Markdown, not SQL.

---

## ✅ CORRECT: Run These SQL Files in Supabase SQL Editor

### Option 1: Run Combined File (Fastest)
Copy and paste the contents of this file into Supabase SQL Editor:
```
database/migrations/20251212_deploy_all_industry_questions.sql
```

This deploys **EV Charging (16 questions)** and **Hospital (19 questions)** in one run.

---

### Option 2: Run Each File Individually

Run these 5 files in order by copying/pasting each into Supabase SQL Editor:

1. **EV Charging Hub (16 questions)**
   ```
   database/migrations/20251212_fix_ev_charging_questions.sql
   ```

2. **Hospital (19 questions)**
   ```
   database/migrations/20251212_fix_hospital_questions.sql
   ```

3. **Warehouse (17 questions)**
   ```
   database/migrations/20251212_fix_warehouse_questions.sql
   ```

4. **Manufacturing (19 questions)**
   ```
   database/migrations/20251212_fix_manufacturing_questions.sql
   ```

5. **Data Center (18 questions)**
   ```
   database/migrations/20251212_fix_data_center_questions.sql
   ```

---

## 📋 Summary

| Use Case | Questions | SQL File |
|----------|-----------|----------|
| Gas Station | 16 | ✅ Already deployed (Dec 12) |
| EV Charging Hub | 16 | `20251212_fix_ev_charging_questions.sql` |
| Hospital | 19 | `20251212_fix_hospital_questions.sql` |
| Warehouse | 17 | `20251212_fix_warehouse_questions.sql` |
| Manufacturing | 19 | `20251212_fix_manufacturing_questions.sql` |
| Data Center | 18 | `20251212_fix_data_center_questions.sql` |

**Total**: 89 new questions across 5 use cases (105 total including Gas Station)

---

## 🎯 Steps to Deploy in Supabase

1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. **Copy entire contents** of one SQL file (e.g., `20251212_fix_ev_charging_questions.sql`)
4. **Paste** into SQL Editor
5. Click "Run" (play button)
6. Verify "Success" message
7. Repeat for remaining files

---

## ❌ DON'T Run These Files (They're Documentation)

- `INDUSTRY_QUESTIONS_IMPLEMENTATION_SUMMARY.md` - **Markdown doc, not SQL**
- `COMPLETE_USE_CASE_AUDIT_DEC_2025.md` - **Markdown doc, not SQL**
- `scripts/deploy-industry-questions.sh` - **Bash script for terminal, not Supabase**

These are **reference documents** - read them, don't run them in SQL editor!

---

## ✅ Verify Deployment

After running migrations, verify each use case has questions:

```sql
-- Check EV Charging
SELECT COUNT(*) FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'ev-charging';
-- Should return: 16

-- Check Hospital
SELECT COUNT(*) FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'hospital';
-- Should return: 19

-- Check Warehouse
SELECT COUNT(*) FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'warehouse';
-- Should return: 17

-- Check Manufacturing
SELECT COUNT(*) FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'manufacturing';
-- Should return: 19

-- Check Data Center
SELECT COUNT(*) FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'data-center';
-- Should return: 18
```

---

*Reference: See `INDUSTRY_QUESTIONS_IMPLEMENTATION_SUMMARY.md` for detailed documentation*

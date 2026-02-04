# Template Fixtures

**Policy: Fixtures are DB templates.**

This directory contains JSON exports of database templates used for golden testing.

## Source

Templates are exported from the Supabase database using:

```bash
npx tsx scripts/export-templates-to-fixtures.ts --all
```

## Structure

Each file is named `<slug>.json` and contains:

```json
{
  "_meta": {
    "exportedAt": "2026-02-01T...",
    "exporterVersion": "1.0.0",
    "sourceTable": "use_cases + custom_questions"
  },
  "templateId": "uuid",
  "templateVersion": "2026-01-15T...",
  "industry": "hotel",
  "useCase": "hotel",
  "name": "Hotel / Hospitality",
  "slug": "hotel",
  "questions": [...],
  "defaults": {...},
  "parts": [...],
  "calculatorId": "hotel_load_v1"
}
```

## Golden Testing

Tests in `tests/integration/magicfit-invariants.test.ts` run against these fixtures.

If a test fails due to drift:
1. Investigate whether the drift is intentional (DB schema change)
2. If intentional, re-export fixtures: `npx tsx scripts/export-templates-to-fixtures.ts --all`
3. Commit the updated fixtures with a descriptive message

## DO NOT

- Manually edit these files
- Create "mock" fixtures in code
- Skip fixture-based tests

## Template Identity Keys

Every golden output must be keyed by:
- `templateId`
- `templateVersion`
- `industry` / `useCase`
- Calculator version

This ensures drift can be traced to its source.

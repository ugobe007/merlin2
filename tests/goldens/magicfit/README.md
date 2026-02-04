# MagicFit Goldens

**Policy: Fixtures are DB templates.**

This directory contains expected MagicFit outputs for golden testing.

## Purpose

When template fixtures are run through the MagicFit calculator, the outputs are saved here as "goldens".
Future test runs compare actual outputs against these goldens to detect drift.

## Structure

```
magicfit/
├── hotel.magicfit.json
├── car_wash.magicfit.json
├── data_center.magicfit.json
└── ...
```

Each file contains:

```json
{
  "_golden": {
    "createdAt": "2026-02-01T...",
    "templateId": "...",
    "templateVersion": "...",
    "calculatorVersion": "1.1.1"
  },
  "options": {
    "starter": {...},
    "perfectFit": {...},
    "beastMode": {...}
  }
}
```

## Updating Goldens

If MagicFit logic changes intentionally:

1. Run tests to see what changed
2. Review the diff carefully
3. Update goldens: `npm run test:update-goldens` (TBD)
4. Commit with descriptive message explaining the change

## DO NOT

- Manually edit golden files
- Commit golden updates without review
- Ignore golden drift in PRs

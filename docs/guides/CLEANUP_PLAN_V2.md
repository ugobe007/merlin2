# Merlin Codebase Cleanup Plan V2

**Date:** November 28, 2025  
**Status:** PROPOSAL - Review before executing

---

## Current State Analysis

### Problems Identified

| Issue | Count/Size | Impact |
|-------|------------|--------|
| Root markdown files | **201 files** (2.2MB) | Cluttered repo, hard to find real docs |
| Archive folders | 3 directories (~1.1MB) | Dead code, confusion |
| Backup files | 11+ scattered files | Git handles this already |
| Duplicate services | ~15 services with overlapping functions | Maintenance nightmare |
| Inconsistent folder structure | Multiple patterns used | Developer confusion |

---

## Proposed New Structure

```
merlin2/
├── .github/                     # GitHub config (keep)
├── database/                    # Database migrations (keep)
├── dist/                        # Build output (gitignored)
├── docs/                        # 📁 NEW: All documentation
│   ├── architecture/            # System design docs
│   ├── api/                     # API documentation  
│   ├── guides/                  # User/developer guides
│   └── archive/                 # Historical docs (dated)
├── public/                      # Static assets (keep)
├── scripts/                     # Build/deploy scripts
├── src/
│   ├── assets/                  # Images, sounds, etc.
│   ├── components/              # React components (reorganized)
│   │   ├── common/              # Shared UI components
│   │   ├── features/            # Feature-specific components
│   │   │   ├── quote-builder/   # Quote building wizard
│   │   │   ├── analytics/       # Analytics dashboards
│   │   │   ├── portfolio/       # User portfolio
│   │   │   ├── admin/           # Admin panels
│   │   │   └── auth/            # Authentication
│   │   ├── layout/              # Page layouts, navigation
│   │   └── modals/              # Modal components
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # Business logic (consolidated)
│   │   ├── calculations/        # All calculation services
│   │   ├── pricing/             # All pricing services
│   │   ├── export/              # Export services
│   │   └── api/                 # External API services
│   ├── types/                   # TypeScript types
│   └── utils/                   # Utility functions
├── tests/                       # Test files
│   ├── e2e/                     # End-to-end tests
│   ├── integration/             # Integration tests
│   └── unit/                    # Unit tests
├── README.md                    # Main readme
├── ARCHITECTURE.md              # Architecture overview (1 file)
├── CHANGELOG.md                 # Version history
└── package.json
```

---

## Cleanup Actions

### Phase 1: Delete Dead Code (Safe)

```bash
# Remove archive/backup folders
rm -rf .backups
rm -rf src/components/archive_legacy_nov_2025
rm -rf src/_deprecated

# Remove backup files
find . -name "*.backup*" -delete
find . -name "*.BACKUP*" -delete  
find . -name "*.bak" -delete
find . -name "*REMOVED*" -delete
find . -name "*BROKEN*" -delete
```

### Phase 2: Consolidate Documentation

Move 201 markdown files to `docs/` folder:

```bash
mkdir -p docs/archive docs/guides docs/architecture

# Keep essential docs in root
# Move historical/completion docs to archive
# Move guides to guides/
```

**Keep in root:**
- README.md
- ARCHITECTURE.md (consolidate from multiple files)
- CHANGELOG.md
- LICENSE

**Move to docs/archive/:**
- All `*_COMPLETE.md` files
- All `*_SUMMARY.md` files
- All `*_FIX.md` files
- All dated files

### Phase 3: Consolidate Services

Current services with overlap:
```
pricingService.ts           → 
unifiedPricingService.ts    → services/pricing/pricingService.ts (KEEP)
pricingConfigService.ts     → 
pricingIntelligence.ts      → 

centralizedCalculations.ts  → services/calculations/financialCalculations.ts (KEEP)
calculationFormulas.ts      → 
industryStandardFormulas.ts → 

bessDataService.ts          → DELETE (deprecated)
dataIntegrationService.ts   → 
```

### Phase 4: Reorganize Components

**Current mess:** 45+ components in `/components` root

**Proposed organization:**
```
components/
├── common/
│   ├── ErrorBoundary.tsx
│   ├── LoadingSpinner.tsx
│   └── ...
├── features/
│   ├── quote-builder/
│   │   ├── BessQuoteBuilder.tsx
│   │   ├── AdvancedQuoteBuilder.tsx
│   │   └── wizard/
│   ├── analytics/
│   │   ├── AdvancedAnalytics.tsx
│   │   ├── EnhancedBESSAnalytics.tsx
│   │   └── MarketIntelligenceDashboard.tsx
│   ├── portfolio/
│   │   └── Portfolio.tsx
│   ├── admin/
│   │   └── AdminDashboard.tsx
│   └── auth/
│       ├── AuthModal.tsx
│       └── UserProfile.tsx
├── layout/
│   ├── Navigation.tsx
│   └── Footer.tsx
└── modals/
    └── ... (keep as-is, already organized)
```

---

## Execution Order

1. **Backup first** (Git tag: `pre-cleanup-v2`)
2. **Phase 1**: Delete dead code (low risk)
3. **Phase 2**: Move docs (no code changes)
4. **Phase 3**: Consolidate services (high risk - needs testing)
5. **Phase 4**: Reorganize components (high risk - needs testing)

---

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|------------|
| 1 | LOW | Archive files not imported anywhere |
| 2 | LOW | Only moving .md files |
| 3 | HIGH | Services have interdependencies - needs careful refactoring |
| 4 | HIGH | Import paths will break - needs mass update |

---

## Recommendation

**Start with Phase 1 and Phase 2** - these are safe and provide immediate benefit.

Phase 3 and 4 should be done incrementally with full test coverage.

---

## Commands Ready to Execute

### Phase 1 (Delete Dead Code):
```bash
cd /Users/robertchristopher/merlin2

# Create safety tag
git tag pre-cleanup-v2

# Remove archive folders
rm -rf .backups
rm -rf src/components/archive_legacy_nov_2025
rm -rf src/_deprecated

# Remove backup files
rm -f tsconfig.json.backup
rm -f src/services/authService.ts.backup
rm -f src/ui/hooks/useQuoteBuilder.example.tsx.disabled.backup
rm -f src/ui/hooks/useQuoteBuilder.ts.backup
```

### Phase 2 (Consolidate Docs):
```bash
mkdir -p docs/archive docs/guides docs/architecture

# Move completion/fix docs to archive
mv *_COMPLETE.md *_SUMMARY.md *_FIX*.md docs/archive/ 2>/dev/null
mv *_FIXED*.md *_BUG*.md *_AUDIT*.md docs/archive/ 2>/dev/null
mv *SESSION*.md *TRACKING*.md docs/archive/ 2>/dev/null

# Move architectural docs
mv ARCHITECTURE*.md docs/architecture/ 2>/dev/null
mv SERVICES*.md docs/architecture/ 2>/dev/null

# Move guides
mv *GUIDE*.md *SETUP*.md *PLAN*.md docs/guides/ 2>/dev/null
```

---

**Approve this plan before I execute?**

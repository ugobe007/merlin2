# SSOT Violations Found

## Known SSOT Violations (To Fix After Audit)

### 1. questionnaireMapper.ts - roomCount Default
**File**: `src/services/questionnaireMapper.ts`  
**Line**: 201  
**Violation**: `const roomCount = answers.roomCount || 150;`

**Issue**: Using default fallback instead of requiring user-provided value  
**Fix**: Remove default - user must provide roomCount (database is SSOT)  
**Impact**: High - foundational variable using default instead of SSOT

**Status**: ⏳ Documented - fix after full audit

### 2. Other Potential Violations
The audit script will find all violations. Check results after running:
```bash
npx tsx scripts/audit-ssot-truequote-violations.ts
```

## Fix Strategy

After audit completes:

1. **Review all violations**
2. **Fix in order of severity** (critical first)
3. **Test each fix**
4. **Re-run audit to verify**

## Principles

- ✅ Database (user-provided values) = SSOT
- ✅ Default values = UI initialization only (when form first loads)
- ❌ Never use defaults as fallback in calculation code
- ❌ Never use `|| default` pattern for foundational variables

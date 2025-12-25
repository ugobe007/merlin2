# Admin Accounts Summary

**Last Updated:** January 3, 2025

---

## Current Admin Accounts

Based on the codebase analysis, here are all admin accounts:

### 1. Hardcoded Default Account ✅

**Location:** `src/App.tsx` and `src/services/adminAuthService.ts`

- **Email:** `admin@merlin.energy`
- **Password:** `merlin2025`
- **Source:** Default hardcoded credentials
- **Access:** 
  - Floating admin button (⚙️ bottom-right)
  - Keyboard shortcut: `Ctrl+Shift+A` (Windows) or `Cmd+Shift+A` (Mac)
  - URL parameter: `?admin=true`

---

## Total Admin Accounts: **1**

Currently, you have **one (1) admin account** configured in the system.

---

## Additional Admin Account Options

The system supports multiple ways to add more admin accounts:

### Option 1: Environment Variables (Not Currently Set)

You can add admin accounts via `.env` file:

```bash
# Single admin account
VITE_ADMIN_EMAIL=your-admin@domain.com
VITE_ADMIN_PASSWORD=your-password

# Multiple admin accounts (JSON format)
VITE_ADMIN_ACCOUNTS='[{"email":"admin1@domain.com","password":"pass1"},{"email":"admin2@domain.com","password":"pass2"}]'
```

**Status:** No `.env` file found with admin credentials.

---

### Option 2: Supabase Auth Users (Not Currently Implemented)

For production, admin accounts can be stored in Supabase `auth.users` table with admin role in metadata.

**To check for Supabase admin users:**
Run this SQL in Supabase SQL Editor:
```sql
SELECT email, created_at, raw_user_meta_data 
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin';
```

---

## Recommendation

**Current Setup:**
- ✅ One admin account (`admin@merlin.energy`)
- ✅ Works via hardcoded credentials
- ⚠️ Not production-ready (should use environment variables or Supabase Auth)

**For Production:**
1. Move credentials to environment variables (`.env`)
2. Or implement Supabase Auth with admin role management
3. Never commit admin passwords to git

---

## How to Change Admin Credentials

See: `docs/guides/ADMIN_CREDENTIALS_GUIDE.md`


# Limited Admin Account Setup - Summary

## ✅ Completed Setup

A limited admin account has been successfully created with restricted editing permissions.

---

## New Admin Account

**Email:** `viewer@merlin.energy`  
**Password:** `viewer2025`  
**Role:** `limited_admin` (view-only access)

---

## Permissions Summary

### ✅ Allowed Actions (Limited Admin)
- View pricing configuration
- View validation results  
- Run validation (read-only operation)
- View database status
- Export configuration (for backup/reporting)

### ❌ Restricted Actions (Limited Admin)
- **Cannot edit pricing values** - Input fields are protected
- **Cannot save changes** - Save button is disabled
- **Cannot sync to database** - Sync button is disabled
- **Cannot reset to defaults** - Reset button is disabled (super admin only)
- **Cannot import configuration** - Import button is disabled (super admin only)

---

## How to Use

1. **Login as Limited Admin:**
   - Click the admin button (⚙️) or use `Ctrl+Shift+A` / `Cmd+Shift+A`
   - Enter email: `viewer@merlin.energy`
   - Enter password: `viewer2025`
   - Access granted with view-only permissions

2. **What You'll See:**
   - All pricing data is visible
   - Validation can be run
   - Configuration can be exported
   - Edit/save/import/reset buttons are **disabled** with tooltips explaining why

3. **Security:**
   - Limited admin cannot accidentally modify pricing
   - All destructive actions are protected
   - Perfect for auditing, reporting, or training

---

## Full Admin Account (Reference)

**Email:** `admin@merlin.energy`  
**Password:** `merlin2025`  
**Role:** `super_admin` (full access to all features)

---

## Technical Implementation

- **Permission System:** Role-based permissions in `adminAuthService.ts`
- **UI Protection:** Permission checks in `PricingAdminDashboard.tsx`
- **Authentication:** Updated `App.tsx` to use `AdminAuthService` for all admin accounts

---

## Files Modified

1. `src/services/adminAuthService.ts` - Added limited_admin role and permissions
2. `src/components/PricingAdminDashboard.tsx` - Added permission checks to all actions
3. `src/App.tsx` - Updated to use AdminAuthService for authentication
4. `docs/ADMIN_PERMISSIONS_GUIDE.md` - Complete permissions documentation

---

## Next Steps (Optional)

- [ ] Add visual role indicator (badge showing "Limited Admin" vs "Super Admin")
- [ ] Add audit logging for admin actions
- [ ] Consider Supabase Auth migration for production security


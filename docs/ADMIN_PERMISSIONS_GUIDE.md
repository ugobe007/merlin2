# Admin Permissions Guide

**Last Updated:** January 3, 2025

---

## Admin Account Types

### 1. Super Admin (`super_admin`)
**Account:** `admin@merlin.energy` / `merlin2025`

**Permissions:**
- ✅ View pricing configuration
- ✅ Edit pricing configuration
- ✅ Save pricing changes
- ✅ View validation results
- ✅ Run validation
- ✅ View database status
- ✅ Sync to database
- ✅ Export configuration
- ✅ **Reset to defaults** (destructive)
- ✅ **Import configuration** (can overwrite data)
- ✅ Manage users
- ✅ System configuration
- ✅ Delete data
- ✅ Export data

**Use Case:** Full system administrator access for all operations.

---

### 2. Limited Admin (`limited_admin`)
**Account:** `viewer@merlin.energy` / `viewer2025`

**Permissions:**
- ✅ View pricing configuration
- ✅ View validation results
- ✅ Run validation (read-only operation)
- ✅ View database status
- ✅ Export configuration (read-only)
- ❌ **Cannot edit pricing**
- ❌ **Cannot save changes**
- ❌ **Cannot sync to database**
- ❌ **Cannot reset to defaults**
- ❌ **Cannot import configuration**

**Use Case:** Read-only access for auditing, reporting, or viewing configuration without risk of accidental changes.

---

### 3. Regular Admin (`admin`)
**Permissions:** (For future use, not currently assigned)

**Permissions:**
- ✅ View pricing configuration
- ✅ Edit pricing configuration
- ✅ Save pricing changes
- ✅ View validation results
- ✅ Run validation
- ✅ View database status
- ✅ Sync to database
- ✅ Export configuration
- ❌ Cannot reset to defaults
- ❌ Cannot import configuration

**Use Case:** Standard admin with ability to make changes but not perform destructive operations.

---

## Permission Checks in Code

### Pricing Admin Dashboard

The `PricingAdminDashboard` component checks permissions before allowing actions:

```typescript
// Permission flags
const canEdit = adminAuthService.hasPermission('edit_pricing');
const canSave = adminAuthService.hasPermission('save_pricing');
const canReset = adminAuthService.hasPermission('reset_to_defaults');
const canImport = adminAuthService.hasPermission('import_config');
const canSync = adminAuthService.hasPermission('sync_database');
const canExport = adminAuthService.hasPermission('export_config');
```

### Actions Protected by Permissions

1. **Edit Pricing Values** - Requires `edit_pricing`
2. **Save Changes** - Requires `save_pricing`
3. **Reset to Defaults** - Requires `reset_to_defaults` (super admin only)
4. **Import Configuration** - Requires `import_config` (super admin only)
5. **Sync to Database** - Requires `sync_database`
6. **Export Configuration** - Requires `export_config` (all admins can export)

---

## Adding New Admin Accounts

### Method 1: Update Default Credentials (Not Recommended)

Edit `src/services/adminAuthService.ts`:

```typescript
const defaultCredentials: AdminCredentials[] = [
  {
    email: 'admin@merlin.energy',
    password: 'merlin2025'
  },
  {
    email: 'viewer@merlin.energy',
    password: 'viewer2025'
  },
  // Add more accounts here
];
```

### Method 2: Environment Variables (Recommended)

Add to `.env` file:

```bash
# Single admin account
VITE_ADMIN_EMAIL=your-admin@domain.com
VITE_ADMIN_PASSWORD=your-password

# Multiple admin accounts (JSON format)
VITE_ADMIN_ACCOUNTS='[
  {"email":"admin1@domain.com","password":"pass1"},
  {"email":"viewer1@domain.com","password":"pass2"}
]'
```

**Note:** Email addresses containing "viewer" or "limited" will automatically get `limited_admin` role. Email addresses containing "super" or matching `admin@merlin.energy` will get `super_admin` role.

---

## Role Assignment Logic

Roles are assigned based on email patterns:

- `super_admin`: Email contains "super" OR email is `admin@merlin.energy`
- `limited_admin`: Email contains "viewer" OR email contains "limited" OR email is `viewer@merlin.energy`
- `admin`: Default for all other admin emails

---

## Security Notes

1. **Passwords are stored in plain text** in the codebase (for development). For production, use:
   - Environment variables (never commit to git)
   - Supabase Auth (recommended for production)
   - OAuth providers (Google, GitHub, etc.)

2. **Session Management**: Admin sessions expire after 8 hours of inactivity.

3. **Permission Checks**: Always verify permissions on both client and server side for production applications.

---

## Testing Permissions

1. **Login as Super Admin:**
   - Email: `admin@merlin.energy`
   - Password: `merlin2025`
   - Should see all buttons enabled and all actions available

2. **Login as Limited Admin:**
   - Email: `viewer@merlin.energy`
   - Password: `viewer2025`
   - Should see:
     - ✅ Export button enabled
     - ✅ Run Validation button enabled
     - ❌ Save Changes button disabled
     - ❌ Import button disabled
     - ❌ Reset button disabled
     - ❌ Sync to Database button disabled
     - ❌ Input fields should show permission restrictions

---

## Future Enhancements

- [ ] Add role-based UI indicators (badge showing role type)
- [ ] Add audit logging for admin actions
- [ ] Implement granular permission management
- [ ] Add permission groups/custom roles
- [ ] Migrate to Supabase Auth with role-based access control (RBAC)


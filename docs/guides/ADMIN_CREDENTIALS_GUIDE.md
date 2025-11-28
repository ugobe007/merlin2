# Admin Credentials Configuration Guide

## 🔐 Current Admin Access

### **Default Credentials:**
- **Email:** `admin@merlin.energy`
- **Password:** `merlin2025`

### **Access Methods:**
1. **Floating Admin Button:** Click the purple ⚙️ icon (bottom-right corner)
2. **Keyboard Shortcut:** `Ctrl + Shift + A` (Windows) or `Cmd + Shift + A` (Mac)
3. **Direct URL:** Add `?admin=true` to any URL

---

## ⚙️ How to Change Admin Credentials

### **Method 1: Simple Change (Current System)**

Edit `src/App.tsx` line 34 to update credentials:

```typescript
// Change these values to your desired credentials:
if (email === 'your-new-email@domain.com' && password === 'your-new-password') {
  setShowAdmin(true);
} else {
  alert('Incorrect email or password');
}
```

### **Method 2: Environment Variables (Recommended)**

1. **Add to your `.env` file:**
```bash
VITE_ADMIN_EMAIL=your-admin@domain.com
VITE_ADMIN_PASSWORD=your-secure-password-123
```

2. **Update `src/App.tsx`:**
```typescript
// Replace the hardcoded check with environment variables
const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@merlin.energy';
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'merlin2025';

if (email === adminEmail && password === adminPassword) {
  setShowAdmin(true);
} else {
  alert('Incorrect email or password');
}
```

### **Method 3: Supabase Authentication (Enterprise)**

For production deployment, integrate with Supabase auth:

1. **Create admin users in Supabase:**
```sql
-- Add to your Supabase database
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('admin@yourcompany.com', crypt('your-password', gen_salt('bf')), now(), now(), now());

-- Add admin role
INSERT INTO user_roles (user_id, role) 
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@yourcompany.com';
```

2. **Update authentication logic:**
```typescript
const handleAdminAccess = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });
  
  if (data.user && await checkAdminRole(data.user.id)) {
    setShowAdmin(true);
  } else {
    alert('Admin access denied');
  }
};
```

---

## 🛡️ Security Best Practices

### **For Development:**
- ✅ Use environment variables instead of hardcoded credentials
- ✅ Add `.env` to `.gitignore` to prevent credential leaks
- ✅ Use different credentials for each environment (dev/staging/prod)

### **For Production:**
- ✅ Enable Supabase Row Level Security (RLS)
- ✅ Use strong passwords (12+ characters, mixed case, numbers, symbols)
- ✅ Implement admin role-based access control
- ✅ Enable audit logging for admin actions
- ✅ Consider multi-factor authentication (MFA)

### **Password Requirements:**
- Minimum 12 characters
- Include uppercase and lowercase letters
- Include numbers and special characters
- Avoid common passwords or dictionary words

---

## 🎛️ Admin Panel Features

Once authenticated, you'll have access to:

### **🔍 Daily Validation**
- Market price validation against NREL ATB 2024
- Bloomberg NEF and Wood Mackenzie integration
- Vendor pricing updates and alerts

### **☁️ Supabase Sync**
- Real-time database connectivity status
- Configuration backup and restore
- Daily sync service management
- Database statistics and health monitoring

### **🔋 BESS Systems**
- Size-weighted pricing configuration ($155/kWh → $105/kWh)
- Small/large system thresholds (2 MWh, 15 MWh)
- Live pricing examples and calculations

### **⚡ Equipment Pricing**
- Solar PV, Wind, Generators configuration
- Power Electronics and EV Charging settings
- Balance of Plant and System Controls
- Vendor notes and market intelligence

---

## 🔧 Troubleshooting

### **"Incorrect email or password" Error:**
1. Check for typos in email/password
2. Verify credentials match those in `src/App.tsx`
3. Clear browser cache and try again
4. Check browser console for errors

### **Admin Panel Not Loading:**
1. Check that authentication was successful
2. Verify no JavaScript errors in console
3. Ensure all admin components are properly imported
4. Check network connectivity for Supabase integration

### **Supabase Integration Issues:**
1. Verify `.env` file has correct Supabase credentials
2. Check Supabase project is active and accessible
3. Ensure database schema is properly set up
4. Test connection via Admin Panel → ☁️ Supabase Sync

---

## 📞 Support

If you need help changing credentials or encounter issues:

1. **Check the browser console** for detailed error messages
2. **Verify environment variables** are properly loaded
3. **Test with default credentials** first before customizing
4. **Review the setup guide** in `SUPABASE_SETUP.md`

**Default Recovery:**
If locked out, restore default credentials in `src/App.tsx`:
```typescript
if (email === 'admin@merlin.energy' && password === 'merlin2025') {
```

The admin system is designed to be secure yet accessible for authorized users to manage the pricing intelligence platform.
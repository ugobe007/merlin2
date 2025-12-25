# Admin Email Update & Styling Summary

**Completed:** January 3, 2025

---

## ✅ Changes Completed

### 1. Email Domain Update
- **Changed from:** `merlin.energy`
- **Changed to:** `merlinenergy.net`
- **Updated in:**
  - `src/services/adminAuthService.ts` - Admin account emails
  - `src/services/alertNotificationService.ts` - Alert sender email
  - `src/App.tsx` - Comments/documentation

### 2. Merlin Colors Applied to Pricing Admin Dashboard
- **Updated colors from blue to purple/indigo gradient:**
  - Header icon: `text-purple-600`
  - Primary buttons: `bg-gradient-to-r from-purple-600 to-indigo-600` with hover effects
  - Sidebar selected items: `bg-gradient-to-r from-purple-100 to-indigo-100` with purple text
  - Info alerts: `text-purple-600`, `text-purple-800`, `text-purple-700`
  - Validation section: `bg-gradient-to-br from-purple-50 to-indigo-50`
  - Input focus states: `focus:border-purple-500 focus:ring-purple-500`
  - Save status: `text-purple-600`
  - Added shadows: `shadow-lg shadow-purple-500/25`

### 3. Email Alerts Configuration
- Updated default alert email to `admin@merlinenergy.net`
- Alert sender email set to `alerts@merlinenergy.net`
- Created comprehensive email alerts setup guide

---

## Updated Admin Accounts

### Super Admin (Full Access)
- **Email:** `admin@merlinenergy.net`
- **Password:** `merlin2025`
- **Role:** `super_admin`

### Limited Admin (View Only)
- **Email:** `viewer@merlinenergy.net`
- **Password:** `viewer2025`
- **Role:** `limited_admin`

---

## Email Alerts Setup

To receive email alerts on the limited admin account:

1. **Add to `.env` file:**
   ```bash
   VITE_ALERT_EMAIL=viewer@merlinenergy.net
   VITE_RESEND_API_KEY=your_resend_api_key
   ```

2. **Set up Resend API:**
   - Sign up at https://resend.com
   - Verify domain `merlinenergy.net`
   - Add API key to `.env`

3. **Alerts will be sent when:**
   - SSOT validation fails (score < 70%)
   - Critical failures trigger immediate alerts
   - Warnings trigger email-only alerts

See `docs/EMAIL_ALERTS_SETUP.md` for complete setup instructions.

---

## Files Modified

1. `src/services/adminAuthService.ts` - Email domain updates
2. `src/services/alertNotificationService.ts` - Email domain and default recipient
3. `src/components/PricingAdminDashboard.tsx` - Color scheme updates
4. `src/App.tsx` - Comments updated
5. `docs/EMAIL_ALERTS_SETUP.md` - New documentation
6. `docs/ADMIN_EMAIL_UPDATE_SUMMARY.md` - This file

---

## Visual Changes

The Pricing Admin Dashboard now features:
- **Merlin purple/indigo gradient buttons** instead of solid blue
- **Purple-themed sidebar** with gradient selected states
- **Consistent purple accents** throughout the interface
- **Enhanced shadows** for depth and premium feel

All changes maintain accessibility and readability while bringing the dashboard in line with Merlin's brand colors.


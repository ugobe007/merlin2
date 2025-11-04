# 🚀 Supabase Setup for Vendor Portal

## Step 1: Install Supabase Client

The Supabase client should already be installed, but if not:

```bash
npm install @supabase/supabase-js
```

## Step 2: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `merlin-vendor-portal` (or your choice)
   - **Database Password**: Save this securely!
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

## Step 3: Get Your API Credentials

1. In your Supabase project, go to **Settings > API**
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon Public Key** (long string starting with `eyJ...`)

## Step 4: Create .env File

Create a `.env` file in your project root (if it doesn't exist):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-key-here
```

**Important:** 
- Replace the values with YOUR actual credentials from Step 3
- This file is gitignored, so your keys stay secure
- Never commit real API keys to GitHub!

## Step 5: Run the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the entire contents of `/docs/VENDOR_PORTAL_SCHEMA.sql`
4. Paste into the SQL editor
5. Click "Run" (green play button)
6. You should see "Success. No rows returned" - that's perfect!

This creates:
- ✅ 6 database tables (vendors, vendor_products, rfqs, rfq_responses, vendor_notifications, pricing_history)
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for auto-updating timestamps
- ✅ Views for admin dashboards
- ✅ Sample data for testing

## Step 6: Configure Authentication

1. Go to **Authentication > Providers** in Supabase
2. Ensure **Email** is enabled
3. Configure email templates (optional):
   - Go to **Authentication > Email Templates**
   - Customize "Confirm signup" and "Reset password" emails with your branding

### Important Auth Settings:

Go to **Authentication > Settings** and configure:

- ✅ **Enable email confirmations**: OFF (for faster testing, turn ON for production)
- ✅ **Auto confirm email**: ON (for testing, OFF for production)
- ✅ **Email auth**: ON
- ✅ **Allow new signups**: ON

## Step 7: Create Storage Bucket (Optional)

For uploading product datasheets:

1. Go to **Storage** in Supabase
2. Click "New Bucket"
3. Name it: `vendor-datasheets`
4. Set to **Public** (for easy access to datasheets)
5. Click "Create Bucket"

### Set Storage Policies:

```sql
-- Allow vendors to upload datasheets
CREATE POLICY "Vendors can upload datasheets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vendor-datasheets');

-- Allow everyone to view datasheets
CREATE POLICY "Public can view datasheets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-datasheets');
```

## Step 8: Test the Connection

Start your dev server:

```bash
npm run dev
```

1. Click on "🏢 Vendors" in the header
2. Try registering a test vendor account
3. Check your Supabase dashboard:
   - Go to **Authentication > Users** - you should see the new user
   - Go to **Table Editor > vendors** - you should see the vendor profile

## Step 9: Admin Access Setup

To approve vendors and manage the platform, you'll need admin access.

### Option A: Direct Database Access
Use Supabase Table Editor to manually update vendor status:
1. Go to **Table Editor > vendors**
2. Find your test vendor
3. Change `status` from `'pending'` to `'approved'`
4. Try logging in again - should work now!

### Option B: Create Admin Interface (Future)
We can create an admin dashboard in your app that uses the existing VendorManager component.

## Troubleshooting

### "Supabase is not configured" Error
- ✅ Check that `.env` file exists in project root
- ✅ Verify environment variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- ✅ Restart your dev server after adding `.env` file

### "Failed to create user" Error
- ✅ Check that email authentication is enabled in Supabase
- ✅ Verify your Supabase project is active (not paused)
- ✅ Check browser console for detailed error messages

### "Vendor profile not found" Error
- ✅ Ensure database schema was run successfully
- ✅ Check that `vendors` table exists in Table Editor
- ✅ Verify RLS policies are configured correctly

### "Permission denied" Errors
- ✅ RLS policies may be too restrictive
- ✅ Temporarily disable RLS for testing:
  ```sql
  ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
  ALTER TABLE vendor_products DISABLE ROW LEVEL SECURITY;
  ```
- ✅ Re-enable before production!

### Password Reset Not Working
- ✅ Configure SMTP settings in Supabase (Authentication > Settings > SMTP)
- ✅ Or use Supabase's built-in email service
- ✅ Check email templates are configured

## Environment Variables Reference

Add these to your `.env` file:

```bash
# Required for Vendor Portal
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: For production
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=https://merlinenergy.com
```

**Security Note:** 
- The `ANON_KEY` is safe to expose on the frontend (it's called "anon" for a reason)
- RLS policies protect your data, not the key itself
- The `SERVICE_ROLE_KEY` should NEVER be exposed on frontend - only use server-side

## Database Schema Overview

Your database now has these tables:

### 1. **vendors** (Vendor Companies)
- Company information
- Contact details
- Specialty (battery, inverter, etc.)
- Approval status
- Performance metrics

### 2. **vendor_products** (Product Catalog)
- Product specifications
- Pricing ($/kWh or $/kW)
- Lead time and warranty
- Certifications
- Approval status

### 3. **rfqs** (Request for Quotes)
- Project opportunities
- System requirements
- Due dates
- Status tracking

### 4. **rfq_responses** (Vendor Proposals)
- Vendor pricing submissions
- Technical proposals
- Evaluation scores
- Status tracking

### 5. **vendor_notifications**
- System notifications
- Email alerts
- Read/unread tracking

### 6. **pricing_history**
- Historical pricing data
- Market intelligence
- Trend analysis

## Next Steps

1. ✅ **Test vendor registration** - Create a test account
2. ✅ **Approve the vendor** - Manually set status to 'approved'
3. ✅ **Submit a product** - Test the pricing submission form
4. ✅ **Create an RFQ** - Add test project opportunities
5. ✅ **Build admin dashboard** - Connect VendorManager to Supabase

## Production Checklist

Before going live:

- [ ] Enable email confirmations
- [ ] Configure custom email templates with branding
- [ ] Set up custom domain for Supabase Auth (optional)
- [ ] Enable rate limiting on Auth endpoints
- [ ] Configure SMTP for transactional emails
- [ ] Set up backup policies for database
- [ ] Review and test all RLS policies
- [ ] Set up monitoring and alerts
- [ ] Document admin approval workflow
- [ ] Train team on vendor management

## Support

If you run into issues:

1. Check Supabase logs: **Database > Logs** and **Authentication > Logs**
2. Use Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)
3. Review Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)

---

**You're all set!** 🎉 The vendor portal is now backed by a real database and ready for production use.

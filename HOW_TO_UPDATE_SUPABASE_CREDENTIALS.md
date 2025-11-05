# How to Update Supabase Credentials

This guide provides step-by-step instructions for rotating your Supabase credentials after they were exposed in git history.

## Why You Need to Rotate Credentials

Your Supabase credentials were previously committed to git in the `.env` file. Even though the file has been removed, **the credentials remain in the git history** and should be considered compromised.

## Step-by-Step Instructions

### 1. Log into Supabase Dashboard

Go to [https://supabase.com](https://supabase.com) and sign in to your account.

### 2. Navigate to Your Project

- Click on your project (the one used for the Merlin BESS Quote Builder)
- You should see your project dashboard

### 3. Access Project Settings

- Click on the **Settings** icon (⚙️) in the left sidebar
- Navigate to **API** section

### 4. View Current API Keys

You'll see several keys:
- **Project URL** (e.g., `https://xxxxx.supabase.co`)
- **anon/public key** (this is what was exposed)
- **service_role key** (if you were using it)

### 5. Generate New Anon Key

**Important**: Supabase doesn't allow you to directly regenerate the anon key through the UI. You have two options:

#### Option A: Use Existing Key with Enhanced Security (Recommended if no suspicious activity)

If you haven't seen any suspicious activity:
1. Keep the existing key
2. Enable Row Level Security (RLS) on all tables
3. Set up proper access policies
4. Monitor access logs regularly

**To enable RLS:**
- Go to **Database** → **Tables**
- For each table, click the three dots (⋮) → **Edit**
- Enable **Row Level Security** (RLS)
- Create policies to restrict access appropriately

#### Option B: Create a New Project (Most Secure)

If you want complete security:
1. Create a new Supabase project
2. Copy your database schema
3. Migrate your data
4. Update your application with new credentials

**To create a new project:**
- Click on your organization name at the top
- Click **New Project**
- Follow the setup wizard
- Note the new Project URL and anon key

### 6. Update Your Local `.env` File

Once you have your credentials (either enhanced security or new project):

```bash
# Navigate to your project directory
cd /path/to/merlin2

# Create .env file from example
cp .env.example .env

# Edit the .env file
nano .env  # or use your preferred editor
```

Add your credentials:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR-NEW-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-NEW-ANON-KEY-HERE

# Auth Configuration
VITE_AUTH_PROVIDER=supabase

# App Configuration
VITE_APP_NAME=Merlin BESS
VITE_APP_VERSION=2.0.0
```

**Save the file** (Ctrl+O, Enter, Ctrl+X in nano)

### 7. Set Credentials for Fly.io Deployment

If you're deploying to Fly.io, set the credentials as secrets:

```bash
flyctl secrets set VITE_SUPABASE_URL=https://YOUR-NEW-PROJECT-ID.supabase.co
flyctl secrets set VITE_SUPABASE_ANON_KEY=YOUR-NEW-ANON-KEY-HERE
```

This will trigger an automatic redeployment with the new credentials.

### 8. Verify Everything Works

Test your application locally:

```bash
npm run dev
```

Try to:
- Create an account
- Log in
- Save a project
- Load a project

If everything works, you're good to go!

### 9. Update Team Members

If you're working with a team:
1. **DO NOT** commit the `.env` file to git
2. Share credentials securely (use password manager, encrypted message, or secure channel)
3. Each team member should update their local `.env` file

## Quick Reference

### Where to Find Credentials in Supabase:
1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Click **Settings** (⚙️) → **API**
4. Copy **Project URL** and **anon public** key

### Where to Put Credentials Locally:
- File: `.env` in your project root
- Never commit this file (it's in `.gitignore`)

### Where to Put Credentials for Fly.io:
```bash
flyctl secrets set VITE_SUPABASE_URL=your-url
flyctl secrets set VITE_SUPABASE_ANON_KEY=your-key
```

## Security Best Practices

✅ **DO:**
- Keep credentials in `.env` file (ignored by git)
- Use Fly.io secrets for production
- Enable Row Level Security (RLS) in Supabase
- Monitor access logs regularly
- Use environment variables for all sensitive data

❌ **DON'T:**
- Commit `.env` file to git
- Share credentials via email, Slack, or other unsecured channels
- Use the same credentials across multiple projects
- Ignore security warnings or suspicious activity

## Troubleshooting

### "Invalid API key" error
- Double-check you copied the full key (no extra spaces)
- Verify you're using the anon/public key (not service_role)
- Make sure the Project URL matches your key

### Application can't connect to Supabase
- Verify `.env` file exists in project root
- Check that variables start with `VITE_` (required for Vite)
- Restart development server after changing `.env`

### Fly.io deployment can't connect
- List secrets: `flyctl secrets list`
- Verify secrets are set correctly
- Redeploy: `flyctl deploy`

## Need More Help?

- **Supabase Docs**: [https://supabase.com/docs/guides/api](https://supabase.com/docs/guides/api)
- **Supabase Support**: [https://supabase.com/support](https://supabase.com/support)
- **Fly.io Secrets**: [https://fly.io/docs/reference/secrets/](https://fly.io/docs/reference/secrets/)

## Summary Checklist

- [ ] Logged into Supabase dashboard
- [ ] Enhanced security (RLS) or created new project
- [ ] Copied new Project URL and anon key
- [ ] Updated local `.env` file
- [ ] Set Fly.io secrets (if deploying)
- [ ] Tested application locally
- [ ] Verified authentication works
- [ ] Notified team members (if applicable)
- [ ] Deleted old credentials from password manager
- [ ] Monitored for suspicious activity

---

**Created**: 2025-11-05  
**For**: Repository Owner (@ugobe007)  
**Priority**: CRITICAL

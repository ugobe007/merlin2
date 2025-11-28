# 🔐 Supabase Migration Guide

## Current Status: ✅ Ready for Supabase (when site works)

The authentication system is now built with an **abstraction layer** that makes it super easy to swap from localStorage to Supabase.

---

## What's Been Done

### ✅ Auth Service Layer Created
**File:** `/src/services/authService.ts`

This service provides a clean interface:
- `signUp(email, password, firstName, lastName, company)`
- `signIn(email, password)`  
- `signOut()`
- `getCurrentUser()`
- `isAuthenticated()`

### ✅ Enhanced LocalStorage Auth (Current)
- Password hashing (simple hash for now)
- Session management with 30-day expiry
- Automatic session validation
- Better error messages
- User tier system (free, professional, enterprise_pro, business)

### ✅ Environment Variables Ready
- `.env` file created
- `.env.example` template for team
- Ready for Supabase credentials

### ✅ Components Updated
- `AuthModal.tsx` → Uses `authService`
- `BessQuoteBuilder.tsx` → Uses `authService.isAuthenticated()`

---

## When Supabase Works: 5-Minute Migration

### Step 1: Get Supabase Credentials
1. Finish creating your Supabase project (when region dropdown works)
2. Go to **Project Settings → API**
3. Copy:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon/public key: `eyJhbGciOi...`

### Step 2: Update Environment Variables
Edit `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_AUTH_PROVIDER=supabase  # Change from localStorage
```

### Step 3: Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Step 4: Enable Email Auth in Supabase
1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. (Optional) Configure email templates
4. (Optional) Disable email confirmation for faster signup

### Step 5: Create Supabase Auth Service
Create new file: `/src/services/supabaseAuthService.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { User, AuthResponse } from './authService';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

class SupabaseAuthService {
  async signUp(email: string, password: string, firstName: string, lastName: string, company?: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            company,
            tier: 'free'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          firstName,
          lastName,
          company,
          tier: 'free',
          createdAt: data.user.created_at
        };
        return { success: true, user };
      }

      return { success: false, error: 'Signup failed' };
    } catch (error) {
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          firstName: data.user.user_metadata.first_name || '',
          lastName: data.user.user_metadata.last_name || '',
          company: data.user.user_metadata.company,
          tier: data.user.user_metadata.tier || 'free',
          createdAt: data.user.created_at
        };
        return { success: true, user };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  getCurrentUser(): User | null {
    const { data } = supabase.auth.getUser();
    if (!data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email!,
      firstName: data.user.user_metadata.first_name || '',
      lastName: data.user.user_metadata.last_name || '',
      company: data.user.user_metadata.company,
      tier: data.user.user_metadata.tier || 'free',
      createdAt: data.user.created_at
    };
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
}

export const supabaseAuthService = new SupabaseAuthService();
```

### Step 6: Swap the Service
Edit `/src/services/authService.ts` - **change last line:**

```typescript
// OLD:
export const authService = new LocalStorageAuthService();

// NEW:
import { supabaseAuthService } from './supabaseAuthService';
export const authService = supabaseAuthService;
```

### Step 7: Test & Deploy
```bash
npm run build
npm run dev  # Test locally
git add .
git commit -m "Migrate to Supabase authentication"
git push origin main
fly deploy
```

---

## Benefits of This Approach

### ✅ Zero Component Changes
- `AuthModal`, `BessQuoteBuilder`, and all other components don't need any changes
- They use `authService` - we just swap what that points to

### ✅ Easy Rollback
If Supabase has issues, just change back to localStorage:
```typescript
export const authService = new LocalStorageAuthService();
```

### ✅ Current System Works Great
- Password hashing
- Session expiry (30 days)
- Proper user management
- Tier system ready

### ✅ Future Ready
When Supabase is working, you get:
- ✅ Real backend authentication
- ✅ Works across devices
- ✅ Secure password hashing (bcrypt on backend)
- ✅ Email verification (optional)
- ✅ Password reset flows
- ✅ OAuth providers (Google, GitHub, etc.)
- ✅ Row Level Security for database
- ✅ Ready for saved projects in database

---

## Next Steps

1. **Wait for Supabase** region dropdown to work
2. **Complete project creation** in Supabase dashboard
3. **Follow Steps 1-7** above (takes ~5 minutes)
4. **Test thoroughly** before deploying

---

## Contact

When Supabase is ready, let me know and I'll help with the final migration!

🪄 **The magic is in the abstraction!** ✨

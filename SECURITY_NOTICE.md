# Security Notice

## ⚠️ CRITICAL: Credential Rotation Required

### Issue
The `.env` file containing real Supabase credentials was previously tracked in git and has now been removed. However, **these credentials remain in the git history** and should be considered **compromised**.

### Affected Credentials
- **VITE_SUPABASE_URL**: `https://fvmpmozybmtzjvikrctq.supabase.co`
- **VITE_SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Required Actions

1. **Rotate Supabase Credentials** (URGENT)
   - Log into Supabase dashboard at https://supabase.com
   - Navigate to your project settings
   - Generate new anon key
   - Update the new credentials in your local `.env` file
   - Share new credentials securely with team members (never via git)

2. **Review Supabase Security Settings**
   - Check Row Level Security (RLS) policies
   - Review API access logs for any suspicious activity
   - Ensure database permissions are properly restricted

3. **Update .env File Locally**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your new credentials
   # Never commit this file to git
   ```

4. **For Repository Administrators** (Optional but Recommended)
   - Consider using git-filter-repo or BFG Repo-Cleaner to remove sensitive data from git history
   - Force push the cleaned history (coordinate with all team members)
   - Or simply rotate credentials and monitor for any unauthorized access

### Prevention
- `.env` is now explicitly added to `.gitignore`
- Consider using environment-specific configuration management
- Use GitHub Secrets or similar for CI/CD pipelines
- Never commit credentials, API keys, or secrets to version control

### Status
- [x] .env removed from git tracking
- [x] .env added to .gitignore
- [ ] **Supabase credentials rotated** (REQUIRED - Do this immediately)
- [ ] Team members notified about new credentials
- [ ] Security audit completed

### References
- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api#api-keys)
- [GitHub: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---
**Created**: 2025-11-05  
**Priority**: CRITICAL  
**Action Required By**: Repository Owner (@ugobe007)

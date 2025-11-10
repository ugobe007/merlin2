# Fly.io Deployment Checklist for Merlin2

Use this checklist to deploy your application to Fly.io.

## Pre-Deployment Checklist

- [ ] **Security**: Rotate Supabase credentials (see SECURITY_NOTICE.md)
- [ ] **Account**: Have Fly.io account ([Sign up](https://fly.io/app/sign-up))
- [ ] **CLI**: Install Fly.io CLI ([Guide](https://fly.io/docs/hands-on/install-flyctl/))
- [ ] **Build**: Verify `npm run build` works locally
- [ ] **Git**: Commit all changes

## Deployment Steps

### 1. Login to Fly.io
```bash
flyctl auth login
```

### 2. Deploy Application
```bash
flyctl deploy
```

This will:
- Build Docker image using multi-stage build
- Push to Fly.io registry
- Deploy to https://merlin2.fly.dev

### 3. Set Supabase Credentials
**Important**: Use NEW rotated credentials (not the old ones from git history)

```bash
flyctl secrets set VITE_SUPABASE_URL=https://your-project.supabase.co
flyctl secrets set VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

After setting secrets, the app will automatically redeploy.

### 4. Verify Deployment
```bash
# Check status
flyctl status

# View logs
flyctl logs

# Open in browser
flyctl open
```

## Post-Deployment Checklist

- [ ] **Test**: Visit https://merlin2.fly.dev and verify app works
- [ ] **Login**: Test Supabase authentication
- [ ] **Features**: Test key features (wizard, quote generation, etc.)
- [ ] **Mobile**: Test on mobile devices
- [ ] **Performance**: Check loading times

## Configuration Files

All configuration files are ready:

✅ **Dockerfile** (multi-stage build)
- Stage 1: Build with Node 20
- Stage 2: Serve with nginx
- Exposes port 8080

✅ **nginx.conf** (optimized)
- Listens on port 8080
- Gzip compression enabled
- Security headers configured
- Client-side routing support
- Static asset caching

✅ **fly.toml** (app configuration)
- App name: merlin2
- Region: Los Angeles (lax)
- Internal port: 8080
- Auto-scaling enabled
- Memory: 1GB

✅ **.dockerignore**
- Excludes node_modules, dist, .git
- Keeps Docker image small

## Common Commands

```bash
# View logs
flyctl logs

# SSH into container
flyctl ssh console

# Restart app
flyctl apps restart merlin2

# View dashboard
flyctl dashboard

# Scale memory
flyctl scale memory 2048

# Scale instances
flyctl scale count 2

# List secrets
flyctl secrets list

# Remove secret
flyctl secrets unset SECRET_NAME
```

## Troubleshooting

### Build Fails
1. Test `npm run build` locally
2. Check Node version matches Dockerfile (20)
3. Verify all dependencies in package.json

### App Won't Start
1. Check logs: `flyctl logs`
2. Verify port 8080 is consistent across all configs
3. SSH in: `flyctl ssh console`

### Supabase Not Working
1. Verify secrets are set: `flyctl secrets list`
2. Check credentials are correct (NEW rotated ones)
3. Verify Supabase project is active

### Performance Issues
1. Check bundle size (currently 1.4MB)
2. Consider code splitting
3. Scale up: `flyctl scale memory 2048`

## Cost

**Free Tier**: Up to 3 shared-cpu VMs, 160GB bandwidth/month

Your app should fit within free tier with:
- Auto-scaling (min_machines_running = 0)
- 1GB RAM
- 1 CPU
- Single region

## Next Steps

1. [ ] Set up custom domain (optional)
2. [ ] Configure monitoring/alerts
3. [ ] Set up CI/CD pipeline
4. [ ] Review security settings
5. [ ] Optimize bundle size

## Important Notes

⚠️ **Remember to rotate Supabase credentials** - The old credentials in git history should be considered compromised.

✅ **All ports aligned** - Dockerfile (8080), nginx.conf (8080), and fly.toml (8080) all match.

✅ **Build tested** - Application builds successfully locally.

---

For detailed deployment guide, see: **FLY_DEPLOYMENT.md**

For security information, see: **SECURITY_NOTICE.md**

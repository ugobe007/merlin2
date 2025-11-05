# Fly.io Deployment Guide for Merlin2 BESS Quote Builder

## Prerequisites
- Fly.io account ([Sign up here](https://fly.io/app/sign-up))
- Fly CLI installed ([Installation guide](https://fly.io/docs/hands-on/install-flyctl/))
- Git repository with your code

## Important: Before Deployment

⚠️ **Rotate Supabase Credentials First** - See `SECURITY_NOTICE.md`

The `.env` file was previously committed to git. You must:
1. Rotate your Supabase credentials
2. Set new credentials as Fly.io secrets (see step 5 below)

## Quick Deploy Steps

### 1. Login to Fly.io
```bash
flyctl auth login
```

### 2. Verify Configuration Files

Your repository already has:
- ✅ `Dockerfile` - Multi-stage build with nginx
- ✅ `nginx.conf` - Optimized nginx configuration (port 8080)
- ✅ `fly.toml` - Fly.io configuration
- ✅ `.dockerignore` - Excludes unnecessary files

### 3. Build Locally (Optional but Recommended)

Test the build before deploying:
```bash
npm install
npm run build
```

If successful, you should see a `dist` folder with your built application.

### 4. Deploy to Fly.io

```bash
flyctl deploy
```

This will:
- Build your Docker container using the multi-stage Dockerfile
- Push it to Fly.io's registry
- Deploy your app
- Give you a URL like: `https://merlin2.fly.dev`

### 5. Set Environment Variables (Supabase)

Set your Supabase credentials as secrets (use NEW rotated credentials):

```bash
flyctl secrets set VITE_SUPABASE_URL=https://your-project.supabase.co
flyctl secrets set VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

**Note**: These environment variables will be available at build time in the Docker container.

### 6. Check Deployment Status

```bash
# View app status
flyctl status

# View logs
flyctl logs

# Open your app in browser
flyctl open
```

Your app will be live at: **https://merlin2.fly.dev** 🚀

## Configuration Details

### Current fly.toml Settings
```toml
app = 'merlin2'
primary_region = 'lax'  # Los Angeles

[http_service]
  internal_port = 8080  # Matches Dockerfile and nginx
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

### Dockerfile Details
- Uses Node 20 Alpine for building
- Multi-stage build (keeps final image small)
- Production build served via nginx
- Exposes port 8080

## Custom Domain (Optional)

To use your own domain:

```bash
flyctl certs create yourdomain.com
flyctl certs create www.yourdomain.com
```

Then add DNS records:
- CNAME: `yourdomain.com` → `merlin2.fly.dev`
- CNAME: `www.yourdomain.com` → `merlin2.fly.dev`

## Scaling Options

```bash
# Increase memory if needed
flyctl scale memory 2048

# Run multiple instances
flyctl scale count 2

# Change region
flyctl regions add iad  # US East
flyctl regions add fra  # Frankfurt
```

## Cost Estimate

- **Free tier**: Up to 3 shared-cpu VMs, 160GB bandwidth/month
- **Your app**: Should fit in free tier with minimal traffic
- **Auto-scaling**: Only runs when accessed (min_machines_running = 0)

## Troubleshooting

### View Logs
```bash
flyctl logs -a merlin2
```

### SSH Into Container
```bash
flyctl ssh console -a merlin2
```

### Restart App
```bash
flyctl apps restart merlin2
```

### Build Issues

If the build fails:
1. Check that `npm run build` works locally
2. Verify all dependencies are in `package.json`
3. Check the Dockerfile is using the correct Node version

### Port Configuration

If you see port errors:
- Dockerfile exposes port 8080
- nginx.conf listens on port 8080
- fly.toml internal_port is 8080
- All three must match!

## Updating Your Deployment

When you make code changes:

```bash
# Option 1: Deploy directly
flyctl deploy

# Option 2: Via Git (if using GitHub Actions)
git add .
git commit -m "Your changes"
git push
# Then trigger deployment
```

## What Gets Deployed

✅ React 19 + TypeScript production build  
✅ Optimized with Vite  
✅ Served via nginx (port 8080)  
✅ HTTPS enabled automatically  
✅ Client-side routing configured  
✅ Static assets cached (1 year)  
✅ Security headers enabled  
✅ Gzip compression enabled

## Monitoring

View your app dashboard:
```bash
flyctl dashboard
```

Or visit: https://fly.io/dashboard/merlin2

## Security Notes

1. ✅ HTTPS is enforced (force_https = true)
2. ✅ Supabase credentials stored as secrets (not in code)
3. ✅ Security headers configured in nginx
4. ✅ No sensitive files in Docker image (.dockerignore)

## Next Steps After Deployment

1. Test your deployed application thoroughly
2. Set up custom domain (optional)
3. Configure monitoring/alerts
4. Set up CI/CD pipeline (optional)
5. Review and optimize based on usage

## Support

- Fly.io Docs: https://fly.io/docs/
- Fly.io Community: https://community.fly.io/
- GitHub Issues: For app-specific issues

---

**Your Merlin BESS Quote Builder is ready to deploy!** 🚀

# Fly.io Deployment Guide for Merlin2 BESS Quote Builder

## Prerequisites
- ✅ Fly.io account (you have one)
- ✅ Fly CLI installed (flyctl v0.3.193)
- ✅ Git repository set up

## Quick Deploy Steps

### 1. Login to Fly.io
```bash
flyctl auth login
```

### 2. Launch the App
```bash
cd /Users/robertchristopher/merlin2
flyctl launch --no-deploy
```

When prompted:
- **App name**: Choose a name (e.g., `merlin-bess-quote-builder` or let it auto-generate)
- **Region**: Choose closest to you (e.g., `iad` for US East)
- **PostgreSQL database**: No (we'll add Supabase later)
- **Redis database**: No

### 3. Review fly.toml
The launch command will create a `fly.toml` file. It should look similar to this:

```toml
app = "your-app-name"
primary_region = "iad"

[build]

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

### 4. Deploy to Fly.io
```bash
flyctl deploy
```

This will:
- Build your Docker container
- Push it to Fly.io
- Deploy your app
- Give you a URL like: `https://your-app-name.fly.dev`

### 5. Check Status
```bash
flyctl status
flyctl logs
```

### 6. Open Your App
```bash
flyctl open
```

## Configuration Options

### Custom Domain (Optional)
If you want to use a custom domain:

```bash
flyctl certs create yourdomain.com
flyctl certs create www.yourdomain.com
```

Then add DNS records:
- CNAME: `yourdomain.com` → `your-app-name.fly.dev`
- CNAME: `www.yourdomain.com` → `your-app-name.fly.dev`

### Environment Variables (If Needed)
```bash
flyctl secrets set SUPABASE_URL=your_supabase_url
flyctl secrets set SUPABASE_KEY=your_supabase_key
```

### Scale Your App
```bash
# Add more memory if needed
flyctl scale memory 2048

# Add more VMs
flyctl scale count 2
```

## Files Created
- ✅ `Dockerfile` - Multi-stage build with nginx
- ✅ `nginx.conf` - Optimized nginx configuration
- ✅ `fly.toml` - Will be created by `flyctl launch`

## Cost Estimate
- **Free tier**: 3 shared-cpu VMs, 160GB bandwidth/month
- **Your app**: Should fit in free tier with minimal traffic
- **Scales automatically**: Only pay for actual usage

## Troubleshooting

### Check logs if something goes wrong:
```bash
flyctl logs -a your-app-name
```

### SSH into your app:
```bash
flyctl ssh console -a your-app-name
```

### Restart your app:
```bash
flyctl apps restart your-app-name
```

## Future Updates

When you make changes:
```bash
git add .
git commit -m "Your changes"
git push
flyctl deploy
```

## What Gets Deployed
- ✅ React 19 + TypeScript production build
- ✅ Optimized with Vite
- ✅ Served via nginx
- ✅ HTTPS enabled
- ✅ Client-side routing configured
- ✅ Static assets cached (1 year)
- ✅ Security headers enabled

Your Merlin BESS Quote Builder will be live at:
**https://your-app-name.fly.dev** 🚀

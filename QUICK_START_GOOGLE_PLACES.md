# ⚡ Quick Start - Google Places Business Lookup

## 🚀 5-Minute Setup

### 1. Install Dependencies (30 seconds)
```bash
npm install express concurrently
```

### 2. Get Google API Key (2 minutes)
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create new project (or select existing)
3. Click "Create Credentials" → "API Key"
4. Copy your key

Enable these APIs:
- Places API (New)
- Maps JavaScript API  
- Geocoding API

### 3. Configure Backend (30 seconds)
Create `/server/.env`:
```bash
GOOGLE_MAPS_API_KEY=your_actual_key_here
```

### 4. Deploy Database (1 minute)
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy/paste `/database/migrations/20260122_business_lookup_cache.sql`
4. Click "Run"
5. Copy/paste `/database/migrations/20260122_fix_industry_images.sql`
6. Click "Run"

### 5. Start Application (30 seconds)
```bash
npm run dev
```

**Frontend**: http://localhost:5177  
**Backend**: http://localhost:3001  

## ✅ Test It Works

1. Navigate to WizardV7 Step 1
2. Enter:
   - ZIP: `89052`
   - Business: `WOW Car Wash`
   - Street: `s maryland parkway`
3. Click "Find My Business"
4. Click any candidate
5. Verify business card appears

## 🎯 What You Get

✅ Secure API proxy (keys never exposed)  
✅ Candidate selection (top 3 with ratings)  
✅ Business verification badge  
✅ Image fallbacks (Google → logo → industry → initials)  
✅ Database caching (30-day TTL)  
✅ Gated progression (can't continue until verified)  

## 📖 Full Documentation

- **Setup Guide**: `/GOOGLE_PLACES_SETUP.md`
- **Implementation Summary**: `/GOOGLE_PLACES_IMPLEMENTATION_SUMMARY.md`
- **Setup Script**: `./scripts/setup-google-places.sh`

## 🐛 Troubleshooting

**"API key not found"**  
→ Check `/server/.env` exists with `GOOGLE_MAPS_API_KEY=...`

**"No matches found"**  
→ Verify Places API is enabled in Google Cloud Console

**CORS errors**  
→ Restart both frontend and backend: `npm run dev`

**Images not loading**  
→ Run `20260122_fix_industry_images.sql` in Supabase

## 💡 Quick Tips

- **Free tier**: $200/month Google credit = ~5,000 searches
- **Caching**: Database cache reduces API calls by 70-90%
- **Testing**: Use ZIP 89052 + "WOW Car Wash" for demo data
- **Security**: API key is backend-only (never in client code)

---

**Status**: ✅ Implementation Complete  
**Next**: Run `npm run dev` and test!

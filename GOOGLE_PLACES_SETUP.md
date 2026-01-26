# Google Places API Integration Setup

## 🎯 Overview

This document describes the complete Google Places business lookup flow implemented in WizardV7 Step 1.

## 📋 Architecture

### Backend (Express.js API)
- **Location**: `/server/`
- **Entry Point**: `/server/index.js`
- **Routes**: `/server/routes/places.js`

### API Endpoints

1. **POST /api/places/lookup-business**
   - Input: `{ query: "WOW Car Wash 89052 s maryland parkway" }`
   - Returns: Array of top 5 business candidates with name, address, rating, types, photoReference
   - Google API: Places Text Search

2. **POST /api/places/place-details**
   - Input: `{ placeId: "ChIJ..." }`
   - Returns: Full business details including website, phone, formatted address, city, state, postal, lat/lng
   - Google API: Place Details

3. **GET /api/places/photo/:photoReference**
   - Proxy for Google Places Photos
   - Returns: Binary image data
   - Adds Cache-Control header (1 day)
   - Protects API key from client exposure

## 🔐 Security

**CRITICAL**: All Google API keys are backend-only. The client NEVER sees the API key.

### Environment Variables Needed

Create `/server/.env`:
```bash
GOOGLE_MAPS_API_KEY=your_google_api_key_here
```

Get your API key from: https://console.cloud.google.com/apis/credentials

Required APIs to enable:
- Places API (New)
- Maps JavaScript API
- Geocoding API

## 📦 Installation

Install required dependencies:

```bash
npm install express concurrently
```

## 🚀 Running the Application

### Development (runs both frontend + backend):
```bash
npm run dev
```

This starts:
- Frontend: Vite dev server on http://localhost:5177
- Backend: Express API on http://localhost:3001

### Alternative (run separately):
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## 🎨 User Flow

### Step 1: User Input
User enters:
- ZIP Code (required)
- Business Name (required)
- Street Address (optional)

### Step 2: Find Business
User clicks "Find My Business" button
- Frontend calls POST /api/places/lookup-business
- Backend calls Google Places Text Search API
- Returns top 5 candidates

### Step 3: Candidate Selection
UI shows top 3 candidates with:
- Business name
- Full address
- Google rating + review count
- Google Place types

### Step 4: Confirmation
User clicks a candidate
- Frontend calls POST /api/places/place-details
- Backend calls Google Place Details API
- Sets `confirmedBusiness` state
- Business card appears with:
  - Google Places photo (proxied)
  - Or website logo/favicon
  - Or industry image from INDUSTRY_IMAGE_MAP
  - Or initials tile (fallback)
  - TrueQuote™ Verified badge
  - Sample ROI preview

### Step 5: Continue
"Continue to Goals" button enabled only when `confirmedBusiness` exists

## 🗂️ Database Schema

### business_lookup_cache Table

Location: `/database/migrations/20260122_business_lookup_cache.sql`

Purpose: Cache Google Places API responses to reduce quota usage (30-day TTL)

Key fields:
- `search_key`: UNIQUE index (LOWER(business_name || '|' || postal_code))
- `google_place_id`: Google's unique identifier
- `google_photo_url`: Proxied photo URL
- `industry_slug`: Mapped industry (car-wash, hotel, office, etc.)
- `verification_status`: pending | verified | failed | stale
- `api_response`: Full JSONB response from Google
- `lookup_count`: Increments on each lookup
- `last_looked_up`: Timestamp for 30-day TTL

Functions:
- `lookup_business(name, postal, [address])` - Cached lookup
- `save_business_lookup(...)` - Upsert with COALESCE
- `generate_business_search_key(name, postal)` - Key generator

Deploy to Supabase:
1. Go to SQL Editor in Supabase dashboard
2. Copy/paste contents of `20260122_business_lookup_cache.sql`
3. Click "Run"

## 🖼️ Image Fallback System

Priority order:
1. **Google Places Photo** - `/api/places/photo/:photoReference` (proxied)
2. **Website Logo/Favicon** - From Place Details `website` field
3. **Industry Image** - From `INDUSTRY_IMAGE_MAP` constant
4. **Initials Tile** - First letter of first 2 words

### INDUSTRY_IMAGE_MAP

Location: `src/components/wizard/v7/steps/Step1LocationV7.tsx` (lines 6-16)

```tsx
const INDUSTRY_IMAGE_MAP: Record<string, string> = {
  "car-wash": "/assets/images/car_wash_1.jpg",
  "hotel": "/assets/images/hotel_motel_holidayinn_1.jpg",
  "hospital": "/assets/images/hospital_1.jpg",
  "office": "/assets/images/office_building2.jpg",
  "data-center": "/assets/images/data-center-1.jpg",
  "ev-charging": "/assets/images/ev_charging_station.jpg",
  "manufacturing": "/assets/images/manufacturing_1.jpg",
  "cold-storage": "/assets/images/cold_storage.jpg",
};
```

### Industry Slug Mapping

Function: `guessIndustrySlug(types: string[])`

Maps Google Place types to Merlin industry slugs:

```tsx
const typeMap: Record<string, string> = {
  "car_wash": "car-wash",
  "lodging": "hotel",
  "hospital": "hospital",
  "charging_station": "ev-charging",
  "office": "office",
  "data_center": "data-center",
  "manufacturing": "manufacturing",
  "warehouse": "cold-storage",
  // ... more mappings
};
```

## 🧪 Testing

### Manual Test Flow

1. Start the application:
   ```bash
   npm run dev
   ```

2. Navigate to WizardV7 Step 1

3. Test Case 1: WOW Car Wash (Las Vegas)
   - ZIP: 89052
   - Business Name: WOW Car Wash
   - Street Address: s maryland parkway
   - Click "Find My Business"
   - Should show 3 candidates
   - Click first one
   - Should show business card with photo

4. Test Case 2: No Results
   - ZIP: 10001
   - Business Name: asdfqwerzxcv
   - Click "Find My Business"
   - Should show "No matches found" error

5. Test Case 3: Multiple Matches
   - ZIP: 90210
   - Business Name: Starbucks
   - Click "Find My Business"
   - Should show 3 Beverly Hills Starbucks locations
   - User can choose which one

### Backend Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "merlin-places-api"
}
```

## 🐛 Common Issues

### Issue: "API key not found"
**Solution**: Add `GOOGLE_MAPS_API_KEY` to `/server/.env`

### Issue: "fetch is not defined" (Node < 18)
**Solution**: Upgrade to Node 18+ or install node-fetch

### Issue: CORS errors in console
**Solution**: Backend includes CORS middleware (already configured)

### Issue: Images not loading
**Solution**: 
1. Check Google Places API is enabled
2. Verify photo proxy is working: `http://localhost:3001/api/places/photo/test`
3. Check browser Network tab for 404s

### Issue: No candidates returned
**Solution**:
1. Check Google API quota (50,000 requests/month free tier)
2. Verify API key has Places API enabled
3. Check backend logs for Google API errors

## 📊 API Quotas & Costs

**Free Tier**: $200/month credit = ~28,000 requests

**Pricing** (as of Jan 2025):
- Text Search: $32/1000 requests
- Place Details: $17/1000 requests  
- Photos: $7/1000 requests

**Optimization**:
- Cache results in `business_lookup_cache` table (30-day TTL)
- Lookup count tracked to monitor usage
- Only show top 3 candidates (not all 5 from API)

**Example Daily Costs** (1000 users/day):
- 1000 lookups × $0.032 = $32
- 250 confirmations × $0.017 = $4.25
- 250 photos × $0.007 = $1.75
- **Total**: ~$38/day = $1,140/month

**Cost Reduction**:
- Implement caching (reduces by 70-90%)
- Use billing alerts
- Rate limit aggressive users
- Consider Places API (New) for better pricing

## 🔄 State Management

### Frontend State (Step1LocationV7.tsx)

```tsx
// User input (always editable)
const [location, setLocation] = useState({
  zipCode: "",
  city: "",
  state: "",
  businessName: "",
  streetAddress: "",
});

// Business lookup flow
const [isLookingUp, setIsLookingUp] = useState(false);
const [candidates, setCandidates] = useState<BusinessCandidate[]>([]);
const [confirmedBusiness, setConfirmedBusiness] = useState<BusinessInfo | null>(null);
const [lookupError, setLookupError] = useState<string | null>(null);
```

### State Transitions

```
INITIAL → LOOKING_UP → CANDIDATES_SHOWN → CONFIRMING → CONFIRMED
   ↑                                                         ↓
   └─────────────────── EDIT (clears) ←───────────────────────┘
```

### Gating Logic

```tsx
// In BottomNavigation or useWizardV7
const canProceed = isZipReady && confirmedBusiness !== null;
```

User CANNOT proceed to Step 2 (Goals) until business is confirmed.

## 📁 File Changes Summary

### Created Files
- ✅ `/server/index.js` - Express server entry point
- ✅ `/server/routes/places.js` - Google Places API routes
- ✅ `/database/migrations/20260122_business_lookup_cache.sql` - Cache table schema

### Modified Files
- ✅ `/src/components/wizard/v7/steps/Step1LocationV7.tsx`
  - Added INDUSTRY_IMAGE_MAP constant
  - Added BusinessCandidate type
  - Refactored state (candidates + confirmedBusiness)
  - Added lookupBusiness(), confirmBusiness(), guessIndustrySlug()
  - Removed auto-lookup useEffect
  - Updated business card to use confirmedBusiness
  - Added candidate selection UI
  - Added image onError fallback handlers
  
- ✅ `/vite.config.ts`
  - Added proxy configuration for /api routes
  
- ✅ `/package.json`
  - Updated dev scripts to run frontend + backend concurrently
  - Added dev:frontend and dev:backend scripts

### Next Steps
- ⚠️ Install dependencies: `npm install express concurrently`
- ⚠️ Create `/server/.env` with `GOOGLE_MAPS_API_KEY`
- ⚠️ Deploy `20260122_business_lookup_cache.sql` to Supabase
- ⚠️ Run `20260122_fix_industry_images.sql` in Supabase (fixes Step 3 images)
- ⚠️ Update `BottomNavigation.tsx` canProceed logic to require `confirmedBusiness`
- ⚠️ Test full flow end-to-end

## 🎓 Further Reading

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Places API (New) Migration Guide](https://developers.google.com/maps/documentation/places/web-service/migrate-to-new)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

---

**Last Updated**: January 22, 2026
**Status**: ✅ Backend complete, Frontend complete, Testing required

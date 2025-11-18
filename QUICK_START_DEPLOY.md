# 🚀 Quick Start - Test & Deploy Merlin2

## 1️⃣ Test Locally (Recommended First)

### Start Dev Server
```bash
cd /Users/robertchristopher/merlin2
npm run dev
```

**Test URL**: http://localhost:5173

### Test Data Center Calculations
1. Click "Smart Wizard"
2. Select **"Data Center"** template
3. Fill in questionnaire:
   - **Capacity**: 100 (MW)
   - **Grid Connection**: Single Grid Connection
   - **Uptime**: Tier III
   - **Cooling**: Air-cooled
4. Click "Next" to see recommendations

### ✅ Expected Results
- **BESS Size**: ~50MW / 3hr (NOT 2MW!)
- **Generator**: ~20MW
- **Solar**: ~1.5MW
- **Savings**: $100-200K/year
- **ROI**: 4-7 years

### ❌ If It Shows 2MW - There's Still a Bug
Check console (F12) for errors and verify:
```javascript
// Look in console for:
Data Center Capacity: 100
Parsed Capacity: 100
Calculated BESS: 50MW
```

---

## 2️⃣ Deploy to Production

### Option A: Use Deployment Script (Recommended)
```bash
cd /Users/robertchristopher/merlin2
./deploy-to-fly.sh
```

The script will:
- ✅ Check dependencies
- ✅ Run TypeScript checks
- ✅ Build production bundle
- ✅ Offer to test locally
- ✅ Deploy to Fly.io
- ✅ Verify deployment

### Option B: Manual Deployment
```bash
cd /Users/robertchristopher/merlin2

# 1. Install dependencies
npm install

# 2. Type check
npm run type-check

# 3. Build
npm run build

# 4. Test build locally (optional)
npm run preview
# Visit http://localhost:4173

# 5. Deploy to Fly.io
fly deploy

# 6. Check status
fly status
fly logs
```

---

## 3️⃣ Verify on Production

**Production URL**: https://merlin2-fly.dev

### Test Same Scenario
1. Navigate to https://merlin2-fly.dev
2. Click "Smart Wizard"
3. Select "Data Center"
4. Enter: 100MW, Single Grid, Tier III
5. Verify: Should show ~50MW / 3hr

### Check New Features
- ✅ **AI Data Collection** tab in Admin Panel
- ✅ **Pricing Admin** "Check Status" button works
- ✅ Centralized calculations active
- ✅ Smart Wizard gives proper recommendations

---

## 4️⃣ Troubleshooting

### If Build Fails
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### If Deployment Fails
```bash
# Check Fly.io status
fly status

# View logs
fly logs

# Check app info
fly info
```

### If Calculation Still Wrong
1. Check browser console (F12)
2. Look for errors in Network tab
3. Verify API calls are returning correct data
4. Check that env variables are set:
   ```bash
   fly secrets list
   ```

---

## 5️⃣ Post-Deployment Checklist

- [ ] Home page loads
- [ ] Smart Wizard opens
- [ ] Data center template works
- [ ] 100MW input gives ~50MW recommendation
- [ ] Admin Panel loads
- [ ] AI Data Collection tab visible
- [ ] Pricing Admin "Check Status" works
- [ ] No console errors
- [ ] Mobile responsive

---

## 📊 Key Files Changed

- ✅ `src/components/AdminDashboard.tsx` - Added AI Data Collection tab
- ✅ `src/components/admin/AIDataCollectionAdmin.tsx` - New component
- ✅ `src/components/PricingAdminDashboard.tsx` - Fixed Check Status
- ✅ `src/components/AdvancedQuoteBuilder.tsx` - Electrical specs styling, icon improvements
- ✅ All calculation services - Using centralized formulas

---

## 🔗 Quick Links

- **Dev Server**: http://localhost:5173
- **Production**: https://merlin2-fly.dev
- **Fly.io Dashboard**: https://fly.io/dashboard
- **Test Doc**: `test-datacenter-calculations.md`

---

## 💡 Tips

- Always test locally before deploying
- Use `npm run preview` to test production build
- Check Fly.io logs if something goes wrong: `fly logs`
- The deployment takes ~2-3 minutes
- Clear browser cache if you see old version

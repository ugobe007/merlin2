# Quick Start Guide - New Quote Features

## 🚀 Accessing the New Features

### 1. Watermarked Quote Exports
**Already Active!** No setup needed.

1. Open **Advanced Quote Builder** from main menu
2. Configure your BESS project
3. Click **"View Quote Preview"**
4. Choose export format:
   - 📄 **Word** - Professional .docx with header/footer watermark
   - 📑 **PDF** - Print-friendly with diagonal watermark
   - 📊 **Excel** - CSV with watermark header

**Default watermark**: "merlin certified -- [today's date]"

---

### 2. Customize Watermark Appearance
**Requires admin panel integration**

#### Option A: Direct Component Usage
Add to your admin panel or settings page:

```typescript
import AdminWatermarkSettings from './components/AdminWatermarkSettings';

// In your component:
const [showWatermarkSettings, setShowWatermarkSettings] = useState(false);

{showWatermarkSettings && (
  <AdminWatermarkSettings onClose={() => setShowWatermarkSettings(false)} />
)}
```

#### Option B: Quick Test (Console)
Open browser console and run:
```javascript
// Set custom watermark
localStorage.setItem('merlin_watermark_settings', JSON.stringify({
  enabled: true,
  text: 'CONFIDENTIAL',
  useCustomText: true,
  opacity: 15,
  color: '#ff0000',
  fontSize: 64,
  rotation: -45
}));

// Reload page to see changes
location.reload();
```

#### Customization Options
- **Text**: Any text (default: "merlin certified")
- **Opacity**: 5-50% (default: 10%)
- **Color**: Any hex color (default: #0b74de blue)
- **Font Size**: 24-96px (default: 48px)
- **Rotation**: -90° to +90° (default: -30°)

---

### 3. AI Assistant Note Toggle
**Already Active!** In Advanced Quote Builder.

1. Go to **Advanced Quote Builder**
2. Select any **Grid Connection** type (AC-coupled, DC-coupled, etc.)
3. A checkbox appears: ☑️ *"Show AI Assistant limitation note in quote"*
4. Check/uncheck to control visibility
5. Note appears in quote preview AND exports

**Note text**: "NOTE: The AI Assistant is not working for [grid connection capacity]."

**Behavior**:
- Hidden if no grid connection selected
- Hidden if checkbox unchecked
- Shown in preview and all exports when enabled

---

### 4. RSS Auto-Fetch for Price Alerts
**Requires component integration**

#### Quick Start (Manual Fetch)
Add RSSControlPanel to admin area:

```typescript
import RSSControlPanel from './components/RSSControlPanel';

// In your admin component:
const [showRSSControl, setShowRSSControl] = useState(false);

{showRSSControl && (
  <RSSControlPanel onClose={() => setShowRSSControl(false)} />
)}
```

#### Using the Control Panel
1. Open **RSS Control Panel**
2. Click **"Fetch Now"** for immediate article collection
3. Monitor results: articles found, alerts created
4. Enable/disable individual sources as needed

#### Setting Up Scheduled Fetching
1. In RSS Control Panel, set **Fetch Interval** (1-24 hours)
2. Click **"Start Scheduled Fetch"**
3. System automatically fetches every N hours
4. Click **"Stop"** to disable

#### Programmatic Usage
Add to your app initialization (e.g., `main.tsx` or `App.tsx`):

```typescript
import { scheduleRSSFetching } from './services/rssAutoFetchService';

// Start fetching every 6 hours
const stopFetching = scheduleRSSFetching(6);

// To stop (e.g., on component unmount):
// stopFetching();
```

#### RSS Sources (10 feeds)
✅ Energy Storage News  
✅ ESS News  
✅ Microgrid Knowledge  
✅ Energy Storage Journal  
✅ PV Magazine  
✅ Utility Dive  
✅ Renewable Energy World  
✅ CleanTechnica  
✅ GTM (Greentech Media)  
✅ Energy Vault Newsroom

---

## 🎨 Integration Examples

### Example 1: Admin Menu with All Features
```typescript
import { useState } from 'react';
import { Settings, Droplet, Rss } from 'lucide-react';
import AdminWatermarkSettings from './components/AdminWatermarkSettings';
import RSSControlPanel from './components/RSSControlPanel';

function AdminMenu() {
  const [showWatermark, setShowWatermark] = useState(false);
  const [showRSS, setShowRSS] = useState(false);

  return (
    <div className="admin-menu">
      <h2>Admin Panel</h2>
      
      <button onClick={() => setShowWatermark(true)}>
        <Droplet /> Watermark Settings
      </button>
      
      <button onClick={() => setShowRSS(true)}>
        <Rss /> RSS Auto-Fetch Control
      </button>

      {showWatermark && (
        <AdminWatermarkSettings onClose={() => setShowWatermark(false)} />
      )}
      
      {showRSS && (
        <RSSControlPanel onClose={() => setShowRSS(false)} />
      )}
    </div>
  );
}
```

### Example 2: Navbar Integration
```typescript
import { Menu } from '@headlessui/react';
import { Cog, Droplet, Rss } from 'lucide-react';

<Menu>
  <Menu.Button>
    <Cog /> Settings
  </Menu.Button>
  
  <Menu.Items>
    <Menu.Item>
      {({ active }) => (
        <button onClick={() => setShowWatermarkSettings(true)}>
          <Droplet /> Watermark Settings
        </button>
      )}
    </Menu.Item>
    
    <Menu.Item>
      {({ active }) => (
        <button onClick={() => setShowRSSControl(true)}>
          <Rss /> RSS Control
        </button>
      )}
    </Menu.Item>
  </Menu.Items>
</Menu>
```

### Example 3: Background RSS Service
Add to `App.tsx` or `main.tsx`:

```typescript
import { useEffect } from 'react';
import { scheduleRSSFetching } from './services/rssAutoFetchService';

function App() {
  useEffect(() => {
    // Start RSS fetching on app load (every 8 hours)
    const cleanup = scheduleRSSFetching(8);
    
    // Cleanup on unmount
    return () => cleanup();
  }, []);

  return (
    // ... your app
  );
}
```

---

## 📋 Testing Your Implementation

### Test Watermarked Exports
1. ✅ Configure a quote in Advanced Quote Builder
2. ✅ Click "View Quote Preview"
3. ✅ Click each export button (Word/PDF/Excel)
4. ✅ Verify watermark appears in downloaded files
5. ✅ Check date is current

### Test Watermark Customization
1. ✅ Open AdminWatermarkSettings
2. ✅ Change text to "DRAFT"
3. ✅ Set opacity to 20%
4. ✅ Change color to red (#ff0000)
5. ✅ Preview updates in real-time
6. ✅ Click "Save Settings"
7. ✅ Export a quote and verify new watermark

### Test AI Note Toggle
1. ✅ Open Advanced Quote Builder
2. ✅ Select "AC-Coupled" grid connection
3. ✅ Verify checkbox appears
4. ✅ Uncheck → note disappears from preview
5. ✅ Check → note reappears
6. ✅ Export quote and verify note presence matches toggle

### Test RSS Auto-Fetch
1. ✅ Open RSSControlPanel
2. ✅ Click "Fetch Now"
3. ✅ Wait for results (10-30 seconds)
4. ✅ Verify articles count > 0
5. ✅ Check Supabase for new price_alerts records
6. ✅ Start scheduled fetch
7. ✅ Wait 1 hour, verify next fetch runs

---

## 🐛 Troubleshooting

### Watermark Not Showing
- Check localStorage: `localStorage.getItem('merlin_watermark_settings')`
- Verify `enabled: true` in settings
- Try reset: Delete localStorage key and reload

### Exports Not Working
- Check browser console for errors
- Verify docx and file-saver installed: `npm list docx file-saver`
- Try clearing cache: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### RSS Fetch Failing
- Check network tab for CORS errors
- Some feeds may block requests (expected)
- Verify rss-parser installed: `npm list rss-parser`
- Check console for specific feed errors

### AI Note Not Conditional
- Verify gridConnection has value (not empty string)
- Check showAiNote state in React DevTools
- Ensure checkbox is checked

---

## 📚 API Reference

### Export Functions
```typescript
import { 
  exportQuoteAsWord, 
  exportQuoteAsPDF, 
  exportQuoteAsExcel,
  getWatermarkStyle 
} from './utils/quoteExportUtils';

// Export quote as Word
await exportQuoteAsWord(quoteData);

// Export quote as PDF (opens print dialog)
exportQuoteAsPDF(quoteData);

// Export quote as Excel/CSV
exportQuoteAsExcel(quoteData);

// Get current watermark styling
const style = getWatermarkStyle();
// Returns: { enabled, text, opacity, color, fontSize, rotation }
```

### Watermark Functions
```typescript
import { 
  loadWatermarkSettings, 
  saveWatermarkSettings 
} from './components/AdminWatermarkSettings';

// Load settings from localStorage
const settings = loadWatermarkSettings();

// Save settings to localStorage
saveWatermarkSettings({
  enabled: true,
  text: 'DRAFT',
  useCustomText: true,
  opacity: 15,
  color: '#ff0000',
  fontSize: 48,
  rotation: -30
});
```

### RSS Functions
```typescript
import { 
  runRSSFetchCycle,
  scheduleRSSFetching,
  checkRSSFeedHealth,
  toggleRSSSource
} from './services/rssAutoFetchService';

// Fetch once
const result = await runRSSFetchCycle();
console.log(result); // { articlesFound, alertsCreated, errors }

// Schedule automatic fetching
const stopFn = scheduleRSSFetching(6); // Every 6 hours
// Later: stopFn();

// Check feed health
const health = await checkRSSFeedHealth();
console.log(health); // [{ source, status, articlesFound }]

// Enable/disable source
toggleRSSSource('Energy Storage News', false); // Disable
toggleRSSSource('Energy Storage News', true);  // Enable
```

---

## 🎯 Next Steps

1. **Add to Admin Panel**: Integrate AdminWatermarkSettings and RSSControlPanel
2. **Test Thoroughly**: Run through all test cases
3. **Configure RSS**: Enable/disable sources based on needs
4. **Customize Watermark**: Set company-specific branding
5. **Monitor Performance**: Check RSS fetch logs and alert creation

**Need help?** Check `QUOTE_ENHANCEMENTS_COMPLETE.md` for full documentation.

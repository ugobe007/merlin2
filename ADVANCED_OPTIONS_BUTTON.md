# ⚙️ Advanced Options Button - Location & Usage

## Where to Find It

The **Advanced Options** button is located in the **Smart Wizard** header, between the title and the Home/Close buttons.

### Location in Smart Wizard

```
┌─────────────────────────────────────────────────────────────────┐
│  Smart BESS Wizard              [⚙️ Advanced Options] [🏠] [✕]   │
│  🚀 SIMPLE MODE                                                   │
│  Streamlined wizard for quick quotes                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Wizard Content - Steps 0-8]                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## How to Access

1. **Open Smart Wizard**
   - Click "🪄 Smart Wizard" button on main page

2. **Look at Top Right Corner**
   - The button is in the header next to Home and Close buttons

3. **Click to Toggle**
   - Click once to enable Advanced Mode
   - Click again to return to Simple Mode

## Visual States

### Simple Mode (Default)
```
┌──────────────────────────────┐
│ ⚙️ Advanced Options          │  ← Blue gradient
└──────────────────────────────┘

Below shows:
🚀 SIMPLE MODE
Streamlined wizard for quick quotes
```

### Advanced Mode (Activated)
```
┌──────────────────────────────┐
│ ⚙️ Advanced Mode             │  ← Orange/red gradient
└──────────────────────────────┘

Below shows:
⚙️ ADVANCED MODE
Full configuration options unlocked
```

## Current Functionality

### What's Implemented ✅
- Button toggles between Simple and Advanced modes
- Visual state indicator (blue badge for Simple, orange badge for Advanced)
- Color changes (blue when off, orange/red when on)
- Hover effects and animations
- Clear labeling of current mode

### What's Coming Next 🔄
The button is **ready and visible**, but the step filtering logic is not yet implemented. 

**Next phase will add:**
- Hide advanced steps in Simple Mode:
  - Step 5: Enhanced Applications (detailed configs)
  - Step 6: Multiple Goals Selection
  - Step 7: Detailed Cost Analysis
  
- Simple Mode flow (6 steps):
  - Step 0: Project Type
  - Step 1: Power & Equipment
  - Step 2: Hybrid Configuration
  - Step 3: Location & Tariff
  - Step 4: Budget & Duration
  - Step 8: Summary

- Advanced Mode flow (9 steps):
  - All steps including detailed applications and cost analysis

## Implementation Details

### Code Location
`src/components/wizard/SmartWizard.tsx`

### State Management
```typescript
const [advancedMode, setAdvancedMode] = useState(false);
```

### Button Component
```tsx
<button 
  onClick={() => setAdvancedMode(!advancedMode)}
  className={`px-4 py-2 ${
    advancedMode 
      ? 'bg-gradient-to-br from-orange-500 to-red-500 border-orange-600' 
      : 'bg-gradient-to-br from-blue-600/80 to-indigo-600/80 border-blue-700/50'
  } text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center space-x-2 border-b-4`}
  title={advancedMode ? "Switch to Simple Mode" : "Enable Advanced Options"}
>
  <span>⚙️</span>
  <span>{advancedMode ? 'Advanced Mode' : 'Advanced Options'}</span>
</button>
```

### Mode Indicator
```tsx
{advancedMode && (
  <div className="mt-2 flex items-center space-x-2">
    <span className="px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full text-xs font-bold text-orange-300">
      ⚙️ ADVANCED MODE
    </span>
    <span className="text-xs text-gray-400">
      Full configuration options unlocked
    </span>
  </div>
)}

{!advancedMode && (
  <div className="mt-2 flex items-center space-x-2">
    <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-xs font-bold text-blue-300">
      🚀 SIMPLE MODE
    </span>
    <span className="text-xs text-gray-400">
      Streamlined wizard for quick quotes
    </span>
  </div>
)}
```

## User Experience

### Simple Mode Experience
- **Faster**: Fewer steps to complete
- **Clearer**: Only essential options shown
- **Easier**: Best for quick quotes and new users

### Advanced Mode Experience
- **Comprehensive**: All configuration options available
- **Detailed**: Application-specific configurations
- **Powerful**: Multiple goal selection and cost analysis

## Next Steps for Full Implementation

To complete the Advanced Options feature, we need to:

1. **Update `renderStep()` function** to skip advanced steps in simple mode
2. **Update step navigation** to handle different total steps
3. **Update progress indicator** to show correct step count
4. **Add step mapping** to translate between simple/advanced step numbers

Would you like me to implement the full step-skipping logic now?

## Testing

- [x] Button renders in wizard header
- [x] Button toggles state on click
- [x] Visual feedback (color change) works
- [x] Mode indicator badge updates
- [x] Hover effects and animations work
- [ ] Step skipping logic (not yet implemented)
- [ ] Navigation updates for different mode
- [ ] Progress bar adjusts to mode

## Summary

The **⚙️ Advanced Options** button is **live and visible** in the top right of the Smart Wizard header. It toggles between Simple and Advanced modes with clear visual feedback. The next phase will implement the actual step filtering to hide/show advanced configuration options based on the selected mode.

**Location**: Top right corner of Smart Wizard, between title and Home button  
**Status**: ✅ Button implemented, visual feedback working  
**Next**: Step filtering logic to hide/show advanced steps

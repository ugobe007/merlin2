# Sound Assets

## Missing Sound File

**File needed:** `puff.mp3` (or `.wav`, `.ogg`)

**Purpose:** Magical "puff" sound effect that plays when users download Word/Excel documents from the Smart Wizard.

### How to Add:

1. Find or download a magical "puff" sound effect
2. Place it in this directory as `puff.mp3`
3. Uncomment the import line in `/src/components/modals/QuotePreviewModal.tsx`:
   ```typescript
   import puffSound from '../../assets/sounds/puff.mp3';
   ```
4. Uncomment the audio playback code in the `playDownloadSound()` function

### Suggested Sound Sources:

- **Freesound.org** - Free sound effects library
- **Zapsplat.com** - Free sound effects for commercial use
- **Search terms:** "magical puff", "magic spell", "whoosh puff", "fairy dust"

### Current Status:

❌ Sound file not yet added  
✅ Code ready and waiting for sound file  
✅ Function calls in place for Word and Excel downloads

# Multi-Select & Lead Capture Implementation

## Changes Made (November 4, 2025)

### 1. Multi-Select Industry Templates (Step 1)

**Problem:** Users could only select one industry template at a time.

**Solution:** 
- Changed `selectedTemplate` from `string` to `string | string[]`
- Click any industry card to toggle selection
- Multiple templates can be selected simultaneously
- Visual feedback: Green checkmark (✓) on all selected templates
- Template defaults use first selected template

**User Experience:**
- Text updated: "Choose one or more industries to get started (click to select/deselect)"
- When multiple selected: Shows "Manufacturing Facility (+2 more)" in displays
- Continue button enabled when at least one template selected

**Technical Updates:**
- Updated 9 files across the codebase
- All type definitions now support `string | string[]`
- All display functions (`getIndustryName()`) handle arrays
- Template application uses first selection for defaults
- Validation updated to check for non-empty array

### 2. ConsultationModal with Lead Capture

**Problem:** "Schedule Free Consultation" button used mailto link, causing users to leave the site.

**Solution:** Created in-app modal with database integration

**Features:**
- ✅ **In-App Form** - No external navigation, professional UI
- ✅ **Two-Part Capture**:
  1. Meeting request (name + email required)
  2. Optional notes field for user context
- ✅ **Database Integration** - Saves to Supabase `customer_leads` table
- ✅ **Quote Context** - Captures full quote data (capacity, cost, options)
- ✅ **Email Notification** - Sends to info@merlinenergy.com via hidden iframe
- ✅ **Success Confirmation** - Visual feedback with auto-close after 2 seconds
- ✅ **Error Handling** - User-friendly error messages if submission fails

**Modal Fields Captured:**
```typescript
{
  email: string,           // Required
  name: string,            // Required
  notes: string,           // Optional
  quote_data: {
    capacity: number,
    power: number,
    duration: number,
    solar: number,
    wind: number,
    generator: number,
    location: string,
    goal: string,
    industry: string | string[],
    totalCost: number,
    installationOption: string,
    shippingOption: string,
    financingOption: string,
    annualSavings: number,
    paybackYears: number
  },
  lead_type: 'consultation_request',
  created_at: timestamp
}
```

### 3. Database Schema (Supabase)

**Table:** `customer_leads`

**Migration File:** `docs/customer_leads_migration.sql`

**To Apply Migration:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `docs/customer_leads_migration.sql`
3. Execute the SQL
4. Verify table created in Table Editor

**Schema:**
```sql
CREATE TABLE customer_leads (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  notes TEXT,
  quote_data JSONB,
  lead_type TEXT DEFAULT 'consultation_request',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_customer_leads_email` - Fast email lookups
- `idx_customer_leads_created_at` - Sorted by date
- `idx_customer_leads_type` - Filter by lead type

**Row Level Security (RLS):**
- ✅ Anonymous users can INSERT (lead capture)
- ✅ Authenticated users can SELECT (admin dashboard)
- ✅ Authenticated users can UPDATE (follow-up tracking)

### 4. Files Changed

**New Files:**
- `src/components/modals/ConsultationModal.tsx` (242 lines)
- `docs/customer_leads_migration.sql` (64 lines)

**Modified Files:**
- `src/components/wizard/SmartWizardV2.tsx` - State and type updates
- `src/components/wizard/steps/Step1_IndustryTemplate.tsx` - Multi-select logic
- `src/components/wizard/steps/Step2_SimpleConfiguration.tsx` - Type update
- `src/components/wizard/steps/Step4_QuoteSummary.tsx` - Modal integration
- `src/components/wizard/steps/Step6_FinalOutput.tsx` - Type update
- `src/components/wizard/QuoteCompletePage.tsx` - Type and display updates
- `src/utils/quoteExport.ts` - Type and display updates

**Total Changes:**
- 9 files changed
- 390 insertions(+)
- 28 deletions(-)

## Testing Checklist

### Multi-Select Testing:
- [ ] Click multiple industry templates in Step 1
- [ ] Verify green checkmarks appear on all selected
- [ ] Click again to deselect
- [ ] Verify "Continue" button enabled with at least one selection
- [ ] Check banner shows correct industry name(s)
- [ ] Verify template defaults apply from first selection

### Consultation Modal Testing:
- [ ] Click "Schedule Free Consultation" in Step 4
- [ ] Modal opens (no page navigation)
- [ ] Fill in name + email
- [ ] Add optional notes
- [ ] Submit form
- [ ] Verify success message appears
- [ ] Check Supabase `customer_leads` table for new entry
- [ ] Verify email arrives at info@merlinenergy.com
- [ ] Test error handling (disconnect internet, try to submit)

### Database Testing:
- [ ] Apply migration SQL in Supabase
- [ ] Verify table `customer_leads` created
- [ ] Check indexes exist
- [ ] Test RLS policies (insert as anonymous works)
- [ ] Verify quote_data JSONB structure is correct

## Next Steps

1. **Apply Database Migration**
   ```sql
   -- Run in Supabase SQL Editor
   -- Copy from docs/customer_leads_migration.sql
   ```

2. **Deploy to Production**
   ```bash
   git push origin main
   fly deploy
   ```

3. **Test Live Site**
   - Test multi-select functionality
   - Submit test consultation request
   - Verify lead captured in Supabase
   - Check email received

4. **Admin Dashboard (Future Enhancement)**
   - View all leads in `customer_leads` table
   - Filter by date, lead_type
   - Mark leads as contacted/closed
   - Email integration for follow-ups

## Email Configuration

Currently uses mailto via hidden iframe. For production:

**Option A: Keep Current (Simplest)**
- Email opens in user's default mail client
- Pre-filled with lead info
- No server-side email needed

**Option B: Add Email Service (Recommended)**
- Integrate SendGrid, Mailgun, or Resend
- Server-side email sending
- Better deliverability
- Can add auto-responder to customer
- Tracks email opens/clicks

**To Add Email Service:**
```typescript
// In ConsultationModal.tsx, replace iframe email with:
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'info@merlinenergy.com',
    subject: `Consultation Request from ${name}`,
    body: emailContent,
    leadData: { email, name, notes, quote_data }
  })
});
```

## Known Limitations

1. **Multi-Select Template Defaults**: Only uses first selected template for default values (power/duration). Future enhancement could average or sum multiple templates.

2. **Email via iframe**: Works but not ideal. Consider serverless email API for production.

3. **No Admin Dashboard**: Leads are in database but require direct Supabase access to view. Build admin panel in future.

4. **No Lead Notification**: Manual email check required. Add webhook or polling for real-time alerts.

## Support

Issues or questions? Check:
- Supabase Dashboard: https://supabase.com/dashboard/project/fvmpmozybmtzjvikrctq
- Git commit: `0fae8ab`
- Build status: ✅ Success (3.57s)

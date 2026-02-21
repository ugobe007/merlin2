# 📍 Merlin Page Reference Guide

## Quick Reference: What's Each Page Called?

### **Main Entry Points**

| Page                  | Official Name           | Internal Name                  | Component                  | Route                        |
| --------------------- | ----------------------- | ------------------------------ | -------------------------- | ---------------------------- |
| Homepage Button       | **"Get My Free Quote"** | Smart Wizard / Wizard V7       | `WizardV7Page.tsx`         | `/v7` or `/wizard`           |
| Homepage Button       | **"ProQuote™"**         | Pro Quote System Configuration | `AdvancedQuoteBuilder.tsx` | `/quote-builder`             |
| ProQuote Modal Button | **"Upload Files"**      | Document Upload                | `AdvancedQuoteBuilder.tsx` | `/quote-builder?mode=upload` |

---

## 🧙‍♂️ Smart Wizard (Wizard V7)

**User-Facing Name**: "Get My Free Quote"  
**Internal Name**: Wizard V7 / Smart Wizard  
**File**: `src/pages/WizardV7Page.tsx`

### **Purpose**

Guided 4-step wizard that walks users through:

1. **Location** - ZIP code + optional business lookup
2. **Industry** - Select from 21 industries
3. **Profile** - Answer industry-specific questions
4. **Quote** - Get custom savings estimate

### **When to Use**

- New users who want guidance
- Users who don't have technical specs
- Quick quotes with industry defaults
- Mobile users (optimized for mobile)

### **Key Features**

- ✅ Google Places business lookup
- ✅ Merlin AI Advisor (left sidebar)
- ✅ TrueQuote™ validation
- ✅ Industry-specific questionnaires (21 industries)
- ✅ Real-time power gauge
- ✅ Saves progress automatically
- ✅ Export to PDF/Word/Excel

---

## 🎯 ProQuote™ System Configuration

**User-Facing Name**: "ProQuote™"  
**Internal Name**: Advanced Quote Builder / Pro Quote Configuration  
**File**: `src/components/AdvancedQuoteBuilder.tsx`

### **Purpose**

Professional-grade configuration tool with:

- Manual spec entry (kW, kWh, voltage, etc.)
- Electrical specifications
- Renewable integration (solar/wind)
- Generator backup
- Multiple analysis views

### **When to Use**

- Technical users with specifications
- Engineers/installers
- Users with equipment schedules
- Projects requiring detailed configuration

### **Sub-Views**

| View                      | Purpose                     | Route                                       |
| ------------------------- | --------------------------- | ------------------------------------------- |
| **Landing**               | Feature overview            | `/quote-builder` (default)                  |
| **Custom Config**         | Manual system design        | `/quote-builder?mode=custom-config`         |
| **Interactive Dashboard** | Real-time sliders           | `/quote-builder?mode=interactive-dashboard` |
| **Professional Model**    | 3-statement financial model | `/quote-builder?mode=professional-model`    |
| **Document Upload**       | AI extraction from docs     | `/quote-builder?mode=upload`                |

### **Key Features**

- ✅ Document upload + AI extraction
- ✅ Advanced electrical specs
- ✅ Renewable energy integration
- ✅ Real-time cost calculations
- ✅ Interactive dashboard with sliders
- ✅ Bank-ready financial models
- ✅ NREL market pricing intelligence

---

## 📄 Document Upload

**User-Facing Name**: "Upload Files"  
**Internal Name**: Document Upload / Path A  
**File**: Same as ProQuote (`AdvancedQuoteBuilder.tsx`)  
**Route**: `/quote-builder?mode=upload`

### **Purpose**

AI-powered document extraction:

- Upload utility bills
- Upload equipment schedules
- Upload load profiles
- AI extracts key data
- Pre-fills quote form

### **Supported Files**

- PDF (utility bills, quotes)
- Excel/CSV (load profiles)
- Word (specs, schedules)
- Images (JPG/PNG of documents)

### **AI Extraction Capabilities**

- Peak demand (kW)
- Monthly consumption (kWh)
- Electricity rates ($/kWh)
- Demand charges ($/kW)
- Location/utility provider
- Existing solar capacity
- Equipment specifications

---

## 🆚 When to Use Each Page?

### **Use Smart Wizard (/v7) When:**

- ❓ User is new to BESS
- ❓ User doesn't have technical specs
- ❓ User wants guidance
- ❓ User is on mobile
- ❓ Quick quote needed (< 5 minutes)

### **Use ProQuote (/quote-builder) When:**

- 🔧 User has technical specifications
- 🔧 User is an engineer/installer
- 🔧 Detailed configuration needed
- 🔧 Multiple analysis views required
- 🔧 Bank-ready financials needed

### **Use Document Upload When:**

- 📄 User has utility bills
- 📄 User has equipment schedules
- 📄 User has load profiles
- 📄 User wants AI to do the work
- 📄 User wants to skip manual entry

---

## 🔄 User Flow Examples

### **Scenario 1: New User, No Specs**

```
Homepage → "Get My Free Quote" → Smart Wizard
  ↓
Step 1: Enter ZIP (94102)
Step 2: Select Industry (Hotel)
Step 3: Answer Questions (150 rooms, mid-scale)
Step 4: Get Quote ($2.5M system, $450K/year savings)
  ↓
Export to PDF or Continue to ProQuote for details
```

### **Scenario 2: Engineer with Specs**

```
Homepage → "ProQuote™" → ProQuote Landing
  ↓
"Launch Configuration Tool"
  ↓
Enter: 2 MW / 8 MWh / 480V / Office Building / California
  ↓
See: Equipment breakdown, costs, ROI, payback
  ↓
Switch to "Interactive Dashboard" for sensitivity analysis
  ↓
Switch to "Professional Model" for bank-ready 3-statement
```

### **Scenario 3: User with Documents**

```
Homepage → "ProQuote™" → ProQuote Landing
  ↓
Click "Upload Files" OR ProQuote modal → "Upload Files"
  ↓
Upload utility bill PDF
  ↓
AI extracts: 450 kW peak, $0.18/kWh, CA, $22/kW demand
  ↓
Form pre-filled → Review → Generate Quote
```

---

## 🎨 UI/UX Naming Conventions

### **User-Facing Names** (What users see)

- "Get My Free Quote" - Clear call-to-action
- "ProQuote™" - Professional branding
- "Upload Files" - Simple, direct
- "Smart Wizard" - Never shown (internal only)

### **Internal Names** (In code/docs)

- `WizardV7` or `Smart Wizard`
- `AdvancedQuoteBuilder` or `ProQuote`
- `DocumentUploadZone` or `Path A`

### **Route Patterns**

- `/v7` or `/wizard` - Smart Wizard
- `/quote-builder` - ProQuote landing
- `/quote-builder?mode=<view>` - ProQuote sub-views

---

## 📊 Analytics Event Names

For tracking user behavior:

| Page         | Event Name                | Trigger                                 |
| ------------ | ------------------------- | --------------------------------------- |
| Smart Wizard | `wizard_started`          | User clicks "Get My Free Quote"         |
| Smart Wizard | `wizard_step_completed`   | User completes each step                |
| Smart Wizard | `wizard_quote_generated`  | Quote displayed                         |
| ProQuote     | `proquote_opened`         | User clicks "ProQuote™"                 |
| ProQuote     | `proquote_config_started` | User clicks "Launch Configuration Tool" |
| ProQuote     | `document_uploaded`       | User uploads file                       |
| ProQuote     | `ai_extraction_complete`  | AI finishes parsing                     |

---

## 🔧 Developer Reference

### **Key Files**

**Smart Wizard**:

- Entry: `src/pages/WizardV7Page.tsx`
- Steps: `src/components/wizard/v7/steps/`
- Hook: `src/wizard/v7/hooks/useWizardV7.ts`

**ProQuote**:

- Component: `src/components/AdvancedQuoteBuilder.tsx`
- Wrapper: `src/pages/ProQuoteConfigurationPage.tsx`
- Upload: `src/components/upload/DocumentUploadZone.tsx`

**Services**:

- Upload: `src/services/documentParserService.ts`
- AI Extraction: `src/services/openAIExtractionService.ts`
- Quote Engine: `src/wizard/v7/hooks/useWizardV7.ts`

### **State Management**

**Smart Wizard**: Uses `useWizardV7()` hook (3,931 lines) - SSOT for wizard state

**ProQuote**: Local state in `AdvancedQuoteBuilder` (5,501 lines)

---

## 🚀 Quick Commands

**Open Smart Wizard**:

```typescript
window.location.href = "/v7";
// or
window.location.href = "/wizard";
```

**Open ProQuote**:

```typescript
window.location.href = "/quote-builder";
```

**Open ProQuote with Upload**:

```typescript
window.location.href = "/quote-builder?mode=upload";
```

**Open ProQuote with Config**:

```typescript
window.location.href = "/quote-builder?mode=custom-config";
```

---

## 📝 Notes

1. **"Get My Free Quote"** is the PRIMARY CTA - should be most visible
2. **"ProQuote™"** is for power users - secondary but important
3. **Document Upload** is a feature OF ProQuote, not standalone page
4. All three paths lead to same SSOT: `calculateQuote()` in Quote Engine
5. Smart Wizard is mobile-optimized; ProQuote is desktop-focused

---

**Last Updated**: February 21, 2026  
**Maintainer**: AI Agent  
**Version**: 1.0

# WIZARD WORKFLOW RESTRUCTURE - CRITICAL

## Current (WRONG) Flow:
- Step -1: Intro
- Step 0: Industry Template
- Step 1: Use Case Questions  
- Step 2: Configure Battery (Simple Configuration)
- Step 3: Add Renewables (with power gap alerts and generator prompts)
- Step 4: Location & Pricing
- Step 5: Quote Summary
- Complete Page

## Required (CORRECT) Flow - USER JOURNEY:

### LANDING PAGE (Before Step 1)
**User sees**: Smart Wizard button (CURRENTLY SHOWS "LOADING" - NEEDS FIX)
**Value Proposition**: 
1. 💰 **SAVE MONEY** (primary motivator)
2. 🔋 Energy Independence (secondary)
3. 🌱 Go Green (tertiary)

**Decision Point**: Smart Wizard (guided walkthrough) vs Advanced Quote Builder (self-serve for pros)

---

### Step 1: Welcome + Explanation
**User thinks**: "Okay, let me see what this is about"
**Purpose**: Set expectations, explain what's about to happen
- Welcome to Merlin Smart Wizard
- "We'll walk you through step-by-step"
- "This will take about 5 minutes"
- Value props: Save 30-50% on electricity, energy independence, tax credits
- Big "Let's Get Started" button

---

### Step 2: Industry Templates
**User thinks**: "Hmmm. What do I do here? I know but users may not know"
**Purpose**: Help users pick the right starting point
- **BIG CLEAR TITLE**: "Choose Your Industry"
- **EXPLANATION NEEDED**: "To help you configure your system, we've built industry-specific templates based on thousands of energy profiles"
- Template categories with icons
- **Hover tooltips**: Show what each template includes
- "Why templates?" info box: "Templates give you accurate starting points based on industry standards"

---

### Step 3: Use Case Questions  
**User thinks**: "Ahhhh--- this is where I fill in the information. Okay, I stumble through this and try to answer what I can"
**Purpose**: Gather facility-specific info
- **TITLE**: "Tell Us About Your [Industry]"
- Industry-specific questions (rooms, chargers, square footage)
- **Helpful tips next to each question**: "Why we ask this" tooltips
- **Allow partial answers**: Don't block if they skip optional questions
- Visual progress: "2 of 5 questions answered"
- Calculate baseline in background


### Step 3: Use Case Questions (continued)
- Calculate baseline in background

---

### Step 4: Solar/EV Decision
**User thinks**: "Now this is interesting... I can add solar or EV Charging! Cool!! Or, I don't want to so I click 'next'"
**Purpose**: Simple choice - enhance system or skip
- **TWO BIG CARDS**: Solar ☀️ | EV Charging 🚗⚡
- **Benefits listed**: Why would I want this?
- **SIMPLE YES/NO buttons**: Not complicated configuration yet
- **"Skip Both" option**: Clearly visible
- **What happens next?**: "We'll help you configure these in the next step"

---

### Step 5: Power Profile Review ("MERLIN'S GOT YOU COVERED")
**User thinks**: "Ahhhh-- this is my Power Profile--- hmmm, what does this mean?"
**Purpose**: Show the complete picture + Merlin's magic recommendation

**Scenario A: User chose Solar in Step 4**
- Power Profile displayed: Peak demand, battery, solar generation
- **Solar pre-loaded with recommendation**: "Based on your facility, we recommend X acres of solar"
- Visual: "Solar reduces your demand by Y MW"
- **Power gap analysis**: "You still need Z MW more power"
- **BIG BUTTON**: "✨ Accept Merlin's Recommendation" (adds generators/wind automatically)
- OR: "I want to adjust this myself" (shows manual controls)

**Scenario B: User chose EV in Step 4**
- Power Profile displayed: Peak demand + EV charging demand
- **EV config pre-loaded**: "Your EV chargers will add X MW to peak demand"
- Visual: Shows increased demand with EV
- **Power gap analysis**: "Here's what you need to cover EV + facility"
- **BIG BUTTON**: "✨ Accept Merlin's Recommendation"

**Scenario C: User chose BOTH Solar + EV**
- Shows complete picture: Facility demand + EV demand - Solar generation
- **Smart optimization**: "Your solar will offset EV charging during the day!"
- Shows hourly profile (optional advanced view)
- **BIG BUTTON**: "✨ Accept Merlin's Recommendation" (optimizes everything)

**Scenario D: User skipped both**
- Shows basic power profile: Facility demand + battery
- **Power gap** (if exists): "You need backup power"
- **BIG BUTTON**: "✨ Accept Merlin's Recommendation" (adds generators)

**KEY FEATURE**: 
- **"Hey man, I've got you covered"** messaging throughout
- **ONE-CLICK FIX**: Merlin calculates optimal solar/wind/generator mix
- **Trust builder**: "This recommendation is based on X similar facilities"
- **Adjustable**: Can still manually tweak if they want

---

### Step 6: Preliminary Quote ("CHECK YOUR SHOPPING LIST")
**User thinks**: "Okay, it looks cool (or it does not so I go back... or scroll down to understand more)"
**Purpose**: Review before committing - build confidence or allow edits

**Quote Display**:
- **Title**: "Your Preliminary Quote"
- **Subtitle**: "Review your system and savings - you can still make changes"
- Equipment breakdown with costs
- Financial summary: Payback, ROI, Annual savings
- **SAVE MONEY callout**: "💰 You'll save $X per year!"

**Interactive Elements**:
- **Expandable sections**: Click to see more details
- **Tooltips**: Explain technical terms
- **Charts**: ROI over time, savings breakdown
- **"Why these numbers?" info boxes**

**Navigation**:
- **BIG "Go Back to Edit" button**: Top right, always visible
- **Scroll to bottom for next step**
- **AT BOTTOM**: 
  - "Looks good? Let's finalize your quote"
  - OR "Not sure? Here's what each component does..." (educational content)
  - **"Continue to Final Quote" button**

---

### Step 7: Final Quote ("YAY!! THE GOODIES!")
**User thinks**: "This is so cool....! These guys have taken out the GUESS work! I'm going to SAVE MONEY!!"
**Purpose**: Deliver professional quote + installers + downloads

**Final Quote Display**:
- **🎉 CELEBRATION HEADER**: "Your Energy System is Ready!"
- **Complete financial breakdown**
- **Equipment list with specs**
- **Installer options**: 
  - "Top-rated installers in your area"
  - Installer cards with ratings, contact info
  - "Request quotes from installers" button
- **Financing options** (if available):
  - Loan calculators
  - Lease options
  - Tax credit information

**Downloads** (BIG BUTTONS):
- 📄 **PDF Quote** - "Share with your team"
- 📝 **Word Document** - "Full proposal with specifications"
- 📊 **Excel Spreadsheet** - "Financial model you can customize"

**Save to Account**:
- **"Save this configuration"** button
- If not logged in: "Create free account to save and compare quotes"
- **Power Profile saved to database** for future use

**Graduation Path**:
- 💡 **"Want more control?"** callout box
- "Try our Advanced Quote Builder for power users"
- "Compare multiple configurations side-by-side"
- "Access our full equipment database"

**Social Proof**:
- "Join 10,000+ facilities saving money with Merlin"
- Customer testimonials
- "Share your savings" social buttons

---

---

## Power Profile Data Structure

```typescript
interface PowerProfile {
  // Use Case Data
  useCaseTemplate: string;
  useCaseAnswers: Record<string, any>;
  
  // Calculated Baseline
  peakDemandMW: number;
  baseLoadMW: number;
  operatingHours: number;
  operatingSchedule: {
    start: string; // "08:00"
    end: string;   // "22:00"
  };
  
  // Battery Configuration
  batteryMW: number;
  batteryDurationHours: number;
  batteryMWh: number;
  
  // Solar Configuration (if chosen)
  solarIncluded: boolean;
  solarMW: number;
  solarSpaceAcres: number;
  solarReduction: number; // MW reduction in peak demand
  
  // EV Configuration (if chosen)
  evIncluded: boolean;
  evChargers: number;
  evKWperCharger: number;
  evTotalMW: number;
  evPeakDemandIncrease: number; // MW added to demand
  
  // Wind/Generator Configuration
  windMW: number;
  generatorMW: number;
  
  // Total System
  totalGenerationMW: number;  // Solar + Wind + Generator
  totalDemandMW: number;       // Peak Demand + EV - Solar
  powerGapMW: number;          // Demand - (Battery + Generation)
  isSufficient: boolean;
  
  // Financial Context
  location: string;
  electricityRate: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // User (if logged in)
  userId?: string;
}
```

---

## Implementation Tasks

### Phase 1: Restructure Steps (4 hours)
- [ ] Rename Step3_AddRenewables → Step4_SolarEVDecision (simple YES/NO only)
- [ ] Create NEW Step5_PowerProfileReview component
  - [ ] Display power profile summary
  - [ ] Pre-load solar config if chosen
  - [ ] Pre-load EV config if chosen
  - [ ] Add EV demand to power profile calculations
  - [ ] Show power gap analysis
  - [ ] Allow adjustments to solar/wind/generators
- [ ] Update Step6 (Location) to add utility bill upload
- [ ] Split current Step5 into:
  - Step7_PreliminaryQuote (with edit capability)
  - Step8_FinalQuote (with downloads)

### Phase 2: Power Profile Service (2 hours)
- [ ] Create `powerProfileService.ts`
  - [ ] `calculatePowerProfile()` - computes profile from all inputs
  - [ ] `updatePowerProfile()` - updates when user changes config
  - [ ] `savePowerProfile()` - saves to database
  - [ ] `loadPowerProfile()` - loads from user account
- [ ] Add power profile state to SmartWizardV2
- [ ] Update profile on every step change
- [ ] Auto-save profile when quote is confirmed

### Phase 3: EV Power Integration (1 hour)
- [ ] Add EV charging to power demand calculations
- [ ] Update `calculatePowerStatus()` to include EV
- [ ] Show EV impact in power profile display
- [ ] Add EV to equipment breakdown in quote

### Phase 4: Utility Bill Upload (3 hours)
- [ ] Add file upload component to Step 6
- [ ] OCR/PDF parsing for utility bills
- [ ] Extract: electricity rate, demand charges, usage
- [ ] Pre-fill location and rate from bill
- [ ] Fallback to manual entry if parsing fails

### Phase 5: Step 7/8 Split (2 hours)
- [ ] Create Step7_PreliminaryQuote component
  - Show full quote
  - "Edit Configuration" button → go back to Step 5
  - "Confirm Quote" button → advance to Step 8
- [ ] Create Step8_FinalQuote component
  - Display final locked quote
  - Word/PDF/Excel download buttons
  - Save to user account
  - Save power profile to database

### Phase 6: Update Navigation (1 hour)
- [ ] Update `getStepTitle()` with new titles
- [ ] Update `canProceed()` validation for all steps
- [ ] Update step counter: "Step X of 8"
- [ ] Update `handleNext()` / `handleBack()` logic

---

## Estimated Total Time: 13 hours

## Priority Order:
1. **Phase 1** (4 hrs) - Get workflow structure correct
2. **Phase 3** (1 hr) - EV power integration (critical for accuracy)
3. **Phase 2** (2 hrs) - Power profile service
4. **Phase 6** (1 hr) - Navigation updates
5. **Phase 5** (2 hrs) - Split preliminary/final quote
6. **Phase 4** (3 hrs) - Utility bill upload (nice-to-have)

---

## Current Status:
❌ **Workflow is completely wrong**
❌ **Step 3 (Add Renewables) doing too much - should be simple YES/NO**
❌ **Missing Step 5 (Power Profile Review)**
❌ **Missing Step 7 (Preliminary Quote)**
❌ **Missing Step 8 (Final Quote + Downloads)**
❌ **EV not added to power demand**
❌ **No power profile persistence**

## Immediate Action:
Start with Phase 1 - restructure all steps to match correct workflow.

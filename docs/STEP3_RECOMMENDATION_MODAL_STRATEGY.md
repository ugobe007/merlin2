# Step 3 Recommendation Modal - Strategy Document

**Date:** December 26, 2025  
**Status:** Design Phase

---

## 🎯 **OBJECTIVE**

After Step 3 (Facility Details), present a comprehensive AI-driven recommendation modal that:
1. Shows financial metrics for selected opportunities (Solar, Generator, EV)
2. Provides AI-driven recommendations based on ALL variables
3. Explains why certain options are/aren't recommended
4. Allows users to confirm/modify selections before proceeding to Step 4

---

## 🧠 **AI DECISION LOGIC**

The AI agent analyzes ALL variables to determine optimal configuration:

### **Input Variables:**
- Location (state, zip code)
- Grid connection type
- Facility details (square footage, rooftop space, operating hours)
- Industry type
- Goals (cost savings, backup, sustainability, etc.)
- Opportunity preferences (wantsSolar, wantsGenerator, wantsEV)
- Electricity rates
- Peak sun hours
- Grid reliability
- Market conditions

### **Decision Rules:**

#### **Solar Recommendations:**
- ✅ **RECOMMEND** if:
  - Rooftop space available (≥50% of needed area)
  - Good solar rating (≥4.0 peak sun hours)
  - Grid connection allows net metering
  - Electricity rates are high (≥$0.12/kWh)
  - Sustainability goals selected
  
- ❌ **NOT RECOMMEND** if:
  - Insufficient rooftop space (<30% of needed area)
  - Poor solar rating (<3.5 peak sun hours)
  - Off-grid or unreliable grid (better to use generators)
  - Low electricity rates (<$0.08/kWh) - ROI too long
  - EV charging hub in downtown (no space for solar)

#### **Generator Recommendations:**
- ✅ **RECOMMEND** if:
  - Off-grid or unreliable grid
  - Backup power goal selected
  - Critical operations (hospitals, data centers)
  - Solar not viable (no space/poor rating)
  - Grid independence goal selected
  
- ❌ **NOT RECOMMEND** if:
  - On-grid with reliable service
  - Only sustainability goals (generators are fossil fuel)
  - High electricity rates (better to use solar + BESS)
  - Urban location with noise restrictions

#### **EV Charging Recommendations:**
- ✅ **RECOMMEND** if:
  - High traffic location
  - High electricity rates (opportunity for savings)
  - Grid connection allows demand charge management
  - Sustainability goals selected
  - Adequate space for chargers
  
- ❌ **NOT RECOMMEND** if:
  - Low traffic location
  - Low electricity rates (not competitive)
  - Grid pricing is very competitive (no arbitrage opportunity)
  - Insufficient space
  - Off-grid (no grid to charge from)

---

## 📊 **FINANCIAL METRICS DISPLAY**

For each opportunity, show **two scenarios**:

### **Conservative Scenario:**
- Lower savings estimates
- Longer payback periods
- More realistic assumptions
- Based on current market conditions

### **Aggressive Scenario:**
- Higher savings estimates
- Shorter payback periods
- Optimistic assumptions
- Based on best-case market conditions

**Metrics to Display:**
- Annual Savings ($/year)
- Payback Period (years)
- 10-Year ROI (%)
- 25-Year ROI (%)
- NPV (if applicable)
- Initial Investment ($)

---

## 🎨 **UI/UX DESIGN**

### **Modal Structure:**
1. **Header:** "Merlin's Recommendations for [Industry] in [State]"
2. **AI Explanation Panel:** Why these recommendations were made
3. **Opportunity Cards:** One for each selected opportunity (Solar, Generator, EV)
4. **Financial Metrics:** Conservative vs Aggressive comparison
5. **Action Buttons:** "Build My Quote" or "Modify Selections"

### **Opportunity Card Layout:**
- **Status Badge:** ✅ Recommended / ⚠️ Not Recommended / ℹ️ Alternative
- **Title:** "Solar Energy System" / "Backup Generator" / "EV Charging Hub"
- **AI Reasoning:** "Based on your 15,000 sqft rooftop and excellent solar rating..."
- **Financial Metrics Table:** Conservative | Aggressive
- **Toggle:** Enable/Disable this option

---

## 🔄 **WORKFLOW**

1. User completes Step 3
2. Clicks "Continue" → Modal appears
3. AI analyzes all variables
4. Modal displays recommendations with financial metrics
5. User reviews and can toggle options on/off
6. User clicks "Build My Quote" → Proceeds to Step 4
7. Step 4 Magic Fit cards reflect confirmed selections

---

## 🛠️ **IMPLEMENTATION PLAN**

### **Phase 1: Modal Component**
- Create `Step3RecommendationModal.tsx`
- Basic UI structure
- Display opportunity preferences from Step 2

### **Phase 2: AI Decision Engine**
- Enhance `riskAssessmentService.ts` with recommendation logic
- Add `recommendationEngine.ts` for multi-variable analysis
- Integrate with `marketConditionsService.ts`

### **Phase 3: Financial Metrics**
- Calculate conservative and aggressive scenarios
- Use `centralizedCalculations.ts` for financial metrics
- Display in comparison table

### **Phase 4: Integration**
- Hook modal into Step 3 completion flow
- Pass confirmed selections to Step 4
- Update Step 4 to use confirmed selections

---

## ❓ **QUESTIONS FOR CLARIFICATION**

1. **Timing:** Should the modal appear automatically after Step 3, or should there be a "Review Recommendations" button?

2. **Modifications:** Can users modify their selections in the modal, or is it read-only with confirm/cancel?

3. **Fallback:** If user selected an option in Step 2 but AI doesn't recommend it, should we:
   - Show it as "Not Recommended" but still allow them to include it?
   - Hide it completely?
   - Show it with a warning?

4. **Financial Metrics Source:** Should we use:
   - Real-time calculations based on their specific inputs?
   - Pre-calculated ranges based on industry/location?
   - Both?

5. **BESS Integration:** Should BESS be shown as a separate option, or always included with Solar/Generator/EV?

---

## 💡 **RECOMMENDATIONS**

1. **Make it Interactive:** Allow users to toggle options on/off in the modal
2. **Show Alternatives:** If solar isn't recommended, suggest generators as alternative
3. **Explain Everything:** Use explainable AI to show WHY each recommendation was made
4. **Visual Hierarchy:** Make recommended options stand out, de-emphasize not recommended
5. **Progressive Disclosure:** Show summary first, allow drill-down into details
6. **Save State:** Remember user's modifications if they go back

---

## ✅ **NEXT STEPS**

1. Get user approval on design and questions
2. Create modal component structure
3. Build AI recommendation engine
4. Integrate financial metrics calculation
5. Test with various scenarios
6. Deploy to Step 3 completion flow


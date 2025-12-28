# 📋 REVISED STRUCTURAL CHANGES SUMMARY

**Date:** December 26, 2025  
**Status:** ✅ **UPDATED BASED ON STRATEGIC DIRECTION**

---

## 🎯 **STRATEGIC SHIFT**

Based on user feedback, the structural changes have been revised to focus on:
1. **Early Opportunity Discovery** (after Step 2)
2. **Deferred Full Calculation** (after Step 3)
3. **Scenario-Based Presentation** (in Step 4)
4. **Business Owner Value Proposition** (savings + revenue + benefits)

---

## 📊 **REVISED STRUCTURAL CHANGES**

### **1. Opportunity Discovery Popup** ✅ **NEW - HIGH PRIORITY**

**What:** Popup modal after industry selection (Step 2)

**Structure:**
- Trigger: After user selects industry
- Ask: "Explore solar, generators, EV charging?"
- Explain: "We'll calculate options after Step 3"
- Store: Preferences in wizard state
- Use: Preferences to calculate scenarios in Step 4

**Impact:** ALL use cases get opportunity discovery popup

---

### **2. Brand/Chain Selection** ✅ **UNIVERSAL PATTERN**

**What:** Brand/chain selection for use case-specific categories

**Examples:**
- Car Wash: Tommy's Express, El Car Wash
- Hotels: Hilton, Marriott, Hyatt
- Hospitals: HCA, Kaiser, Mayo
- Retail: Walmart, Target, etc.

**Structure:**
- Database table: `use_case_brands`
- Conditional rendering: Show if use case has brands configured
- Store in: `useCaseData.brand`

**Impact:** All relevant use cases can have brand selection

---

### **3. Operating Hours** ✅ **UNIVERSAL FOR RELEVANT USE CASES**

**What:** Days/hours of operation

**Structure:**
- Fields: `daysPerWeek`, `hoursPerDay`, `peakHoursStart`, `peakHoursEnd`
- Database: Add to relevant use cases
- Conditional: Show for use cases with variable operating hours

**Impact:** Car wash, retail, manufacturing, hotels, etc.

---

### **4. Grid Connection** ⚠️ **DECISION NEEDED**

**Question:** Still move to Step 3, or keep in Step 4?

**Options:**
- **Option A:** Keep in Step 4 (current location)
- **Option B:** Move to Step 3 (as originally planned)
- **Option C:** Remove as separate question, infer from location/goals

**Recommendation:** Option A (keep in Step 4, can be inferred/configured in opportunity discovery)

---

### **5. Demand Charge Re-affirmation** ✅ **KEEP**

**What:** Step 1 calculates, Step 3 re-affirms

**Status:** Still valid, implement as planned

---

### **6. Peak Power Validation** ✅ **KEEP**

**What:** Show calculated value, allow optional user validation

**Status:** Still valid, implement as planned

---

### **7. Equipment Config Popup** ✅ **CONDITIONAL**

**What:** Detailed equipment configuration modal

**Status:** Keep as conditional (use case-specific)

---

### **8. Rooftop Square Footage** ✅ **KEEP**

**What:** Separate total + rooftop for solar sizing

**Status:** Still valid, important for solar opportunities

---

## 🔄 **REVISED IMPLEMENTATION PRIORITY**

### **Priority 1: Opportunity Discovery (NEW)**
1. Create opportunity discovery popup
2. Market conditions service
3. Store preferences
4. Use preferences in Step 4

### **Priority 2: Database Updates (SSOT)**
1. Brand/chain selection tables
2. Operating hours questions
3. Ensure SSOT compliance (no nested questions)

### **Priority 3: Step 4 Enhancement**
1. Scenario-based financial presentation
2. Revenue opportunities display
3. Multiple scenario comparison

### **Priority 4: Step 3 Enhancements**
1. Brand selection component
2. Operating hours fields
3. Other use case-specific questions

---

## ✅ **CONFIRMED APPROACHES**

1. ✅ **Opportunity Discovery:** Early popup after Step 2
2. ✅ **Calculation Timing:** Full modeling after Step 3
3. ✅ **Scenario Presentation:** Multiple scenarios in Step 4
4. ✅ **Brand Selection:** Universal pattern (database-driven)
5. ✅ **Operating Hours:** Universal for relevant use cases
6. ✅ **SSOT Compliance:** All questions from database
7. ✅ **Business Owner Focus:** Show savings + revenue + benefits

---

**Status:** ✅ **READY FOR DETAILED IMPLEMENTATION PLAN**


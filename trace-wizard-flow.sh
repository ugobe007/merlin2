#!/bin/bash
echo "=========================================="
echo "SMART WIZARD FLOW TRACE"
echo "=========================================="

echo ""
echo "1. ENTRY POINTS (Routes):"
echo "--------------------------"
grep -n "path=\|<Route" src/App.tsx | head -20

echo ""
echo "2. WIZARD STEPS (State Machine):"
echo "---------------------------------"
grep -n "useState.*step\|setStep\|currentStep\|activeStep" src/components/wizard/*.tsx 2>/dev/null | head -20

echo ""
echo "3. STEP COMPONENTS:"
echo "-------------------"
ls -la src/components/wizard/steps*/  2>/dev/null || ls -la src/components/wizard/ | grep -i step

echo ""
echo "4. FORK DETECTION (Upload vs Manual):"
echo "--------------------------------------"
grep -n "upload\|Upload\|file\|File\|document\|Document\|pdf\|PDF" src/components/wizard/*.tsx 2>/dev/null | head -10

echo ""
echo "5. INDUSTRY SELECTION:"
echo "----------------------"
grep -n "industry\|Industry\|useCase\|vertical\|slug" src/components/wizard/StreamlinedWizard.tsx 2>/dev/null | head -15

echo ""
echo "6. ADD-ONS (Solar/Wind/EV):"
echo "---------------------------"
grep -n "solar\|Solar\|wind\|Wind\|generator\|Generator" src/components/wizard/StreamlinedWizard.tsx 2>/dev/null | head -15

echo ""
echo "7. QUOTE GENERATION:"
echo "--------------------"
grep -n "QuoteEngine\|generateQuote\|calculateQuote" src/components/wizard/*.tsx 2>/dev/null | head -10

echo ""
echo "8. DOWNLOAD/EXPORT:"
echo "-------------------"
grep -n "download\|Download\|export\|Export\|PDF\|pdf" src/components/wizard/*.tsx 2>/dev/null | head -10

echo ""
echo "=========================================="
echo "END OF TRACE"
echo "=========================================="

#!/bin/bash
# Wizard Testing Suite Runner

echo "🧪 Wizard Testing Suite"
echo "======================="
echo ""

# Check if dev server is running
if ! lsof -ti:5177 > /dev/null 2>&1; then
    echo "❌ Dev server not running on port 5177"
    echo "   Run: npm run dev"
    exit 1
fi

echo "✅ Dev server detected on port 5177"
echo ""

# Run tests based on argument
case "$1" in
    "playwright")
        echo "🎭 Running Playwright tests..."
        npx playwright test tests/e2e/wizard-validation.spec.ts --reporter=list
        ;;
    "puppeteer")
        echo "🎪 Running Puppeteer error sniffer..."
        node tests/puppeteer/wizard-error-sniffer.js
        ;;
    "both")
        echo "🎭 Running Playwright tests..."
        npx playwright test tests/e2e/wizard-validation.spec.ts --reporter=list
        echo ""
        echo "🎪 Running Puppeteer error sniffer..."
        node tests/puppeteer/wizard-error-sniffer.js
        ;;
    *)
        echo "Usage: ./tests/run-wizard-tests.sh [playwright|puppeteer|both]"
        echo ""
        echo "Examples:"
        echo "  ./tests/run-wizard-tests.sh playwright   # Fast, multiple test cases"
        echo "  ./tests/run-wizard-tests.sh puppeteer    # Detailed error analysis"
        echo "  ./tests/run-wizard-tests.sh both         # Run everything"
        exit 1
        ;;
esac

#!/bin/bash

# Merlin2 Deployment Script for Fly.io
# This script tests locally, builds production, and deploys to merlin2.fly.dev

set -e  # Exit on any error

echo "🧙‍♂️ Merlin2 Deployment Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
echo -e "${BLUE}Step 1: Verifying project directory...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the merlin2 directory?${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Project directory confirmed${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}Step 2: Installing/updating dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Type check
echo -e "${BLUE}Step 3: Running TypeScript type check...${NC}"
npm run type-check || {
    echo -e "${RED}❌ TypeScript errors found. Please fix before deploying.${NC}"
    exit 1
}
echo -e "${GREEN}✅ No TypeScript errors${NC}"
echo ""

# Step 4: Build for production
echo -e "${BLUE}Step 4: Building production bundle...${NC}"
npm run build || {
    echo -e "${RED}❌ Build failed. Check errors above.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Production build complete${NC}"
echo ""

# Step 5: Test production build locally (optional)
echo -e "${YELLOW}Step 5: Test production build locally? (y/n)${NC}"
read -p "" -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Starting preview server...${NC}"
    echo -e "${YELLOW}Navigate to http://localhost:4173 in your browser${NC}"
    echo -e "${YELLOW}Test the Smart Wizard with a 100MW data center${NC}"
    echo -e "${YELLOW}Press Ctrl+C when done testing${NC}"
    npm run preview
fi
echo ""

# Step 6: Deploy to Fly.io
echo -e "${BLUE}Step 6: Deploy to Fly.io? (y/n)${NC}"
read -p "" -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Deploying to merlin2.fly.dev...${NC}"
    
    # Check if fly CLI is installed
    if ! command -v fly &> /dev/null; then
        echo -e "${RED}❌ Fly CLI not found. Install it first:${NC}"
        echo "   brew install flyctl"
        echo "   OR visit: https://fly.io/docs/hands-on/install-flyctl/"
        exit 1
    fi
    
    # Deploy
    fly deploy || {
        echo -e "${RED}❌ Deployment failed. Check errors above.${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
    echo -e "${GREEN}🌐 Your app is live at: https://merlin2.fly.dev${NC}"
    echo ""
    
    # Step 7: Verify deployment
    echo -e "${BLUE}Step 7: Test on production? (y/n)${NC}"
    read -p "" -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}📋 Test Checklist:${NC}"
        echo "   1. Navigate to https://merlin2.fly.dev"
        echo "   2. Click 'Smart Wizard' or 'Get Started'"
        echo "   3. Select 'Data Center' template"
        echo "   4. Enter:"
        echo "      - Capacity: 100 MW"
        echo "      - Grid Connection: Single"
        echo "      - Uptime: Tier III"
        echo "   5. Verify recommendation is ~50MW / 3hr"
        echo "   6. Check AI Data Collection tab in Admin Panel"
        echo ""
        echo -e "${YELLOW}Opening browser...${NC}"
        open https://merlin2.fly.dev || echo "Please manually navigate to https://merlin2.fly.dev"
    fi
else
    echo -e "${YELLOW}⚠️  Deployment skipped${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Deployment script complete!${NC}"
echo -e "${GREEN}================================${NC}"

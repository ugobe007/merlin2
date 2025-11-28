#!/bin/bash

# Start Merlin BESS Dev Server
# Usage: ./start-server.sh

cd "$(dirname "$0")"

echo "🚀 Starting Merlin BESS dev server..."
echo "📍 Working directory: $(pwd)"
echo ""

# Kill any existing processes on port 5177
lsof -ti:5177 | xargs kill -9 2>/dev/null

# Start the dev server
npm run dev

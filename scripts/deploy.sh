#!/bin/bash
# Deploy to Fly.io with VITE_ build secrets sourced from .env
# Usage: bash scripts/deploy.sh
set -e

cd "$(dirname "$0")/.."

# Helper: extract a value from .env by key name (handles long single-line values)
env_val() {
  grep "^${1}=" .env | head -1 | cut -d= -f2-
}

VITE_SUPABASE_URL=$(env_val VITE_SUPABASE_URL)
VITE_SUPABASE_ANON_KEY=$(env_val VITE_SUPABASE_ANON_KEY)
VITE_OPENAI_API_KEY=$(env_val VITE_OPENAI_API_KEY)
VITE_ENABLE_AI_ANALYSIS=$(env_val VITE_ENABLE_AI_ANALYSIS)
VITE_GOOGLE_MAPS_API_KEY=$(env_val VITE_GOOGLE_MAPS_API_KEY)
VITE_NREL_API_KEY=$(env_val VITE_NREL_API_KEY)
VITE_VISUAL_CROSSING_API_KEY=$(env_val VITE_VISUAL_CROSSING_API_KEY)
VITE_RESEND_API_KEY=$(env_val VITE_RESEND_API_KEY)

echo "🚀 Deploying merlin2 with explicit build secrets..."
echo "   VITE_SUPABASE_URL  = $VITE_SUPABASE_URL"
echo "   VITE_SUPABASE_ANON_KEY = ${VITE_SUPABASE_ANON_KEY:0:30}..."

fly deploy -a merlin2 \
  --build-secret "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" \
  --build-secret "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" \
  --build-secret "VITE_OPENAI_API_KEY=${VITE_OPENAI_API_KEY}" \
  --build-secret "VITE_ENABLE_AI_ANALYSIS=${VITE_ENABLE_AI_ANALYSIS}" \
  --build-secret "VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}" \
  --build-secret "VITE_NREL_API_KEY=${VITE_NREL_API_KEY}" \
  --build-secret "VITE_VISUAL_CROSSING_API_KEY=${VITE_VISUAL_CROSSING_API_KEY}" \
  --build-secret "VITE_RESEND_API_KEY=${VITE_RESEND_API_KEY}" \
  --build-arg "CACHEBUST=$(date +%s)"

echo "✅ Deploy complete — check https://merlinenergy.net"

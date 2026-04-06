#!/bin/bash
# Deploy to Fly.io with build secrets read from .env
set -e

cd "$(dirname "$0")/.."

echo "📦 Reading secrets from .env..."

BUILD_KEYS=(
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_RESEND_API_KEY
  VITE_OPENAI_API_KEY
  VITE_ENABLE_AI_ANALYSIS
  VITE_GOOGLE_MAPS_API_KEY
  VITE_NREL_API_KEY
  VITE_VISUAL_CROSSING_API_KEY
  VITE_PUBLIC_URL
)

SECRET_ARGS=()
for KEY in "${BUILD_KEYS[@]}"; do
  VAL=$(grep "^${KEY}=" .env | cut -d= -f2-)
  if [ -n "$VAL" ]; then
    SECRET_ARGS+=(--build-secret "${KEY}=${VAL}")
    echo "  ✅ ${KEY}"
  else
    echo "  ⚠️  ${KEY} not found in .env (skipping)"
  fi
done

echo ""
echo "🚀 Deploying to Fly.io..."
flyctl deploy "${SECRET_ARGS[@]}"

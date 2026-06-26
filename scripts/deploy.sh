#!/bin/bash
# Deploy merlin2 to Fly.io
# =============================================================================
# Fly's Depot remote builder does NOT honour [build.secrets] in fly.toml.
# Build secrets must be passed explicitly via --build-secret flags.
# This script reads them from .env and passes them directly.
#
# Usage:
#   bash scripts/deploy.sh    # standard deploy
#   npm run deploy            # same via npm
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "❌ .env not found. Copy .env.example and fill in values."
  exit 1
fi

# Extract a value from .env by key (handles long single-line values like JWTs)
# The || true prevents set -o pipefail from exiting when grep finds no match.
env_val() {
  grep "^${1}=" .env 2>/dev/null | head -1 | cut -d= -f2- || true
}

# Ensure fly CLI is on PATH (installed to ~/.fly/bin on macOS)
export PATH="$PATH:$HOME/.fly/bin"

FLY="$(command -v fly 2>/dev/null || true)"
if [ -z "$FLY" ]; then
  echo "❌ fly CLI not found. Install from https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

BUILD_KEYS=(
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_OPENAI_API_KEY
  VITE_ENABLE_AI_ANALYSIS
  VITE_GOOGLE_MAPS_API_KEY
  VITE_NREL_API_KEY
  VITE_VISUAL_CROSSING_API_KEY
  VITE_RESEND_API_KEY
)

echo "📦 Reading build secrets from .env..."
SECRET_FLAGS=()
for KEY in "${BUILD_KEYS[@]}"; do
  VAL=$(env_val "$KEY")
  if [ -n "$VAL" ]; then
    SECRET_FLAGS+=(--build-secret "${KEY}=${VAL}")
    echo "  ✅ ${KEY}"
  else
    echo "  ⚠️  ${KEY} not found — passing 'placeholder'"
    SECRET_FLAGS+=(--build-secret "${KEY}=placeholder")
  fi
done

CACHEBUST=$(date +%s)
echo ""
echo "🚀 Deploying merlin2 to Fly.io (remote-only, cache bust: ${CACHEBUST})..."

fly deploy -a merlin2 --remote-only \
  "${SECRET_FLAGS[@]}" \
  --build-arg "CACHEBUST=${CACHEBUST}"

echo ""
echo "✅ Deploy complete → https://merlinenergy.net"

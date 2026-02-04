#!/usr/bin/env bash
set -euo pipefail

echo "🧹 Merlin Dev Cleanup"

# Kill processes on common dev ports
for p in 5177 5173 5184 3001; do
  pid="$(lsof -nP -iTCP:$p -sTCP:LISTEN -t 2>/dev/null || true)"
  if [ -n "${pid}" ]; then
    echo "  Killing port $p → PID $pid"
    kill -TERM "$pid" 2>/dev/null || true
    sleep 1
    kill -KILL "$pid" 2>/dev/null || true
  fi
done

# Kill any stuck vite processes
pkill -f "vite" 2>/dev/null && echo "  Killed vite processes" || true

# Kill any stuck esbuild processes  
pkill -f "esbuild" 2>/dev/null && echo "  Killed esbuild processes" || true

# Kill any stuck playwright processes
pkill -f "playwright" 2>/dev/null && echo "  Killed playwright processes" || true
pkill -f "Chrome for Testing" 2>/dev/null && echo "  Killed Chrome for Testing" || true
pkill -f "chromium" 2>/dev/null && echo "  Killed chromium processes" || true

# Clear vite cache if it exists
if [ -d "node_modules/.vite" ]; then
  rm -rf node_modules/.vite
  echo "  Cleared node_modules/.vite cache"
fi

if [ -d ".vite" ]; then
  rm -rf .vite
  echo "  Cleared .vite cache"
fi

echo "✅ Done. Ports 5177/5173/5184/3001 are clear."

#!/usr/bin/env bash
# =============================================================
# MERLIN DAILY AGENT — CRON SETUP
# =============================================================
# Installs the Merlin daily agent as a scheduled task.
# Runs at 6:00 AM Pacific Time every day.
#
# Usage:
#   chmod +x agents/setup-cron.sh
#   ./agents/setup-cron.sh
#
# To uninstall:
#   ./agents/setup-cron.sh --uninstall
# =============================================================

set -euo pipefail

MERLIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$MERLIN_ROOT/agents/cron.log"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_NAME="energy.merlin.daily-agent"
PLIST_PATH="$PLIST_DIR/$PLIST_NAME.plist"

# Detect tsx or ts-node
if command -v tsx &>/dev/null; then
  TSX_BIN="$(command -v tsx)"
elif [ -f "$MERLIN_ROOT/node_modules/.bin/tsx" ]; then
  TSX_BIN="$MERLIN_ROOT/node_modules/.bin/tsx"
elif command -v ts-node &>/dev/null; then
  TSX_BIN="$(command -v ts-node)"
else
  echo "❌ Could not find tsx or ts-node. Run: npm install -g tsx"
  exit 1
fi

# ---------------------------------------------------------------
# UNINSTALL
# ---------------------------------------------------------------
if [[ "${1:-}" == "--uninstall" ]]; then
  if [ -f "$PLIST_PATH" ]; then
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    rm -f "$PLIST_PATH"
    echo "✅ Merlin daily agent uninstalled"
  else
    echo "ℹ️  No plist found at $PLIST_PATH"
  fi
  exit 0
fi

# ---------------------------------------------------------------
# INSTALL VIA LAUNCHD (macOS preferred)
# ---------------------------------------------------------------

mkdir -p "$PLIST_DIR"

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_NAME}</string>

  <key>ProgramArguments</key>
  <array>
    <string>${TSX_BIN}</string>
    <string>${MERLIN_ROOT}/agents/daily-runner.ts</string>
  </array>

  <key>WorkingDirectory</key>
  <string>${MERLIN_ROOT}</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
    <key>NODE_ENV</key>
    <string>production</string>
    <!-- Add your secrets here or load via a .env file in WorkingDirectory -->
  </dict>

  <!-- Run at 6:00 AM every day -->
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>6</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>

  <key>StandardOutPath</key>
  <string>${LOG_FILE}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_FILE}</string>

  <key>RunAtLoad</key>
  <false/>

  <key>KeepAlive</key>
  <false/>
</dict>
</plist>
EOF

# Load the LaunchAgent
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo ""
echo "✅ Merlin daily agent installed as macOS LaunchAgent"
echo ""
echo "   Schedule : 6:00 AM daily"
echo "   Plist    : $PLIST_PATH"
echo "   Log file : $LOG_FILE"
echo "   Runner   : $TSX_BIN $MERLIN_ROOT/agents/daily-runner.ts"
echo ""
echo "Useful commands:"
echo "  View logs      : tail -f $LOG_FILE"
echo "  Run now        : $TSX_BIN $MERLIN_ROOT/agents/daily-runner.ts"
echo "  Check status   : launchctl list | grep merlin"
echo "  Uninstall      : $0 --uninstall"
echo ""

# ---------------------------------------------------------------
# OPTIONAL: Also add a crontab entry as backup
# ---------------------------------------------------------------
# Uncomment to add cron fallback:
# CRON_ENTRY="0 14 * * * cd $MERLIN_ROOT && $TSX_BIN agents/daily-runner.ts >> $LOG_FILE 2>&1"
# (crontab -l 2>/dev/null | grep -v 'merlin.*daily-runner'; echo "$CRON_ENTRY") | crontab -
# echo "✅ Crontab fallback also installed (6 AM PT = 2 PM UTC)"

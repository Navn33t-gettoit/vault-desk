#!/usr/bin/env bash
# Rebuilds Vault Desk and restarts the running Launch Agent so the
# live server never serves a build that's out of sync with disk.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.vaultdesk.server.plist"

APP_HOST=$(node -e "const c=require('$ROOT/app.config.cjs');process.stdout.write(c.APP_HOST)" 2>/dev/null || echo "127.0.0.1")
APP_PORT=$(node -e "const c=require('$ROOT/app.config.cjs');process.stdout.write(String(c.APP_PORT))" 2>/dev/null || echo "7423")

echo "Building..."
npm --prefix "$ROOT" run build

if [ -f "$PLIST" ]; then
  echo "Restarting Vault Desk login item..."
  launchctl unload "$PLIST" 2>/dev/null || true
  launchctl load "$PLIST"
  sleep 2
  echo "Done. Vault Desk is running the latest build at http://${APP_HOST}:${APP_PORT}"
else
  echo "Done building. Login item is not installed — run 'npm run setup' to install it."
fi

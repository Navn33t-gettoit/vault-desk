#!/usr/bin/env bash
# Installs Vault Desk as a macOS login item via a Launch Agent.
# The server starts automatically when you log in and stays running.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.vaultdesk.server"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG="$ROOT/.vault-desk/server.log"

# Read host/port from app.config.cjs so this script stays in sync with it
APP_HOST=$(node -e "const c=require('$ROOT/app.config.cjs');process.stdout.write(c.APP_HOST)" 2>/dev/null || echo "127.0.0.1")
APP_PORT=$(node -e "const c=require('$ROOT/app.config.cjs');process.stdout.write(String(c.APP_PORT))" 2>/dev/null || echo "7423")

# Resolve node — check common locations
NODE=""
for candidate in \
  "$(command -v node 2>/dev/null)" \
  "$HOME/.local/node-"*/bin/node \
  /opt/homebrew/bin/node \
  /usr/local/bin/node; do
  if [ -x "$candidate" ]; then
    NODE="$candidate"
    break
  fi
done

if [ -z "$NODE" ]; then
  echo "Error: Node.js not found. Install from https://nodejs.org"
  exit 1
fi

NEXT="$ROOT/node_modules/.bin/next"

if [ ! -f "$NEXT" ]; then
  echo "Installing dependencies..."
  npm --prefix "$ROOT" install
fi

if [ ! -f "$ROOT/.next/BUILD_ID" ]; then
  echo "Building Vault Desk (first time, about a minute)..."
  npm --prefix "$ROOT" run build
fi

mkdir -p "$ROOT/.vault-desk"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE}</string>
    <string>${NEXT}</string>
    <string>start</string>
    <string>-H</string>
    <string>${APP_HOST}</string>
    <string>-p</string>
    <string>${APP_PORT}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE_ENV</key>
    <string>production</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG}</string>
  <key>StandardErrorPath</key>
  <string>${LOG}</string>
</dict>
</plist>
PLIST

# Load (or reload) the agent
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo ""
echo "Vault Desk is now running at http://${APP_HOST}:${APP_PORT}"
echo "It will start automatically every time you log in."
echo ""
echo "To stop:    npm run uninstall"
echo "To open:    open http://${APP_HOST}:${APP_PORT}"
echo ""

sleep 2
open "http://${APP_HOST}:${APP_PORT}"

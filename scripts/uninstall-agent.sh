#!/usr/bin/env bash
# Removes the Vault Desk login item and stops the server.
set -euo pipefail

PLIST="$HOME/Library/LaunchAgents/com.vaultdesk.server.plist"

if [ ! -f "$PLIST" ]; then
  echo "Vault Desk login item is not installed."
  exit 0
fi

launchctl unload "$PLIST" 2>/dev/null || true
rm "$PLIST"
echo "Vault Desk removed from login items. Server stopped."

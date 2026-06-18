#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display alert "Node.js required" message "Install Node.js 20+ from https://nodejs.org then try again."' 2>/dev/null || {
    echo "Node.js is required. Install from https://nodejs.org"
  }
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first time only)..."
  npm install
fi

npm run app

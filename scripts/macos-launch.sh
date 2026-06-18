#!/bin/bash
# Shared macOS launcher for Vault Desk (.app and .command).
set -euo pipefail

if [ -n "${VAULT_DESK_ROOT:-}" ]; then
  ROOT="$VAULT_DESK_ROOT"
else
  ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi

cd "$ROOT"

LOG_DIR="$ROOT/.vault-desk"
LOG_FILE="$LOG_DIR/launch.log"
ENV_FILE="$LOG_DIR/env.sh"
mkdir -p "$LOG_DIR"

# Finder launches with a minimal PATH — restore common Node locations.
if [ -x /usr/libexec/path_helper ]; then
  eval "$(/usr/libexec/path_helper -s)"
fi

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

for node_dir in "$HOME"/.local/node-*/bin; do
  if [ -d "$node_dir" ]; then
    PATH="$node_dir:$PATH"
  fi
done

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh" --no-use 2>/dev/null || true
fi

if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env)" 2>/dev/null || true
fi

unset ELECTRON_RUN_AS_NODE

notify() {
  osascript -e "display notification \"$1\" with title \"Vault Desk\"" 2>/dev/null || true
}

alert() {
  osascript -e "display alert \"Vault Desk\" message \"$1\"" 2>/dev/null || echo "$1"
}

log() {
  echo "[$(date '+%H:%M:%S')] $*"
}

on_error() {
  log "ERROR: launch failed (see above)"
  alert "Vault Desk failed to start. Open .vault-desk/launch.log in the project folder for details."
}
trap on_error ERR

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  log "node/npm not found. PATH=$PATH"
  alert "Node.js 20+ is required but was not found. Install from https://nodejs.org — or run npm install once from Terminal in this folder."
  exit 1
fi

# Remember working Node path for future Finder launches.
NODE_DIR="$(dirname "$(command -v node)")"
printf 'export PATH="%s:$PATH"\n' "$NODE_DIR" >"$ENV_FILE"

run_launch() {
  log "=== Vault Desk launch ==="
  log "ROOT=$ROOT"
  log "node=$(command -v node) ($(node --version))"
  log "npm=$(command -v npm)"

  if [ ! -d node_modules ]; then
    notify "Installing dependencies (first time only)..."
    log "Running npm install..."
    npm install
  fi

  if [ ! -f .next/BUILD_ID ]; then
    notify "Building Vault Desk (first time only, about a minute)..."
    log "Running npm run build..."
    npm run build
  fi

  log "Starting Electron..."
  ELECTRON_BIN="$ROOT/node_modules/.bin/electron"
  exec env -u ELECTRON_RUN_AS_NODE "$ELECTRON_BIN" "$ROOT"
}

if [ "${VAULT_DESK_SILENT:-}" = "1" ]; then
  run_launch >>"$LOG_FILE" 2>&1
else
  run_launch | tee -a "$LOG_FILE"
fi

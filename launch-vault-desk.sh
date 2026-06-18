#!/usr/bin/env bash
# Sets up and starts Vault Desk. Run this once; the server then starts automatically on login.
exec "$(cd "$(dirname "$0")" && pwd)/scripts/install-agent.sh"

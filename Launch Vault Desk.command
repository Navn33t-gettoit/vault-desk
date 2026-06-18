#!/bin/bash
# First-time setup: installs Vault Desk as a login item and opens it in your browser.
# After setup, double-clicking this again just opens the browser.
exec "$(cd "$(dirname "$0")" && pwd)/scripts/install-agent.sh"

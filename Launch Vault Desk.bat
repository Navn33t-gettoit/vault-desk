@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install from https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies (first time only)...
  call npm install
)

if not exist .next\BUILD_ID (
  echo Building Vault Desk (first time, about a minute)...
  call npm run build
)

start "" http://127.0.0.1:7423
call npm run start

@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install from https://nodejs.org
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm is required. Install Node.js from https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies (first time only)...
  call npm install
)

call npm run app

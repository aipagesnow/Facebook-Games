@echo off
title Facebook Games Studio
cd /d "%~dp0"

REM First-time setup: install deps if missing
if not exist "node_modules\electron\dist\electron.exe" (
  echo Installing dependencies ^(first launch only^)...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Make sure Node.js is installed from https://nodejs.org
    pause
    exit /b 1
  )
)

REM Always build the UI so the window never opens with a stale/blank build
echo Preparing Facebook Games Studio...
call npm run build
if errorlevel 1 (
  echo.
  echo Build failed.
  pause
  exit /b 1
)

REM Launch Electron (console can close; app window stays open)
start "Facebook Games Studio" "node_modules\electron\dist\electron.exe" "."
exit /b 0

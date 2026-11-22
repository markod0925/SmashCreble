@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Rift Ruckus needs Node.js to run its local game server.
  pause
  exit /b 1
)
node server.mjs --open
if errorlevel 1 pause

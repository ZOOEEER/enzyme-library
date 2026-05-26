@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Please install Node.js first, then run this script again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or not in PATH.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [INFO] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo [INFO] Starting Enzyme Library...
if not exist node_modules\better-sqlite3\build\Release\better_sqlite3.node (
  echo [INFO] Rebuilding native modules for Electron...
  call npm run rebuild:native
  if errorlevel 1 (
    echo [ERROR] Native module rebuild failed.
    echo Please close running Enzyme Library/Electron processes and try again.
    pause
    exit /b 1
  )
) else (
  echo [INFO] Native module already exists; skipping rebuild.
)

echo [INFO] Starting Vite dev server...
start /b "" cmd /c "npm run dev"

echo [INFO] Waiting for Vite dev server...
call node_modules\.bin\wait-on.cmd http://127.0.0.1:5288
if errorlevel 1 (
  echo [ERROR] Vite dev server did not start.
  pause
  exit /b 1
)

echo [INFO] Building Electron main process...
call npm run build:electron
if errorlevel 1 (
  echo [ERROR] Electron build failed.
  pause
  exit /b 1
)

echo [INFO] Opening Enzyme Library...
set ELECTRON_IS_DEV=1
call node_modules\.bin\electron.cmd .
if errorlevel 1 (
  echo [ERROR] Electron failed to start. Please check the log above.
  pause
  exit /b 1
)

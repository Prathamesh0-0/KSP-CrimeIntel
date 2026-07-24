@echo off
echo ===================================================
echo  KSP CrimeIntel Platform — Launching Services
echo ===================================================
echo.

:: Get script directory
set ROOT_DIR=%~dp0

echo [1/2] Starting Python FastAPI Backend (Port 8000)...
start "KSP CrimeIntel Backend" cmd /k "cd /d %ROOT_DIR%backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting React Frontend Dev Server (Port 5173)...
start "KSP CrimeIntel Frontend" cmd /k "cd /d %ROOT_DIR%frontend && npm run dev"

echo.
echo ===================================================
echo  Both services launched in separate windows!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo ===================================================
echo.
pause

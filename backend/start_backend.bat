@echo off
echo =========================================
echo  KSP CrimeIntel — Backend Server
echo =========================================
echo.
echo Starting FastAPI server on http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
cd /d %~dp0
copy .env.example .env 2>nul
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause

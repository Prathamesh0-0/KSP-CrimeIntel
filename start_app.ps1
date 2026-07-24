# PowerShell startup script for KSP CrimeIntel
$ROOT = $PSScriptRoot

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " KSP CrimeIntel Platform — Launching Services" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT\backend'; python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "[2/2] Launching React Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT\frontend'; npm run dev"

Write-Host ""
Write-Host "Both servers started in separate PowerShell windows." -ForegroundColor Green

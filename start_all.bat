@echo off
title CampusConnect - Launching Full Stack
echo ========================================================
echo    Starting CampusConnect (Backend API + Frontend UI)
echo ========================================================
echo.

if not exist "%~dp0backend\.env" (
    echo [WARNING] backend\.env not found!
    echo The backend needs backend\.env with your Supabase DATABASE_URL.
    echo.
)

echo [1/2] Launching Backend API (http://localhost:4000)...
start "CampusConnect Backend (Port 4000)" cmd /k "cd /d "%~dp0backend" && npm.cmd run dev"

:: Brief pause so the API starts binding before Vite opens
timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend UI (http://localhost:5173)...
start "CampusConnect Frontend (Port 5173)" cmd /k "cd /d "%~dp0" && npm.cmd run dev"

echo.
echo ========================================================
echo    Both servers are starting in separate windows!
echo.
echo    Frontend: http://localhost:5173/
echo    Backend:  http://localhost:4000/api/v1/health
echo.
echo    To stop: Press Ctrl+C in each window (or close them).
echo ========================================================
echo.
pause

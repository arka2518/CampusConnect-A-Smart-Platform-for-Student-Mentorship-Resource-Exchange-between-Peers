@echo off
title CampusConnect Backend API (Port 4000)
echo ========================================================
echo    Starting CampusConnect Backend API (Express + Postgres)
echo ========================================================
echo.

if not exist "%~dp0backend\.env" (
    echo [WARNING] backend\.env file not found!
    echo Copy backend\.env.example to backend\.env and add your Supabase DATABASE_URL.
    echo.
)

pushd "%~dp0backend"
call npm.cmd run dev
popd
pause

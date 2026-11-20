@echo off
title CampusConnect - Setup Supabase Database
echo ========================================================
echo    CampusConnect: Migrating & Seeding Supabase DB...
echo ========================================================
echo.

if not exist "%~dp0backend\.env" (
    echo [ERROR] backend\.env file not found!
    echo Please copy backend\.env.example to backend\.env and paste
    echo your Supabase Session Pooler DATABASE_URL first.
    echo.
    pause
    exit /b 1
)

pushd "%~dp0backend"
call npm.cmd run db:setup
set EXIT_CODE=%errorlevel%
popd

if %EXIT_CODE% neq 0 (
    echo.
    echo [ERROR] Database setup failed. Check your DATABASE_URL in backend\.env.
    pause
    exit /b %EXIT_CODE%
)

echo.
echo ========================================================
echo    SUCCESS! Tables, indexes, and seed data are ready in Supabase.
echo ========================================================
echo.
pause

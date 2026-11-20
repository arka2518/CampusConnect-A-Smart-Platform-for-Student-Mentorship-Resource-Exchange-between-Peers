@echo off
title CampusConnect - Install Backend Dependencies
echo ========================================================
echo    CampusConnect: Installing Backend Dependencies...
echo ========================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your PATH!
    echo Please make sure Node.js is installed and on PATH.
    pause
    exit /b 1
)

pushd "%~dp0backend"
call npm.cmd install
set EXIT_CODE=%errorlevel%
popd

if %EXIT_CODE% neq 0 (
    echo.
    echo [ERROR] Backend dependency installation failed.
    pause
    exit /b %EXIT_CODE%
)

echo.
echo ========================================================
echo    SUCCESS! Backend dependencies installed.
echo.
echo    Next steps:
echo    1. Create backend\.env (copy from backend\.env.example)
echo       and paste your Supabase Session Pooler URI.
echo    2. Double-click setup_database.bat to create tables.
echo    3. Double-click start_backend.bat to launch the API.
echo ========================================================
echo.
pause

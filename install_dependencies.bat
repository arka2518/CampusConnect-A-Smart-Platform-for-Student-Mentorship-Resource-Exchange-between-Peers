@echo off
title CampusConnect - Install Dependencies
echo ========================================================
echo    CampusConnect: Installing Project Dependencies...
echo ========================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/2] Node.js detected. Running npm install...
echo This may take a minute depending on your internet connection...
echo.

:: Run npm install using npm.cmd for Windows compatibility
call npm.cmd install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies.
    echo Please check your internet connection or terminal permissions.
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo [2/2] SUCCESS! All dependencies installed successfully.
echo.
echo You can now start the website by double-clicking:
echo   - start.bat
echo ========================================================
echo.
pause

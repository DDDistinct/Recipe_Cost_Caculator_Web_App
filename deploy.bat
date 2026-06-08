@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   DBrista - Build ^& Deploy to GitHub Pages
echo ============================================
echo.

if not exist ".env" (
    echo [ERROR] .env file not found.
    echo Copy .env.example to .env and set your VITE_GOOGLE_CLIENT_ID.
    echo.
    pause
    exit /b 1
)

set VITE_GOOGLE_CLIENT_ID=
for /f "tokens=1,* delims==" %%a in (.env) do (
    if "%%a"=="VITE_GOOGLE_CLIENT_ID" set "VITE_GOOGLE_CLIENT_ID=%%b"
)

if "%VITE_GOOGLE_CLIENT_ID%"=="" (
    echo [ERROR] VITE_GOOGLE_CLIENT_ID not found in .env
    echo Add it to .env like: VITE_GOOGLE_CLIENT_ID=your_client_id
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)

echo [2/3] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo [3/3] Deploying to GitHub Pages...
call npm run deploy
if %errorlevel% neq 0 (
    echo [ERROR] Deploy failed
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Deploy complete!
echo   Site: https://DDDistinct.github.io/Recipe_Cost_Caculator_Web_App/
echo ============================================
pause

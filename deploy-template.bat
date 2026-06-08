@echo off
REM =====================================================
REM  Deploy Template — Copy into any Vite project root
REM  Steps:
REM    1. Copy as deploy.bat into your project root
REM    2. Update ENV_VAR_NAME and REPO_URL below
REM    3. Create .env with ENV_VAR_NAME=your_secret_value
REM    4. Add .env to .gitignore
REM    5. Double-click deploy.bat to build & deploy
REM =====================================================

setlocal enabledelayedexpansion

REM --- CONFIGURE THESE TWO LINES ---
set ENV_VAR_NAME=VITE_GOOGLE_CLIENT_ID
set REPO_URL=https://DDDistinct.github.io/Recipe_Cost_Caculator_Web_App/
REM ---------------------------------

echo ============================================
echo   Build ^& Deploy to GitHub Pages
echo ============================================
echo.

if not exist ".env" (
    echo [ERROR] .env file not found.
    echo Create .env with: %ENV_VAR_NAME%=your_value_here
    echo.
    pause
    exit /b 1
)

set SECRET=
for /f "tokens=1,* delims==" %%a in (.env) do (
    if "%%a"=="%ENV_VAR_NAME%" set "SECRET=%%b"
)

if "%SECRET%"=="" (
    echo [ERROR] %ENV_VAR_NAME% not found in .env
    pause
    exit /b 1
)

set "%ENV_VAR_NAME%=%SECRET%"

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
echo   Site: %REPO_URL%
echo ============================================
pause

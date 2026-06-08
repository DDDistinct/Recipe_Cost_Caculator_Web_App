Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DBrista - Build & Deploy to GitHub Pages" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found." -ForegroundColor Red
    Write-Host "Copy .env.example to .env and set your VITE_GOOGLE_CLIENT_ID."
    pause
    exit 1
}

$envContent = Get-Content ".env" -Raw
$match = [regex]::Match($envContent, 'VITE_GOOGLE_CLIENT_ID=(.+)')

if (-not $match.Success -or [string]::IsNullOrWhiteSpace($match.Groups[1].Value)) {
    Write-Host "[ERROR] VITE_GOOGLE_CLIENT_ID not found in .env" -ForegroundColor Red
    pause
    exit 1
}

$env:VITE_GOOGLE_CLIENT_ID = $match.Groups[1].Value.Trim()

Write-Host "[1/3] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] npm install failed" -ForegroundColor Red; pause; exit 1 }

Write-Host "[2/3] Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Build failed" -ForegroundColor Red; pause; exit 1 }

Write-Host "[3/3] Deploying to GitHub Pages..." -ForegroundColor Yellow
npm run deploy
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Deploy failed" -ForegroundColor Red; pause; exit 1 }

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Deploy complete!" -ForegroundColor Green
Write-Host "  Site: https://DDDistinct.github.io/Recipe_Cost_Caculator_Web_App/" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
pause

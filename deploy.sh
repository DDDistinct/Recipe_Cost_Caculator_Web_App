#!/bin/bash
set -e

echo "============================================"
echo "  DBrista - Build & Deploy to GitHub Pages"
echo "============================================"
echo ""

if [ ! -f ".env" ]; then
  echo "[ERROR] .env file not found."
  echo "Copy .env.example to .env and set your VITE_GOOGLE_CLIENT_ID."
  exit 1
fi

VITE_GOOGLE_CLIENT_ID=$(grep -oP 'VITE_GOOGLE_CLIENT_ID=\K.*' .env | head -1 | xargs)

if [ -z "$VITE_GOOGLE_CLIENT_ID" ]; then
  echo "[ERROR] VITE_GOOGLE_CLIENT_ID not found in .env"
  exit 1
fi

export VITE_GOOGLE_CLIENT_ID

echo "[1/3] Installing dependencies..."
npm install

echo "[2/3] Building project..."
npm run build

echo "[3/3] Deploying to GitHub Pages..."
npm run deploy

echo ""
echo "============================================"
echo "  Deploy complete!"
echo "  Site: https://DDDistinct.github.io/Recipe_Cost_Caculator_Web_App/"
echo "============================================"

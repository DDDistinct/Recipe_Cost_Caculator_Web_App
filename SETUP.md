# Setup & Deployment Guide

This guide covers:
- **Security model** — what stays secret and what gets shipped
- **One-click deploy** — `deploy.bat` / `deploy.ps1` / `deploy.sh`
- **GitHub Actions** — auto-deploy on push
- **Reusable template** — copy-paste for any future Vite project

---

## Table of Contents

1. [Security Model — Where Does the Secret Live?](#1-security-model--where-does-the-secret-live)
2. [One-Click Deploy Scripts](#2-one-click-deploy-scripts)
3. [Set Up Your Local Environment](#3-set-up-your-local-environment)
4. [Deploy via VS Code (Ctrl+Shift+B)](#4-deploy-via-vs-code-ctrlshiftb)
5. [Deploy via GitHub Actions (Auto on Push)](#5-deploy-via-github-actions-auto-on-push)
6. [Manual Deploy via Terminal](#6-manual-deploy-via-terminal)
7. [One-Time Personal Configuration](#7-one-time-personal-configuration)
8. [Per-Project Checklist](#8-per-project-checklist)
9. [Reusable Deploy Template for Future Projects](#9-reusable-deploy-template-for-future-projects)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Security Model — Where Does the Secret Live?

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR MACHINE                          │
│  .env  (gitignored — NEVER committed)                   │
│  VITE_GOOGLE_CLIENT_ID=abc123                           │
│         │                                               │
│         ├── npm run dev      → localhost:3000           │
│         └── deploy.bat       → reads .env, builds       │
│                               → deploys to GitHub Pages │
└─────────────────────────────────────────────────────────┘
         │
         │ (you push code only — .env stays local)
         ▼
┌─────────────────────────────────────────────────────────┐
│                    GITHUB                                │
│  Repo files (NO .env — it's in .gitignore)              │
│                                                         │
│  Settings → Secrets → VITE_GOOGLE_CLIENT_ID ← encrypted │
│         │                                               │
│         └── GitHub Actions injects at build time        │
│             The compiled JS bundle contains the value   │
│             (normal for frontend apps — like any API    │
│              key in a mobile app)                       │
└─────────────────────────────────────────────────────────┘
```

### What is safe?

| File | Committed? | Contains real secret? | Safe? |
|------|-----------|----------------------|-------|
| `.env` | No (`.gitignore`) | Yes | ✅ Local only |
| `.env.example` | Yes | No (`your_google_client_id_here`) | ✅ Safe |
| GitHub Secrets | No (encrypted by GitHub) | Yes | ✅ Safe |
| Built JS bundle | Yes (in `dist/` after deploy) | Yes — but this is **normal** for frontend apps | ⚠️ Expected |

> **Why is it OK that the value is in the JS bundle?**
> The Google Client ID is a public identifier — it's embedded in your app so the browser can use it for OAuth. The real security comes from:
> - **Authorized JavaScript origins** in Google Cloud Console — only your domains can use this Client ID
> - **OAuth consent screen** — users approve the access
> - The **refresh/ID tokens** that come back are what actually grant access, not the Client ID itself

---

## 2. One-Click Deploy Scripts

This project comes with three deploy scripts. Each reads `VITE_GOOGLE_CLIENT_ID` from your local `.env` (which is gitignored), builds the app, and deploys to GitHub Pages.

### Windows (CMD) — `deploy.bat`

**Double-click** `deploy.bat` in File Explorer, or run:

```bat
deploy.bat
```

### Windows (PowerShell) — `deploy.ps1`

Right-click → **Run with PowerShell**, or:

```powershell
.\deploy.ps1
```

### Linux / macOS — `deploy.sh`

```bash
chmod +x deploy.sh
./deploy.sh
```

### What each script does:

```
1. Reads VITE_GOOGLE_CLIENT_ID from .env (your local secret)
2. npm install
3. npm run build        (Vite reads the env var at build time)
4. npm run deploy       (gh-pages pushes dist/ to gh-pages branch)
5. Prints the live URL
```

---

## 3. Set Up Your Local Environment

### 3.1 Create `.env` (one time)

```bash
cp .env.example .env
```

Edit `.env` and paste your real Google Client ID:

```
VITE_GOOGLE_CLIENT_ID=929554232132-xxxxx.apps.googleusercontent.com
```

> This file is listed in `.gitignore` — it will **never** be committed.

### 3.2 Verify `.gitignore`

Make sure `.env` is listed:

```gitignore
node_modules
dist
.env          ← must be here
*.local
.DS_Store
```

---

## 4. Deploy via VS Code (Ctrl+Shift+B)

### 4.1 VS Code Tasks

This project already has `.vscode/tasks.json` with three tasks:

| Task | Shortcut | What it does |
|------|----------|-------------|
| **Build & Deploy to GitHub Pages** | `Ctrl+Shift+B` | Builds + deploys |
| Build only | — | `npm run build` |
| Run locally (dev server) | — | `npm run dev` |

### 4.2 One-Click Deploy from VS Code

1. **Open the project** in VS Code
2. Press **`Ctrl+Shift+B`**
3. Select **"Build & Deploy to GitHub Pages"**
4. Watch the terminal — done in ~30 seconds

### 4.3 Push to Trigger GitHub Actions

| Step | Action |
|------|--------|
| 1 | Make changes |
| 2 | `Ctrl+Shift+G` (Source Control) |
| 3 | Type commit message → `Ctrl+Enter` |
| 4 | Click **Sync Changes** |
| 5 | GitHub Actions auto-deploys |

---

## 5. Deploy via GitHub Actions (Auto on Push)

### 5.1 Enable GitHub Pages

1. Go to repo → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Done — no branch config needed

### 5.2 Add the Secret

1. Go to repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. **Name:** `VITE_GOOGLE_CLIENT_ID`
4. **Value:** your Google Client ID
5. **Add secret**

### 5.3 Deploy

Push to `main`:

```bash
git push origin main
```

GitHub Actions automatically:
1. Picks up `.github/workflows/deploy.yml`
2. Installs dependencies
3. Builds with the secret injected
4. Deploys to Pages

Check status: repo → **Actions** tab → latest workflow run.

---

## 6. Manual Deploy via Terminal

```bash
# 1. Set env var (varies by OS)

# Windows CMD
set VITE_GOOGLE_CLIENT_ID=your_client_id && npm run build && npm run deploy

# PowerShell
$env:VITE_GOOGLE_CLIENT_ID="your_client_id"; npm run build; npm run deploy

# Linux / macOS
VITE_GOOGLE_CLIENT_ID=your_client_id npm run build && npm run deploy

# 2. Or use the script (reads from .env automatically)
deploy.bat        # Windows
.\deploy.ps1      # PowerShell
./deploy.sh       # Linux/macOS
```

---

## 7. One-Time Personal Configuration

Do these steps **once** for your GitHub account. Every future project reuses them.

### 7.1 GitHub Personal Access Token

Required for `gh-pages` and VS Code to push:

1. Go to https://github.com/settings/tokens
2. **Generate new token (classic)**
3. Name: `deploy-all-projects`
4. Scopes: check **`repo`** (full control)
5. **Copy the token** immediately

### 7.2 Store the Token

| Method | How |
|--------|-----|
| **Windows** | First `git push` prompts for credentials — enter username + token |
| **VS Code** | Signs in via browser — no manual entry |
| **Git Credential Manager** | `git config --global credential.helper manager` — caches after first prompt |

### 7.3 Git Identity

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### 7.4 Node.js

```bash
node -v   # should be 18+
npm -v
```

---

## 8. Per-Project Checklist

Copy this for every new Vite + React project:

- [ ] `vite.config.ts` — `base: '/REPO_NAME/'`
- [ ] `package.json` — `"homepage": "https://USER.github.io/REPO_NAME"`
- [ ] `package.json` — `"deploy": "gh-pages -d dist"` script
- [ ] `package.json` — `gh-pages` in devDependencies
- [ ] `.gitignore` — `.env` listed
- [ ] `.env.example` — template without real values
- [ ] `.github/workflows/deploy.yml` — copied from this project
- [ ] React Router `basename` — set to repo name
- [ ] GitHub repo → **Secrets** → add `VITE_GOOGLE_CLIENT_ID` (if needed)
- [ ] GitHub repo → **Pages** → source: GitHub Actions
- [ ] `deploy.bat` / `deploy.sh` — copied and updated

---

## 9. Reusable Deploy Template for Future Projects

This project includes `deploy-template.bat` — a generic deploy script you can copy into any Vite project.

### How to use it

```bat
REM 1. Copy deploy-template.bat as deploy.bat into your new project
REM 2. Edit these two lines:
set ENV_VAR_NAME=VITE_GOOGLE_CLIENT_ID    ← change to your env var name
set REPO_URL=https://USER.github.io/REPO/ ← change to your URL
REM 3. Create .env with: ENV_VAR_NAME=your_secret_value
REM 4. Double-click deploy.bat
```

The template:
- Reads any env var from `.env`
- Runs `npm install && npm run build && npm run deploy`
- Works on any Vite project
- Keeps secrets out of Git

---

## 10. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `git clone` asks for password | GitHub requires a PAT, not a password | Use your personal access token as the password |
| Blank page after deploy | Wrong `base` in `vite.config.ts` | Must match repo name exactly (case-sensitive) |
| 404 on page refresh | Missing React Router `basename` | Set `<BrowserRouter basename="/REPO_NAME">` |
| Google login fails | Origin not authorized | Add `https://USER.github.io` to Google Cloud OAuth origins |
| `gh-pages` not found | Missing dependency | `npm install -D gh-pages` |
| "Unable to parse range" | Sheet tab deleted | It auto-recreates on next operation |
| Logo not showing | Wrong path | Use `%BASE_URL%filename.png` in `index.html` |
| `.env` values not loading | File not in root | Must be in project root (same as `package.json`) |
| GitHub Action fails | Missing secret | Add `VITE_GOOGLE_CLIENT_ID` to repo Secrets |

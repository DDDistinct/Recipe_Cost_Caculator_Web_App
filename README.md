# DBrista — Recipe Cost Calculator

A web application for food and beverage businesses to calculate recipe costs and selling prices. Built with React, TypeScript, and Google Sheets.

## Features

- **Google Login** — Sign in with your Google account (OAuth 2.0)
- **Ingredient Database** — Store ingredient costs in Google Sheets with auto-numbering
- **Recipe Calculator** — Calculate total cost, markup %, and selling price in real time
- **Save Recipes** — Save calculated recipes to a Selling Price sheet for record keeping
- **Full CRUD** — Add, edit, and delete ingredients and selling price records from the UI
- **Auto-creation** — Missing sheet tabs are recreated automatically
- **Mobile Responsive** — Works on desktop and mobile devices
- **Coffee-inspired Theme** — Warm brown, mocha, latte, and cream palette with DBrista logo

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Google Sheets API v4 (direct from browser with OAuth token)
- **Database:** Google Sheets
- **Auth:** Google OAuth 2.0 (implicit flow with Sheets scope)
- **Hosting:** GitHub Pages

## Prerequisites

- Node.js 18+
- npm
- Google account
- Google Cloud Project with OAuth 2.0 credentials and Sheets API enabled

## Local Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** > **Library**
4. Enable the **Google Sheets API**
5. Go to **APIs & Services** > **Credentials**
6. Click **Create Credentials** > **OAuth client ID**
7. Application type: **Web application**
8. Name: `Recipe Cost Calculator`
9. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (local development)
   - `https://YOUR_GITHUB_USERNAME.github.io` (GitHub Pages deployment)
10. Click **Create**
11. Copy the **Client ID**

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your Google Client ID:

```
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npm run dev
```

Open http://localhost:3000.

### 5. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Copy the **Sheet ID** from the URL (the string between `/d/` and `/edit`)
4. In the app, go to **Settings** and paste the Sheet ID
5. Click **Test Connection**

The app will automatically create **Ingredients** and **Selling_Price** sheets with the correct headers.

## Usage

### Settings
- Enter your Google Sheet ID, click **Save**, then **Test Connection**

### Ingredients
- Add ingredients with name, unit, quantity, and price
- Cost per unit is calculated automatically
- Supported units: `g`, `ml`, `pc`, `L`, `kg`
- Edit or delete any ingredient using the row buttons

### Calculator
- Enter recipe name, optional description, and markup percentage
- Select ingredients from the dropdown and enter quantities
- A new ingredient row appears automatically when the last row is filled
- View real-time cost breakdown, markup amount, and suggested selling price
- Click **Save Recipe to Sheet** to persist to the Selling_Price sheet

### Selling Price
- View all saved recipes in a table
- Edit or delete any record

## Google Sheet Structure

### Ingredients sheet

| Ingredient_No | Ingredient_Name | Unit | Purchased_Quantity | Purchased_Price | Cost_Per_Unit |
|---------------|----------------|------|-------------------|----------------|---------------|
| 1             | Coffee Beans   | g    | 1000              | 700            | 0.70          |
| 2             | Milk           | ml   | 1000              | 95             | 0.095         |
| 3             | Cup with Lid   | pc   | 1                 | 8              | 8             |

### Selling_Price sheet

| Item_No | Item_Name      | Item_Description          | Selling_Price | Total_Cost |
|---------|----------------|---------------------------|---------------|------------|
| 1       | Iced Americano | Espresso + water over ice | 60.00         | 15.00      |

## Google Apps Script

An alternative backend is in `GAS/Code.gs`. It mirrors all frontend actions. See the file for details.

## Deployment

See [SETUP.md](./SETUP.md) for full deployment, GitHub Actions automation, VS Code integration, and personal project configuration instructions.

## License

MIT

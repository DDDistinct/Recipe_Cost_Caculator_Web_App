import type { Ingredient, Unit, SavedRecipe } from '../types'

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

const INGREDIENTS_SHEET = 'Ingredients'
const SELLING_PRICE_SHEET = 'Selling_Price'

export function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function testConnection(sheetId: string, token: string) {
  const res = await fetch(`${SHEETS_BASE}/${sheetId}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Failed to connect to sheet')
  }
  return true
}

async function createSheetIfMissing(sheetId: string, token: string, title: string, headers: string[]) {
  const check = await fetch(`${SHEETS_BASE}/${sheetId}/values/${title}!1:1`, {
    headers: getHeaders(token),
  })

  if (check.status === 404 || check.status === 400) {
    const createRes = await fetch(`${SHEETS_BASE}/${sheetId}:batchUpdate`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title } } }],
      }),
    })

    if (!createRes.ok) {
      const existing = await createRes.json().catch(() => ({}))
      const msg = existing.error?.message || ''
      if (!msg.includes('already exists')) {
        throw new Error(`Failed to create sheet "${title}": ${msg}`)
      }
    }

    const col = String.fromCharCode(64 + headers.length)
    await fetch(`${SHEETS_BASE}/${sheetId}/values/${title}!A1:${col}1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify({ values: [headers] }),
    })
  }
}

export async function ensureIngredientsSheet(sheetId: string, token: string) {
  await createSheetIfMissing(sheetId, token, INGREDIENTS_SHEET, [
    'Ingredient_No', 'Ingredient_Name', 'Unit', 'Purchased_Quantity', 'Purchased_Price', 'Cost_Per_Unit',
  ])
}

export async function ensureSellingPriceSheet(sheetId: string, token: string) {
  await createSheetIfMissing(sheetId, token, SELLING_PRICE_SHEET, [
    'Item_No', 'Item_Name', 'Item_Description', 'Selling_Price', 'Total_Cost',
  ])
}

export async function getIngredients(sheetId: string, token: string): Promise<Ingredient[]> {
  await ensureIngredientsSheet(sheetId, token)

  const range = `${INGREDIENTS_SHEET}!A:F`
  const res = await fetch(`${SHEETS_BASE}/${sheetId}/values/${range}`, {
    headers: getHeaders(token),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.error?.message || 'Failed to fetch ingredients')
  }

  const data = await res.json()
  const rows = data.values || []
  if (rows.length <= 1) return []

  return rows.slice(1).map((row: string[], i: number) => ({
    rowIndex: i + 1,
    ingredientNo: Number(row[0]) || 0,
    name: row[1] || '',
    unit: (row[2] || 'g') as Unit,
    purchasedQty: Number(row[3]) || 0,
    purchasedPrice: Number(row[4]) || 0,
    costPerUnit: Number(row[5]) || 0,
  }))
}

async function getNextIngredientNo(sheetId: string, token: string): Promise<number> {
  const range = `${INGREDIENTS_SHEET}!A:A`
  const res = await fetch(`${SHEETS_BASE}/${sheetId}/values/${range}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) return 1
  const data = await res.json()
  const rows = data.values || []
  if (rows.length <= 1) return 1
  let maxNo = 0
  for (let i = 1; i < rows.length; i++) {
    const no = Number(rows[i][0]) || 0
    if (no > maxNo) maxNo = no
  }
  return maxNo + 1
}

export async function addIngredient(
  sheetId: string,
  token: string,
  ingredient: { name: string; unit: string; purchasedQty: number; purchasedPrice: number }
) {
  await ensureIngredientsSheet(sheetId, token)

  const costPerUnit = ingredient.purchasedQty > 0
    ? ingredient.purchasedPrice / ingredient.purchasedQty
    : 0

  const nextNo = await getNextIngredientNo(sheetId, token)

  const range = `${INGREDIENTS_SHEET}!A:F`
  const res = await fetch(`${SHEETS_BASE}/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      values: [[
        nextNo,
        ingredient.name.trim(),
        ingredient.unit.trim(),
        ingredient.purchasedQty,
        ingredient.purchasedPrice,
        costPerUnit,
      ]],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Failed to add ingredient')
  }

  return { costPerUnit, ingredientNo: nextNo }
}

export async function updateIngredient(
  sheetId: string,
  token: string,
  rowIndex: number,
  ingredient: { name: string; unit: string; purchasedQty: number; purchasedPrice: number; ingredientNo: number }
) {
  const costPerUnit = ingredient.purchasedQty > 0
    ? ingredient.purchasedPrice / ingredient.purchasedQty
    : 0

  const a1Row = rowIndex + 1
  const range = `${INGREDIENTS_SHEET}!A${a1Row}:F${a1Row}`

  const res = await fetch(`${SHEETS_BASE}/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({
      values: [[
        ingredient.ingredientNo,
        ingredient.name.trim(),
        ingredient.unit.trim(),
        ingredient.purchasedQty,
        ingredient.purchasedPrice,
        costPerUnit,
      ]],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Failed to update ingredient')
  }

  return costPerUnit
}

export async function deleteIngredient(sheetId: string, token: string, rowIndex: number) {
  const sheetRes = await fetch(`${SHEETS_BASE}/${sheetId}?fields=sheets.properties`, {
    headers: getHeaders(token),
  })

  if (!sheetRes.ok) {
    throw new Error('Failed to get sheet metadata')
  }

  const sheetData = await sheetRes.json()
  const found = sheetData.sheets.find(
    (s: { properties: { title: string } }) => s.properties.title === INGREDIENTS_SHEET
  )

  if (!found) {
    throw new Error('Ingredients sheet not found')
  }

  const sheetGridId = found.properties.sheetId

  const res = await fetch(`${SHEETS_BASE}/${sheetId}:batchUpdate`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheetGridId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Failed to delete ingredient')
  }

  return true
}

export async function saveRecipe(
  sheetId: string,
  token: string,
  recipe: { itemName: string; description: string; sellingPrice: number; totalCost: number }
): Promise<SavedRecipe> {
  await ensureSellingPriceSheet(sheetId, token)

  const nextNo = await getNextItemNo(sheetId, token)

  const range = `${SELLING_PRICE_SHEET}!A:E`
  const res = await fetch(`${SHEETS_BASE}/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      values: [[
        nextNo,
        recipe.itemName.trim(),
        recipe.description.trim(),
        recipe.sellingPrice,
        recipe.totalCost,
      ]],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Failed to save recipe')
  }

  return {
    rowIndex: 0,
    itemNo: nextNo,
    itemName: recipe.itemName,
    description: recipe.description,
    sellingPrice: recipe.sellingPrice,
    totalCost: recipe.totalCost,
  }
}

export async function getSavedRecipes(sheetId: string, token: string): Promise<SavedRecipe[]> {
  await ensureSellingPriceSheet(sheetId, token)

  const range = `${SELLING_PRICE_SHEET}!A:E`
  const res = await fetch(`${SHEETS_BASE}/${sheetId}/values/${range}`, {
    headers: getHeaders(token),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.error?.message || 'Failed to fetch saved recipes')
  }

  const data = await res.json()
  const rows = data.values || []
  if (rows.length <= 1) return []

  return rows.slice(1).map((row: string[], i: number) => ({
    rowIndex: i + 1,
    itemNo: Number(row[0]) || 0,
    itemName: row[1] || '',
    description: row[2] || '',
    sellingPrice: Number(row[3]) || 0,
    totalCost: Number(row[4]) || 0,
  }))
}

async function getNextItemNo(sheetId: string, token: string): Promise<number> {
  const range = `${SELLING_PRICE_SHEET}!A:A`
  const res = await fetch(`${SHEETS_BASE}/${sheetId}/values/${range}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) return 1
  const data = await res.json()
  const rows = data.values || []
  if (rows.length <= 1) return 1
  let maxNo = 0
  for (let i = 1; i < rows.length; i++) {
    const no = Number(rows[i][0]) || 0
    if (no > maxNo) maxNo = no
  }
  return maxNo + 1
}

export async function updateSellingPrice(
  sheetId: string,
  token: string,
  rowIndex: number,
  data: { itemNo: number; itemName: string; description: string; sellingPrice: number; totalCost: number }
) {
  const a1Row = rowIndex + 1
  const range = `${SELLING_PRICE_SHEET}!A${a1Row}:E${a1Row}`

  const res = await fetch(`${SHEETS_BASE}/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({
      values: [[
        data.itemNo,
        data.itemName.trim(),
        data.description.trim(),
        data.sellingPrice,
        data.totalCost,
      ]],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Failed to update selling price')
  }

  return true
}

export async function deleteSellingPrice(sheetId: string, token: string, rowIndex: number) {
  const sheetRes = await fetch(`${SHEETS_BASE}/${sheetId}?fields=sheets.properties`, {
    headers: getHeaders(token),
  })

  if (!sheetRes.ok) {
    throw new Error('Failed to get sheet metadata')
  }

  const sheetData = await sheetRes.json()
  const found = sheetData.sheets.find(
    (s: { properties: { title: string } }) => s.properties.title === SELLING_PRICE_SHEET
  )

  if (!found) {
    throw new Error('Selling_Price sheet not found')
  }

  const sheetGridId = found.properties.sheetId

  const res = await fetch(`${SHEETS_BASE}/${sheetId}:batchUpdate`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheetGridId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Failed to delete selling price record')
  }

  return true
}

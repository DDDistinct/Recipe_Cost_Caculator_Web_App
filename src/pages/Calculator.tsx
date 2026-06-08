import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { getIngredients, saveRecipe } from '../services/sheets'
import type { Ingredient, IngredientRow } from '../types'

interface Row {
  key: string
  ingredient: string
  quantityUsed: string
  unitCost: number
  totalCost: number
}

function generateKey() {
  return Math.random().toString(36).substring(2, 9)
}

function createEmptyRow(): Row {
  return { key: generateKey(), ingredient: '', quantityUsed: '', unitCost: 0, totalCost: 0 }
}

export default function Calculator() {
  const { sheetId, token } = useAuth()
  const { show } = useNotification()

  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(true)
  const [recipeName, setRecipeName] = useState('')
  const [description, setDescription] = useState('')
  const [markupPercent, setMarkupPercent] = useState('300')
  const [rows, setRows] = useState<Row[]>([createEmptyRow()])
  const [saving, setSaving] = useState(false)

  const fetchIngredients = useCallback(async () => {
    if (!sheetId || !token) {
      setLoadingIngredients(false)
      return
    }
    setLoadingIngredients(true)
    try {
      const data = await getIngredients(sheetId, token)
      setIngredients(data)
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to load ingredients', 'error')
    } finally {
      setLoadingIngredients(false)
    }
  }, [sheetId, token, show])

  useEffect(() => {
    fetchIngredients()
  }, [fetchIngredients])

  const ingredientMap = new Map(ingredients.map((i) => [i.name, i]))

  function handleIngredientChange(key: string, name: string) {
    const ing = ingredientMap.get(name)

    setRows((prev) => {
      const updated = prev.map((row) => {
        if (row.key !== key) return row
        const qty = Number(row.quantityUsed) || 0
        return {
          ...row,
          ingredient: name,
          unitCost: ing ? ing.costPerUnit : 0,
          totalCost: ing ? qty * ing.costPerUnit : 0,
        }
      })
      const lastRow = updated[updated.length - 1]
      if (lastRow.ingredient && lastRow.quantityUsed) {
        return [...updated, createEmptyRow()]
      }
      return updated
    })
  }

  function handleQuantityChange(key: string, value: string) {
    const qty = Number(value) || 0

    setRows((prev) => {
      const updated = prev.map((row) => {
        if (row.key !== key) return row
        const ing = ingredientMap.get(row.ingredient)
        const unitCost = ing ? ing.costPerUnit : 0
        return {
          ...row,
          quantityUsed: value,
          unitCost,
          totalCost: qty * unitCost,
        }
      })
      const lastRow = updated[updated.length - 1]
      if (lastRow.ingredient && lastRow.quantityUsed) {
        return [...updated, createEmptyRow()]
      }
      return updated
    })
  }

  function handleDeleteRow(key: string) {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  function getIngredientUnit(name: string): string {
    const ing = ingredientMap.get(name)
    return ing ? ing.unit : ''
  }

  const calculatedRows: IngredientRow[] = rows
    .filter((r) => r.ingredient && r.quantityUsed)
    .map((r) => ({
      ingredient: r.ingredient,
      quantityUsed: Number(r.quantityUsed) || 0,
      unitCost: r.unitCost,
      totalCost: r.totalCost,
    }))

  const totalRecipeCost = calculatedRows.reduce((sum, r) => sum + r.totalCost, 0)
  const markupValue = Number(markupPercent) || 0
  const markupAmount = totalRecipeCost * (markupValue / 100)
  const sellingPrice = totalRecipeCost + markupAmount

  function formatCurrency(value: number) {
    return `\u20B1${value.toFixed(2)}`
  }

  function handleReset() {
    setRecipeName('')
    setDescription('')
    setMarkupPercent('300')
    setRows([createEmptyRow()])
  }

  async function handleSaveRecipe() {
    if (!recipeName.trim()) {
      show('Please enter a recipe name', 'error')
      return
    }
    if (calculatedRows.length === 0) {
      show('Add at least one ingredient', 'error')
      return
    }
    if (!sheetId || !token) return

    setSaving(true)
    try {
      const saved = await saveRecipe(sheetId, token, {
        itemName: recipeName.trim(),
        description: description.trim(),
        sellingPrice,
        totalCost: totalRecipeCost,
      })
      show(`Recipe saved as Item #${saved.itemNo}`, 'success')
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to save recipe', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!sheetId) {
    return (
      <div className="text-center py-16">
        <p className="text-brown-600 text-lg mb-4">No Google Sheet connected</p>
        <Link to="/settings" className="text-brown-700 underline font-medium">
          Go to Settings to connect a sheet
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-brown-800 mb-6 flex items-center gap-3">
        <span className="w-1.5 h-7 bg-gradient-to-b from-mustard-500 to-brown-500 rounded-full inline-block" />
        Recipe Calculator
      </h2>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-brown-200 mb-6 card-hover">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-brown-600 mb-1">Recipe Name</label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="e.g. Iced Americano"
              className="w-full px-4 py-2.5 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800"
            />
          </div>
          <div>
            <label className="block text-xs text-brown-600 mb-1">Markup Percentage (%)</label>
            <input
              type="number"
              value={markupPercent}
              onChange={(e) => setMarkupPercent(e.target.value)}
              placeholder="e.g. 300"
              min="0"
              className="w-full px-4 py-2.5 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-brown-600 mb-1">Item Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Our best-selling iced coffee with espresso and water"
              className="w-full px-4 py-2.5 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800"
            />
          </div>
        </div>

        <h3 className="font-display font-bold text-brown-700 mb-3">Ingredients</h3>

        {loadingIngredients ? (
          <div className="text-center py-8 text-brown-500">
            <span className="inline-block w-5 h-5 border-2 border-brown-300 border-t-brown-700 rounded-full animate-spin mr-2 align-middle" />
            Loading ingredients from sheet...
          </div>
        ) : ingredients.length === 0 ? (
          <div className="text-center py-8 text-brown-500">
            No ingredients found.{' '}
            <Link to="/ingredients" className="text-brown-700 underline">
            Add ingredients first
          </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden sm:grid grid-cols-12 gap-3 text-xs text-brown-500 font-medium px-2">
              <div className="col-span-4">Ingredient</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Cost</div>
              <div className="col-span-3">Total Cost</div>
              <div className="col-span-1"></div>
            </div>

            {rows.map((row, index) => (
              <div
                key={row.key}
                className="grid grid-cols-12 gap-2 items-end p-2 rounded-lg bg-khaki-50/50"
              >
                <div className="col-span-12 sm:col-span-4">
                  {index === rows.length - 1 ? (
                    <select
                      value={row.ingredient}
                      onChange={(e) => handleIngredientChange(row.key, e.target.value)}
                      className="w-full px-3 py-2 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800 bg-white text-sm"
                    >
                      <option value="">Select ingredient...</option>
                      {ingredients.map((ing) => (
                        <option key={ing.ingredientNo} value={ing.name}>
                          {ing.name} ({ing.unit} - {formatCurrency(ing.costPerUnit)}/{ing.unit})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-brown-800 font-medium">{row.ingredient}</span>
                      <span className="text-xs text-brown-400">({getIngredientUnit(row.ingredient)})</span>
                    </div>
                  )}
                  {index === rows.length - 1 && (
                    <label className="block text-xs text-brown-400 mt-1 sm:hidden">Ingredient</label>
                  )}
                </div>

                <div className="col-span-5 sm:col-span-2">
                  <input
                    type="number"
                    value={row.quantityUsed}
                    onChange={(e) => handleQuantityChange(row.key, e.target.value)}
                    placeholder="Qty"
                    min="0"
                    step="any"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800 text-sm"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <div className="px-3 py-2 text-sm text-brown-700">
                    {row.unitCost > 0 ? formatCurrency(row.unitCost) : '-'}
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-3">
                  <div className="px-3 py-2 text-sm text-brown-800 font-medium">
                    {row.totalCost > 0 ? formatCurrency(row.totalCost) : '-'}
                  </div>
                </div>

                <div className="col-span-1 sm:col-span-1 flex justify-end">
                  {rows.length > 1 && (
                    <button
                      onClick={() => handleDeleteRow(row.key)}
                      className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer text-lg p-1"
                      title="Remove ingredient"
                    >
                      {'\u2716'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-brown-400 mt-4">
          Select an ingredient and enter quantity. A new row appears automatically.
        </p>
      </div>

      {calculatedRows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-brown-200 card-hover">
            <h3 className="font-display font-bold text-brown-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-mustard-500 to-brown-500 rounded-full inline-block" />
              {recipeName || 'Recipe'} &mdash; Breakdown
            </h3>

            <div className="space-y-2 mb-4">
              {calculatedRows.map((r, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-brown-100">
                  <span className="text-brown-700">
                    {r.ingredient} ({r.quantityUsed}{ingredientMap.get(r.ingredient)?.unit || ''})
                  </span>
                  <span className="text-brown-800 font-medium">{formatCurrency(r.totalCost)}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-brown-300 pt-3">
              <div className="flex justify-between text-base font-bold text-brown-800">
                <span>Total Recipe Cost</span>
                <span>{formatCurrency(totalRecipeCost)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-brown-200 card-hover">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-6 bg-gradient-to-b from-mustard-500 to-brown-500 rounded-full inline-block" />
              <h3 className="font-display font-bold text-brown-800">Pricing Summary</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-brown-100">
                <span className="text-brown-700">Total Recipe Cost</span>
                <span className="text-brown-800 font-medium">{formatCurrency(totalRecipeCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-brown-100">
                <span className="text-brown-700">Markup ({markupValue}%)</span>
                <span className="text-brown-800 font-medium">{formatCurrency(markupAmount)}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-lg font-display font-bold text-brown-800">Selling Price</span>
                <span className="text-lg font-display font-bold text-mustard-600">
                  {formatCurrency(sellingPrice)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSaveRecipe}
                disabled={saving || !recipeName.trim() || calculatedRows.length === 0}
                className="flex-1 btn-gradient disabled:bg-brown-300 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium border-none cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {saving ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Recipe to Sheet'
                )}
              </button>

              <button
                onClick={handleReset}
                className="bg-brown-100 hover:bg-brown-200 text-brown-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium border-none cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { getIngredients, addIngredient, updateIngredient, deleteIngredient } from '../services/sheets'
import type { Ingredient, Unit } from '../types'

const UNITS: Unit[] = ['g', 'ml', 'pc', 'L', 'kg']

export default function Ingredients() {
  const { sheetId, token } = useAuth()
  const { show } = useNotification()

  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState<Unit>('g')
  const [purchasedQty, setPurchasedQty] = useState('')
  const [purchasedPrice, setPurchasedPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null)
  const [editing, setEditing] = useState<Ingredient | null>(null)

  const fetchIngredients = useCallback(async () => {
    if (!sheetId || !token) return
    setLoading(true)
    try {
      const data = await getIngredients(sheetId, token)
      setIngredients(data)
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to load ingredients', 'error')
    } finally {
      setLoading(false)
    }
  }, [sheetId, token, show])

  useEffect(() => {
    fetchIngredients()
  }, [fetchIngredients])

  function startEdit(ing: Ingredient) {
    setEditing(ing)
    setName(ing.name)
    setUnit(ing.unit)
    setPurchasedQty(String(ing.purchasedQty))
    setPurchasedPrice(String(ing.purchasedPrice))
  }

  function cancelEdit() {
    setEditing(null)
    setName('')
    setUnit('g')
    setPurchasedQty('')
    setPurchasedPrice('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      show('Ingredient name is required', 'error')
      return
    }

    const qty = Number(purchasedQty)
    const price = Number(purchasedPrice)

    if (qty <= 0) {
      show('Purchased quantity must be greater than 0', 'error')
      return
    }

    if (price < 0) {
      show('Purchased price cannot be negative', 'error')
      return
    }

    if (!sheetId || !token) return

    setSaving(true)
    try {
      if (editing) {
        await updateIngredient(sheetId, token, editing.rowIndex, {
          name, unit, purchasedQty: qty, purchasedPrice: price, ingredientNo: editing.ingredientNo,
        })
        show('Ingredient updated successfully', 'success')
        cancelEdit()
      } else {
        await addIngredient(sheetId, token, { name, unit, purchasedQty: qty, purchasedPrice: price })
        show('Ingredient added successfully', 'success')
        setName('')
        setUnit('g')
        setPurchasedQty('')
        setPurchasedPrice('')
      }
      await fetchIngredients()
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to save ingredient', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(ingredient: Ingredient) {
    if (!sheetId || !token) return

    setDeletingIdx(ingredient.rowIndex)
    try {
      await deleteIngredient(sheetId, token, ingredient.rowIndex)
      show('Ingredient deleted', 'success')
      if (editing?.rowIndex === ingredient.rowIndex) cancelEdit()
      await fetchIngredients()
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to delete ingredient', 'error')
    } finally {
      setDeletingIdx(null)
    }
  }

  function formatCurrency(value: number) {
    return `\u20B1${value.toFixed(2)}`
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
        Ingredients
      </h2>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-brown-200 mb-6 card-hover">
        <h3 className="font-display font-bold text-brown-700 mb-4">
          {editing ? 'Edit Ingredient' : 'Add Ingredient'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-brown-600 mb-1">Ingredient Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coffee Beans"
              className="w-full px-3 py-2 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800"
            />
          </div>

          <div>
            <label className="block text-xs text-brown-600 mb-1">Unit / UOM</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className="w-full px-3 py-2 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800 bg-white"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-brown-600 mb-1">Purchased Quantity</label>
            <input
              type="number"
              value={purchasedQty}
              onChange={(e) => setPurchasedQty(e.target.value)}
              placeholder="e.g. 1000"
              min="0"
              step="any"
              className="w-full px-3 py-2 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800"
            />
          </div>

          <div>
            <label className="block text-xs text-brown-600 mb-1">Purchased Price (PHP)</label>
            <input
              type="number"
              value={purchasedPrice}
              onChange={(e) => setPurchasedPrice(e.target.value)}
              placeholder="e.g. 700"
              min="0"
              step="any"
              className="w-full px-3 py-2 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 btn-gradient disabled:bg-brown-300 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium border-none cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {saving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editing ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                editing ? 'Update Ingredient' : 'Add Ingredient'
              )}
            </button>

            {editing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-brown-100 hover:bg-brown-200 text-brown-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium border-none cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {!editing && name && purchasedQty && Number(purchasedQty) > 0 && (
          <div className="mt-3 p-3 bg-khaki-100 rounded-lg text-sm text-brown-700">
            Cost Per Unit: {formatCurrency(Number(purchasedPrice) / Number(purchasedQty))} / {unit}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-brown-200 overflow-hidden card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brown-800 text-khaki-200">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Ingredient Name</th>
                <th className="text-left px-4 py-3 font-medium">Unit</th>
                <th className="text-right px-4 py-3 font-medium">Purchased Qty</th>
                <th className="text-right px-4 py-3 font-medium">Purchased Price</th>
                <th className="text-right px-4 py-3 font-medium">Cost / Unit</th>
                <th className="px-4 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-brown-500">
                    <span className="inline-block w-5 h-5 border-2 border-brown-300 border-t-brown-700 rounded-full animate-spin mr-2 align-middle" />
                    Loading ingredients...
                  </td>
                </tr>
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-brown-500">
                    No ingredients yet. Add your first ingredient above.
                  </td>
                </tr>
              ) : (
                ingredients.map((ing, index) => (
                  <tr key={ing.rowIndex} className={index % 2 === 0 ? 'bg-white' : 'bg-khaki-50/50'}>
                    <td className="px-4 py-3 text-brown-500 text-sm">{ing.ingredientNo}</td>
                    <td className="px-4 py-3 text-brown-800 font-medium">{ing.name}</td>
                    <td className="px-4 py-3 text-brown-600">{ing.unit}</td>
                    <td className="px-4 py-3 text-brown-800 text-right">{ing.purchasedQty}</td>
                    <td className="px-4 py-3 text-brown-800 text-right">{formatCurrency(ing.purchasedPrice)}</td>
                    <td className="px-4 py-3 text-brown-800 text-right font-medium">{formatCurrency(ing.costPerUnit)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => startEdit(ing)}
                          className="text-brown-500 hover:text-brown-700 bg-transparent border-none cursor-pointer text-sm p-1"
                          title="Edit ingredient"
                        >
                          {'\u270E'}
                        </button>
                        <button
                          onClick={() => handleDelete(ing)}
                          disabled={deletingIdx === ing.rowIndex}
                          className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer text-sm disabled:opacity-50 p-1"
                          title="Delete ingredient"
                        >
                          {deletingIdx === ing.rowIndex ? (
                            <span className="inline-block w-3.5 h-3.5 border-2 border-red-300 border-t-red-700 rounded-full animate-spin" />
                          ) : (
                            '\u2716'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

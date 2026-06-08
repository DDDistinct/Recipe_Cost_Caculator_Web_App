import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { getSavedRecipes, updateSellingPrice, deleteSellingPrice } from '../services/sheets'
import type { SavedRecipe } from '../types'

export default function SellingPrice() {
  const { sheetId, token } = useAuth()
  const { show } = useNotification()

  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<SavedRecipe | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSelling, setEditSelling] = useState('')
  const [editCost, setEditCost] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null)

  const fetchRecipes = useCallback(async () => {
    if (!sheetId || !token) return
    setLoading(true)
    try {
      const data = await getSavedRecipes(sheetId, token)
      setRecipes(data)
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to load recipes', 'error')
    } finally {
      setLoading(false)
    }
  }, [sheetId, token, show])

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  function startEdit(r: SavedRecipe) {
    setEditing(r)
    setEditName(r.itemName)
    setEditDesc(r.description)
    setEditSelling(String(r.sellingPrice))
    setEditCost(String(r.totalCost))
  }

  function cancelEdit() {
    setEditing(null)
    setEditName('')
    setEditDesc('')
    setEditSelling('')
    setEditCost('')
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()

    if (!editName.trim() || !editing) {
      show('Item name is required', 'error')
      return
    }

    const selling = Number(editSelling)
    const cost = Number(editCost)

    if (selling < 0 || cost < 0) {
      show('Prices cannot be negative', 'error')
      return
    }

    if (!sheetId || !token) return

    setSaving(true)
    try {
      await updateSellingPrice(sheetId, token, editing.rowIndex, {
        itemNo: editing.itemNo,
        itemName: editName.trim(),
        description: editDesc.trim(),
        sellingPrice: selling,
        totalCost: cost,
      })
      show('Record updated successfully', 'success')
      cancelEdit()
      await fetchRecipes()
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to update record', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(recipe: SavedRecipe) {
    if (!sheetId || !token) return

    setDeletingIdx(recipe.rowIndex)
    try {
      await deleteSellingPrice(sheetId, token, recipe.rowIndex)
      show('Record deleted', 'success')
      if (editing?.rowIndex === recipe.rowIndex) cancelEdit()
      await fetchRecipes()
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to delete record', 'error')
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
        Selling Price Records
      </h2>

      {editing && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-brown-200 mb-6 card-hover">
          <h3 className="font-display font-bold text-brown-700 mb-4">
            Edit Record #{editing.itemNo}
          </h3>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-brown-600 mb-1">Item Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800"
              />
            </div>
            <div>
              <label className="block text-xs text-brown-600 mb-1">Item Description</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800"
              />
            </div>
            <div>
              <label className="block text-xs text-brown-600 mb-1">Selling Price (PHP)</label>
              <input
                type="number"
                value={editSelling}
                onChange={(e) => setEditSelling(e.target.value)}
                min="0"
                step="any"
                className="w-full px-3 py-2 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800"
              />
            </div>
            <div>
              <label className="block text-xs text-brown-600 mb-1">Total Cost (PHP)</label>
              <input
                type="number"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                min="0"
                step="any"
                className="w-full px-3 py-2 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving || !editName.trim()}
                className="btn-gradient disabled:bg-brown-300 text-white px-5 py-2 rounded-lg transition-all duration-200 text-sm font-medium border-none cursor-pointer disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                {saving ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-brown-100 hover:bg-brown-200 text-brown-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium border-none cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-brown-200 overflow-hidden card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brown-800 text-khaki-200">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Item Name</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-right px-4 py-3 font-medium">Total Cost</th>
                <th className="text-right px-4 py-3 font-medium">Selling Price</th>
                <th className="px-4 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-brown-500">
                    <span className="inline-block w-5 h-5 border-2 border-brown-300 border-t-brown-700 rounded-full animate-spin mr-2 align-middle" />
                    Loading records...
                  </td>
                </tr>
              ) : recipes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-brown-500">
                    No records found. Save a recipe from the{' '}
                    <Link to="/calculator" className="text-brown-700 underline">Calculator</Link> page.
                  </td>
                </tr>
              ) : (
                recipes.map((r, index) => (
                  <tr key={r.rowIndex} className={index % 2 === 0 ? 'bg-white' : 'bg-khaki-50/50'}>
                    <td className="px-4 py-3 text-brown-500 text-sm">{r.itemNo}</td>
                    <td className="px-4 py-3 text-brown-800 font-medium">{r.itemName}</td>
                    <td className="px-4 py-3 text-brown-600 max-w-xs truncate">{r.description || '-'}</td>
                    <td className="px-4 py-3 text-brown-800 text-right">{formatCurrency(r.totalCost)}</td>
                    <td className="px-4 py-3 text-brown-800 text-right font-medium">{formatCurrency(r.sellingPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => startEdit(r)}
                          className="text-brown-500 hover:text-brown-700 bg-transparent border-none cursor-pointer text-sm p-1"
                          title="Edit record"
                        >
                          {'\u270E'}
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={deletingIdx === r.rowIndex}
                          className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer text-sm disabled:opacity-50 p-1"
                          title="Delete record"
                        >
                          {deletingIdx === r.rowIndex ? (
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

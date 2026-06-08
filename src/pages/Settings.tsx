import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { testConnection, ensureIngredientsSheet } from '../services/sheets'

export default function Settings() {
  const { sheetId, setSheetId, token } = useAuth()
  const { show } = useNotification()
  const [inputValue, setInputValue] = useState(sheetId)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleTest() {
    if (!inputValue.trim()) {
      show('Please enter a Sheet ID', 'error')
      return
    }
    if (!token) {
      show('Not authenticated. Please login again.', 'error')
      return
    }

    setTesting(true)
    try {
      await testConnection(inputValue.trim(), token)
      await ensureIngredientsSheet(inputValue.trim(), token)
      show('Connection successful! Ingredients sheet is ready.', 'success')
    } catch (err) {
      show(err instanceof Error ? err.message : 'Connection failed', 'error')
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    if (!inputValue.trim()) {
      show('Please enter a Sheet ID', 'error')
      return
    }

    setSaving(true)
    try {
      setSheetId(inputValue.trim())
      show('Settings saved', 'success')
    } catch {
      show('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleClear() {
    setInputValue('')
    setSheetId('')
    show('Sheet ID cleared', 'info')
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-brown-800 mb-6 flex items-center gap-3">
        <span className="w-1.5 h-7 bg-gradient-to-b from-mustard-500 to-brown-500 rounded-full inline-block" />
        Settings
      </h2>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-brown-200 card-hover">
        <label className="block text-sm font-medium text-brown-700 mb-2">
          Google Sheet ID
        </label>
        <p className="text-xs text-brown-500 mb-3">
          Find this in your sheet URL: https://docs.google.com/spreadsheets/d/<strong className="text-brown-700">YOUR_SHEET_ID</strong>/edit
        </p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter your Google Sheet ID"
          className="w-full px-4 py-2.5 border border-brown-300 rounded-lg focus:ring-2 focus:ring-mustard-400 focus:border-transparent outline-none text-brown-800 bg-white mb-4"
        />

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !inputValue.trim()}
            className="btn-gradient disabled:bg-brown-300 text-white px-5 py-2 rounded-lg transition-all duration-200 text-sm font-medium border-none cursor-pointer disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            {saving ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>

          <button
            onClick={handleTest}
            disabled={testing || !inputValue.trim()}
            className="bg-mustard-500 hover:bg-mustard-600 disabled:bg-mustard-200 text-brown-900 px-5 py-2 rounded-lg transition-colors text-sm font-medium border-none cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-brown-900/30 border-t-brown-900 rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </button>

          <button
            onClick={handleClear}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2 rounded-lg transition-colors text-sm font-medium border-none cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-brown-200 mt-6 card-hover">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-mustard-500 text-lg">{'\u2139'}</span>
          <h3 className="font-display font-bold text-brown-800">
            How to get your Sheet ID
          </h3>
        </div>
        <ol className="text-sm text-brown-600 space-y-2 list-decimal list-inside">
          <li>Go to <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-brown-700 underline">Google Sheets</a></li>
          <li>Create a new spreadsheet</li>
          <li>Copy the ID from the URL (the long string between /d/ and /edit)</li>
          <li>Paste it above and click &quot;Test Connection&quot;</li>
          <li>An &quot;Ingredients&quot; sheet will be created automatically</li>
        </ol>
      </div>
    </div>
  )
}

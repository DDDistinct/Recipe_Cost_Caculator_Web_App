import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { UserProfile } from '../types'

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  sheetId: string
  setUser: (user: UserProfile | null) => void
  setToken: (token: string | null) => void
  setSheetId: (id: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SHEET_ID_KEY = 'rcc_sheet_id'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [sheetId, setSheetIdState] = useState<string>(() => {
    return localStorage.getItem(SHEET_ID_KEY) || ''
  })

  const setToken = useCallback((t: string | null) => {
    setTokenState(t)
  }, [])

  const setSheetId = useCallback((id: string) => {
    setSheetIdState(id)
    localStorage.setItem(SHEET_ID_KEY, id)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setTokenState(null)
  }, [])

  const value = {
    user,
    token,
    sheetId,
    setUser,
    setToken,
    setSheetId,
    logout,
    isAuthenticated: !!user && !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

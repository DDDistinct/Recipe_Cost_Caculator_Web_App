import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Notification {
  message: string
  type: 'success' | 'error' | 'info'
}

interface NotificationContextType {
  notification: Notification | null
  show: (message: string, type?: 'success' | 'error' | 'info') => void
  hide: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<Notification | null>(null)

  const show = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
  }, [])

  const hide = useCallback(() => {
    setNotification(null)
  }, [])

  return (
    <NotificationContext.Provider value={{ notification, show, hide }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}

import { useEffect } from 'react'
import { useNotification } from '../context/NotificationContext'

export default function Notification() {
  const { notification, hide } = useNotification()

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(hide, 4000)
      return () => clearTimeout(timer)
    }
  }, [notification, hide])

  if (!notification) return null

  const bgMap = {
    success: 'bg-green-700',
    error: 'bg-red-700',
    info: 'bg-brown-700',
  }

  const iconMap = {
    success: '\u2713',
    error: '\u2717',
    info: '\u2139',
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgMap[notification.type]} text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-sm animate-slide-in`}>
      <span className="text-lg">{iconMap[notification.type]}</span>
      <span className="text-sm flex-1">{notification.message}</span>
      <button
        onClick={hide}
        className="text-white/70 hover:text-white text-lg leading-none bg-transparent border-none cursor-pointer p-0"
      >
        &times;
      </button>
    </div>
  )
}

import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Notification from './Notification'
import { LOGO_URL } from '../config'

const navItems = [
  { to: '/settings', label: 'Settings' },
  { to: '/ingredients', label: 'Ingredients' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/selling-price', label: 'Selling Price' },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5EDE2' }}>
      <Notification />

      <header className="bg-gradient-to-r from-brown-900 via-brown-800 to-brown-700 text-white shadow-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink to="/calculator" className="flex items-center gap-3 no-underline group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mustard-400 to-mustard-600 p-0.5 shadow-md flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
              <img
                src={LOGO_URL}
                alt="DBrista"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-display font-bold text-white leading-tight">
                DBrista
              </span>
              <span className="text-[10px] text-khaki-300 leading-tight hidden sm:inline">
                Recipe Cost Calculator
              </span>
            </div>
          </NavLink>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-2 bg-brown-700/50 rounded-full pl-1 pr-3 py-1">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-7 h-7 rounded-full border border-brown-500"
                />
                <span className="text-xs text-khaki-200 max-w-[100px] truncate">{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-xs bg-brown-700 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-all duration-200 border border-brown-600 hover:border-red-600 cursor-pointer text-white font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        <nav className="bg-brown-900/40 backdrop-blur-sm border-t border-brown-700/50">
          <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm font-medium transition-all duration-200 no-underline whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'text-mustard-300 border-mustard-400 bg-brown-800/30'
                      : 'text-khaki-300 border-transparent hover:text-white hover:border-khaki-500'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

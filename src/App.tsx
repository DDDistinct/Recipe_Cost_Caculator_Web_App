import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Ingredients from './pages/Ingredients'
import Calculator from './pages/Calculator'
import SellingPrice from './pages/SellingPrice'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter basename="/Recipe_Cost_Caculator_Web_App">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/settings" element={<Settings />} />
                <Route path="/ingredients" element={<Ingredients />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/selling-price" element={<SellingPrice />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

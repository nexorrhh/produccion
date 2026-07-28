import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './app/auth/AuthContext'
import { LoginPage } from './app/auth/LoginPage'
import { ProtectedRoute } from './app/auth/ProtectedRoute'
import { AppLayout } from './app/layout/AppLayout'
import { moduleRegistry } from './app/moduleRegistry'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={moduleRegistry[0].path} replace />} />
          {moduleRegistry.map((mod) => (
            <Route key={mod.key} path={mod.path.slice(1)} element={mod.element} />
          ))}
        </Route>
      </Routes>
    </AuthProvider>
  )
}

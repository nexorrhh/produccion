import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './app/auth/AuthContext'
import { LoginPage } from './app/auth/LoginPage'
import { ProtectedRoute } from './app/auth/ProtectedRoute'
import { ModuloGuard, SuperadminGuard } from './app/auth/ModuloGuard'
import { useModulosPermitidos } from './app/auth/useModulosPermitidos'
import { AppLayout } from './app/layout/AppLayout'
import { moduleRegistry } from './app/moduleRegistry'
import { ConfiguracionPage } from './modules/configuracion/ConfiguracionPage'

// Antes mandaba siempre al primer módulo del registro, sin importar si
// la persona logueada lo tenía permitido o no (lo escondía el Sidebar,
// pero la redirección igual apuntaba ahí). Ahora espera a saber qué
// módulos tiene permitidos y manda al primero de esa lista.
function IndiceInicial() {
  const modulos = useModulosPermitidos()
  if (modulos === null) return null
  const primero = moduleRegistry.find((mod) => modulos.includes(mod.key))
  return <Navigate to={primero ? primero.path : '/login'} replace />
}

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
          <Route index element={<IndiceInicial />} />
          {moduleRegistry.map((mod) => (
            <Route
              key={mod.key}
              path={mod.path.slice(1)}
              element={<ModuloGuard moduleKey={mod.key}>{mod.element}</ModuloGuard>}
            />
          ))}
          <Route
            path="configuracion"
            element={
              <SuperadminGuard>
                <ConfiguracionPage />
              </SuperadminGuard>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

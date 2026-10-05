import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useModulosPermitidos } from './useModulosPermitidos'

// Cierra el hueco que tenía el esquema anterior: el Sidebar escondía el
// link de un módulo sin permiso, pero nada impedía entrar a su ruta
// escribiéndola a mano en el navegador. Ahora la propia ruta se protege.
export function ModuloGuard({ moduleKey, children }) {
  const modulos = useModulosPermitidos()
  if (modulos === null) return null // evita un redirect en falso mientras carga
  if (!modulos.includes(moduleKey)) return <Navigate to="/" replace />
  return children
}

// Configuración es exclusivo de rol==='superadmin' — nunca se asigna por
// perfil (ver useModulosPermitidos.js), así que tiene su propio guard.
export function SuperadminGuard({ children }) {
  const { user } = useAuth()
  if (user?.rol !== 'superadmin') return <Navigate to="/" replace />
  return children
}

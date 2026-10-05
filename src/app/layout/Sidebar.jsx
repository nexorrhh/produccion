import { NavLink } from 'react-router-dom'
import { moduleRegistry, GRUPOS_MODULO } from '../moduleRegistry'
import { useAuth } from '../auth/useAuth'
import { useModulosPermitidos } from '../auth/useModulosPermitidos'
import './layout.css'

export function Sidebar() {
  const { user } = useAuth()
  const modulosPermitidos = useModulosPermitidos()
  const visibles = moduleRegistry.filter((mod) => modulosPermitidos?.includes(mod.key))

  return (
    <nav className="sidebar">
      {GRUPOS_MODULO.map((grupo) => {
        const deEsteGrupo = visibles.filter((mod) => mod.grupo === grupo.key)
        if (!deEsteGrupo.length) return null
        return (
          <div className="sidebar-grupo" key={grupo.key}>
            <div className="sidebar-grupo-titulo">{grupo.label}</div>
            {deEsteGrupo.map((mod) => (
              <NavLink
                key={mod.key}
                to={mod.path}
                className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
              >
                {mod.label}
              </NavLink>
            ))}
          </div>
        )
      })}
      {user?.rol === 'superadmin' && (
        <div className="sidebar-grupo">
          <div className="sidebar-grupo-titulo">Administración</div>
          <NavLink to="/configuracion" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            Configuración
          </NavLink>
        </div>
      )}
    </nav>
  )
}

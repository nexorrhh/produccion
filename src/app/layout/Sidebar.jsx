import { NavLink } from 'react-router-dom'
import { moduleRegistry, GRUPOS_MODULO } from '../moduleRegistry'
import { useAuth } from '../auth/useAuth'
import { useModulosPermitidos } from '../auth/useModulosPermitidos'
import './layout.css'

const iconos = {
  operativos: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
  'busqueda-personal': <><circle cx="10" cy="8" r="4" /><path d="M3 21c.7-4 3-6 7-6s6.3 2 7 6M17 8h5M19.5 5.5v5" /></>,
  polivalencia: <><path d="M4 5h16v14H4zM4 10h16M10 5v14" /></>,
  auditoria: <><path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  plantel: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c.4-4 2.5-6 6-6s5.6 2 6 6M15 15c3.6-.4 5.5 1.3 6 4" /></>,
  'horas-presentismo': <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  configuracion: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5v-3l-2-.7-.5-1.2.9-1.9-2.1-2.1-1.9.9-1.2-.5-.7-2h-3l-.7 2-1.2.5-1.9-.9L2.6 6.7l.9 1.9-.5 1.2-2 .7v3l2 .7.5 1.2-.9 1.9 2.1 2.1 1.9-.9 1.2.5.7 2h3l.7-2 1.2-.5 1.9.9 2.1-2.1-.9-1.9.5-1.2 2-.7Z" /></>,
}

function NavIcon({ name }) {
  return <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconos[name]}</svg>
}

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
                <NavIcon name={mod.key} /><span>{mod.label}</span><i aria-hidden="true">›</i>
              </NavLink>
            ))}
          </div>
        )
      })}
      {user?.rol === 'superadmin' && (
        <div className="sidebar-grupo">
          <div className="sidebar-grupo-titulo">Administración</div>
          <NavLink to="/configuracion" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            <NavIcon name="configuracion" /><span>Configuración</span><i aria-hidden="true">›</i>
          </NavLink>
        </div>
      )}
    </nav>
  )
}

import { NavLink } from 'react-router-dom'
import { moduleRegistry } from '../moduleRegistry'
import { useAuth } from '../auth/useAuth'
import './layout.css'

export function Sidebar() {
  const { user } = useAuth()
  const visibles = moduleRegistry.filter((mod) => !mod.roles || mod.roles.includes(user?.rol))

  return (
    <nav className="sidebar">
      {visibles.map((mod) => (
        <NavLink
          key={mod.key}
          to={mod.path}
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
        >
          {mod.label}
        </NavLink>
      ))}
    </nav>
  )
}

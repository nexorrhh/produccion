import { NavLink } from 'react-router-dom'
import { moduleRegistry } from '../moduleRegistry'
import './layout.css'

export function Sidebar() {
  return (
    <nav className="sidebar">
      {moduleRegistry.map((mod) => (
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

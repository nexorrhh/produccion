import { useAuth } from '../auth/useAuth'
import { CompanyLogo } from '../components/CompanyLogo'
import './layout.css'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="app-header">
      <div className="brand">
        <CompanyLogo />
        <span className="brand-divider" aria-hidden="true" />
        <div className="brand-product">Panel de Producción</div>
      </div>
      <div className="header-actions">
        {user && (
          <>
            <span className="header-user"><i>{user.nombre_apellido?.charAt(0)}</i>{user.nombre_apellido}</span>
            <button className="btn btn-ghost" onClick={logout}>
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </header>
  )
}

import { useAuth } from '../auth/useAuth'
import './layout.css'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <div>
          <div className="brand-name">Panel de Producción</div>
          <div className="brand-sub">Cimomet S.A. &amp; Co.mo.ing S.R.L.</div>
        </div>
      </div>
      <div className="header-actions">
        {user && (
          <>
            <span className="header-user">{user.nombre_apellido}</span>
            <button className="btn btn-ghost" onClick={logout}>
              Salir
            </button>
          </>
        )}
      </div>
    </header>
  )
}

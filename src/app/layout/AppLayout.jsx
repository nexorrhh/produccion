import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import './layout.css'

export function AppLayout() {
  const location = useLocation()
  return (
    <div className="app-shell-root">
      <Header />
      <div className="app-shell">
        <Sidebar />
        <main className="app-content">
          <div key={location.pathname} className="app-fade">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

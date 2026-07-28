import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import './layout.css'

export function AppLayout() {
  return (
    <div className="app-shell-root">
      <Header />
      <div className="app-shell">
        <Sidebar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../../../app/auth/useAuth'
import { useNotificaciones } from '../hooks/useNotificaciones'

export function NotificacionesModal({ onCerrar }) {
  const { user } = useAuth()
  const { destinatarios, cargando, agregar, actualizar, eliminar } = useNotificaciones()
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function handleAgregar(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return
    setGuardando(true)
    try {
      await agregar(email, nombre, user.id)
      setEmail('')
      setNombre('')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleToggleActivo(d) {
    setError('')
    try {
      await actualizar(d.id, { activo: !d.activo }, user.id)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleEliminar(d) {
    setError('')
    if (!confirm('¿Borrar ' + d.email + '? No se puede deshacer.')) return
    try {
      await eliminar(d.id)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="noti-overlay" onClick={onCerrar}>
      <div className="noti-panel" onClick={(e) => e.stopPropagation()}>
        <div className="noti-header">
          <div>
            <div className="noti-titulo">Destinatarios del listado</div>
            <div className="noti-sub">
              Reciben por mail el PDF del listado de convocados cada vez que se guarda una citación.
            </div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onCerrar}>
            Cerrar
          </button>
        </div>

        {error && <div className="noti-error">{error}</div>}

        {cargando ? (
          <div className="noti-vacio">Cargando…</div>
        ) : (
          <div className="noti-lista">
            {destinatarios.length === 0 && <div className="noti-vacio">Todavía no hay destinatarios cargados.</div>}
            {destinatarios.map((d) => (
              <div className={'noti-fila' + (d.activo ? '' : ' inactivo')} key={d.id}>
                <input
                  type="checkbox"
                  className="op-chk"
                  checked={d.activo}
                  onChange={() => handleToggleActivo(d)}
                  title={d.activo ? 'Desactivar' : 'Activar'}
                />
                <div className="noti-fila-info">
                  <div className="noti-fila-email">{d.email}</div>
                  {d.nombre && <div className="noti-fila-nombre">{d.nombre}</div>}
                </div>
                {!d.activo && <span className="noti-fila-estado">Inactivo</span>}
                <button
                  type="button"
                  className="noti-fila-borrar"
                  onClick={() => handleEliminar(d)}
                  title="Borrar"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <form className="noti-form" onSubmit={handleAgregar}>
          <input
            type="email"
            placeholder="correo@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Nombre (opcional, ej. RRHH)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <button type="submit" className="btn btn-green" disabled={guardando}>
            {guardando ? 'Agregando…' : 'Agregar'}
          </button>
        </form>
      </div>
    </div>
  )
}

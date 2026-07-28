import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import './login.css'

function iniciales(nombreApellido) {
  const [apellido, nombre] = (nombreApellido || '').split(',').map((s) => s.trim())
  const a = (apellido || '')[0] || ''
  const n = (nombre || '')[0] || ''
  return (a + n).toUpperCase()
}

export function LoginPage() {
  const { user, listarUsuarios } = useAuth()
  const location = useLocation()
  const [usuarios, setUsuarios] = useState(null)
  const [error, setError] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    let cancelled = false
    listarUsuarios()
      .then((data) => !cancelled && setUsuarios(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [listarUsuarios])

  if (user) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <div>
            <div className="login-title">Panel de Producción</div>
            <div className="login-sub">Cimomet S.A. &amp; Co.mo.ing S.R.L.</div>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        {!seleccionado ? (
          <PersonGrid usuarios={usuarios} onElegir={setSeleccionado} />
        ) : seleccionado.tiene_pin ? (
          <PinEntryForm usuario={seleccionado} onVolver={() => setSeleccionado(null)} />
        ) : (
          <CrearPinForm usuario={seleccionado} onVolver={() => setSeleccionado(null)} />
        )}
      </div>
    </div>
  )
}

function PersonGrid({ usuarios, onElegir }) {
  if (!usuarios) return <div className="login-hint">Cargando…</div>
  if (!usuarios.length) return <div className="login-hint">No hay perfiles activos.</div>

  return (
    <>
      <div className="login-label login-grid-title">¿Quién está usando este portal?</div>
      <div className="person-grid">
        {usuarios.map((u) => (
          <button key={u.id} className="person-card" onClick={() => onElegir(u)} type="button">
            <span className="person-avatar">{iniciales(u.nombre_apellido)}</span>
            <span className="person-name">{u.nombre_apellido}</span>
            {!u.tiene_pin && <span className="person-badge">Crear PIN</span>}
          </button>
        ))}
      </div>
    </>
  )
}

function PinEntryForm({ usuario, onVolver }) {
  const { login } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (pin.length !== 4) {
      setError('El PIN tiene 4 dígitos')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(usuario.id, pin)
    } catch (err) {
      setError(err.message)
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PersonaSeleccionada usuario={usuario} onVolver={onVolver} />

      <label className="login-label" htmlFor="pin">
        PIN de acceso
      </label>
      <input
        id="pin"
        className="login-pin-input"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
        autoFocus
      />

      {error && <div className="login-error">{error}</div>}

      <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
        {loading ? 'Verificando…' : 'Ingresar'}
      </button>
    </form>
  )
}

function CrearPinForm({ usuario, onVolver }) {
  const { crearPin } = useAuth()
  const [pin, setPin] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (pin.length !== 4) {
      setError('El PIN tiene 4 dígitos')
      return
    }
    if (pin !== confirmar) {
      setError('Los PIN no coinciden')
      return
    }
    setLoading(true)
    try {
      await crearPin(usuario.id, pin)
    } catch (err) {
      setError(err.message)
      setPin('')
      setConfirmar('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PersonaSeleccionada usuario={usuario} onVolver={onVolver} />

      <label className="login-label" htmlFor="nuevo-pin">
        Elegí tu PIN (nadie más lo va a ver)
      </label>
      <input
        id="nuevo-pin"
        className="login-pin-input"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
        autoFocus
      />

      <label className="login-label" htmlFor="confirmar-pin">
        Repetilo
      </label>
      <input
        id="confirmar-pin"
        className="login-pin-input"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={confirmar}
        onChange={(e) => setConfirmar(e.target.value.replace(/\D/g, '').slice(0, 4))}
      />

      {error && <div className="login-error">{error}</div>}

      <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
        {loading ? 'Guardando…' : 'Crear PIN y entrar'}
      </button>
    </form>
  )
}

function PersonaSeleccionada({ usuario, onVolver }) {
  return (
    <div className="persona-seleccionada">
      <span className="person-avatar small">{iniciales(usuario.nombre_apellido)}</span>
      <span className="persona-seleccionada-nombre">{usuario.nombre_apellido}</span>
      <button type="button" className="btn btn-ghost persona-volver" onClick={onVolver}>
        Cambiar
      </button>
    </div>
  )
}

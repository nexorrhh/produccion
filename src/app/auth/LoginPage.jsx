import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import './login.css'

export function LoginPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [modo, setModo] = useState('ingresar') // ingresar | crear

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

        <div className="login-tabs">
          <button className={modo === 'ingresar' ? 'active' : ''} onClick={() => setModo('ingresar')} type="button">
            Ingresar
          </button>
          <button className={modo === 'crear' ? 'active' : ''} onClick={() => setModo('crear')} type="button">
            Crear mi PIN
          </button>
        </div>

        {modo === 'ingresar' ? <IngresarForm /> : <CrearPinForm onListo={() => setModo('ingresar')} />}
      </div>
    </div>
  )
}

function IngresarForm() {
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
      await login(pin)
    } catch (err) {
      setError(err.message)
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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

function CrearPinForm({ onListo }) {
  const { listarSinPin, crearPin } = useAuth()
  const [perfiles, setPerfiles] = useState(null)
  const [perfilId, setPerfilId] = useState('')
  const [pin, setPin] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    listarSinPin()
      .then((data) => {
        if (cancelled) return
        setPerfiles(data)
        if (data.length === 1) setPerfilId(data[0].id)
      })
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [listarSinPin])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!perfilId) {
      setError('Elegí tu nombre')
      return
    }
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
      await crearPin(perfilId, pin)
      setOk('Listo, entrando…')
    } catch (err) {
      setError(err.message)
      setPin('')
      setConfirmar('')
    } finally {
      setLoading(false)
    }
  }

  if (perfiles && perfiles.length === 0) {
    return <div className="login-hint">No quedan perfiles sin PIN por definir.</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="login-label" htmlFor="perfil">
        Tu nombre
      </label>
      <select id="perfil" className="login-select" value={perfilId} onChange={(e) => setPerfilId(e.target.value)}>
        <option value="">{perfiles ? 'Elegí tu nombre…' : 'Cargando…'}</option>
        {(perfiles || []).map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre_apellido}
          </option>
        ))}
      </select>

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
      {ok && <div className="login-ok">{ok}</div>}

      <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
        {loading ? 'Guardando…' : 'Crear PIN y entrar'}
      </button>
    </form>
  )
}

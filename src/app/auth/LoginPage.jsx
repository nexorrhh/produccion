import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import './login.css'

export function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

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

  function handlePinChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(digits)
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
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
          onChange={handlePinChange}
          autoFocus
        />

        {error && <div className="login-error">{error}</div>}

        <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
          {loading ? 'Verificando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../../../app/auth/useAuth'
import { useOt } from '../hooks/useOt'

export function OtModal({ onCerrar }) {
  const { user } = useAuth()
  const { ots, cargando, agregar, actualizar } = useOt()
  const [numero, setNumero] = useState('')
  const [cliente, setCliente] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function handleAgregar(e) {
    e.preventDefault()
    setError('')
    if (!numero || !cliente.trim()) return
    setGuardando(true)
    try {
      await agregar(Number(numero), cliente, user.id)
      setNumero('')
      setCliente('')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleToggleActivo(o) {
    setError('')
    try {
      await actualizar(o.id, { activo: !o.activo }, user.id)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="noti-overlay" onClick={onCerrar}>
      <div className="noti-panel" onClick={(e) => e.stopPropagation()}>
        <div className="noti-header">
          <div>
            <div className="noti-titulo">OT disponibles</div>
            <div className="noti-sub">Opciones que aparecen en el desplegable de Nº OT al citar.</div>
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
            {ots.length === 0 && <div className="noti-vacio">Todavía no hay OT cargadas.</div>}
            {ots.map((o) => (
              <div className={'noti-fila' + (o.activo ? '' : ' inactivo')} key={o.id}>
                <input
                  type="checkbox"
                  className="op-chk"
                  checked={o.activo}
                  onChange={() => handleToggleActivo(o)}
                  title={o.activo ? 'Desactivar' : 'Activar'}
                />
                <div className="noti-fila-info">
                  <div className="noti-fila-email">
                    {o.numero} — {o.cliente}
                  </div>
                </div>
                {!o.activo && <span className="noti-fila-estado">Inactivo</span>}
              </div>
            ))}
          </div>
        )}

        <form className="noti-form" onSubmit={handleAgregar}>
          <input
            type="number"
            placeholder="Nº OT"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            style={{ flex: '0 1 100px' }}
            required
          />
          <input
            type="text"
            placeholder="Cliente (ej. YPF)"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-green" disabled={guardando}>
            {guardando ? 'Agregando…' : 'Agregar'}
          </button>
        </form>
      </div>
    </div>
  )
}

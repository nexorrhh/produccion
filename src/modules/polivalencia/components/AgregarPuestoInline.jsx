import { useState } from 'react'

const NUEVO = '__nuevo__'

export function AgregarPuestoInline({ puestos, niveles, yaAsignados, onCrearPuesto, onAgregar }) {
  const [puestoId, setPuestoId] = useState('')
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [nivelId, setNivelId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const disponibles = puestos.filter((p) => !yaAsignados.has(p.id))

  async function handleAgregar() {
    setError('')
    if (!nivelId) {
      setError('Elegí un nivel')
      return
    }
    if (!puestoId) {
      setError('Elegí o creá un puesto/tarea')
      return
    }

    setGuardando(true)
    try {
      let idFinal = puestoId
      if (puestoId === NUEVO) {
        if (!nombreNuevo.trim()) {
          setError('Escribí el nombre del puesto/tarea nuevo')
          setGuardando(false)
          return
        }
        const creado = await onCrearPuesto(nombreNuevo.trim())
        idFinal = creado.id
      }
      await onAgregar(idFinal, nivelId)
      setPuestoId('')
      setNombreNuevo('')
      setNivelId('')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="pv-agregar">
      <select value={puestoId} onChange={(e) => setPuestoId(e.target.value)}>
        <option value="" disabled>
          Puesto / tarea…
        </option>
        {disponibles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
        <option value={NUEVO}>+ Crear nuevo…</option>
      </select>

      {puestoId === NUEVO && (
        <input
          type="text"
          placeholder="Nombre del puesto/tarea"
          value={nombreNuevo}
          onChange={(e) => setNombreNuevo(e.target.value)}
        />
      )}

      <select value={nivelId} onChange={(e) => setNivelId(e.target.value)}>
        <option value="" disabled>
          Nivel…
        </option>
        {niveles.map((n) => (
          <option key={n.id} value={n.id}>
            {n.nombre}
          </option>
        ))}
      </select>

      <button className="btn btn-primary" onClick={handleAgregar} disabled={guardando}>
        {guardando ? 'Agregando…' : 'Agregar'}
      </button>

      {error && <div className="pv-agregar-error">{error}</div>}
    </div>
  )
}

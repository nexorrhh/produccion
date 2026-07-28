import { useState } from 'react'

const NUEVO = '__nuevo__'

// `puestos`: lista combinada de puestos reales (empleados) + catálogo de
// Polivalencia, sin repetir — { nombre, id }. `id` es null cuando ese
// puesto todavía no se usó nunca en Polivalencia (se da de alta recién al
// asignarlo por primera vez).
export function AgregarPuestoInline({ puestos, niveles, yaAsignados, onCrearPuesto, onAgregar }) {
  const [puestoNombre, setPuestoNombre] = useState('')
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [nivelId, setNivelId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const disponibles = puestos.filter((p) => !(p.id && yaAsignados.has(p.id)))

  async function handleAgregar() {
    setError('')
    if (!nivelId) {
      setError('Elegí un nivel')
      return
    }
    if (!puestoNombre) {
      setError('Elegí un puesto/tarea')
      return
    }

    setGuardando(true)
    try {
      let idFinal
      if (puestoNombre === NUEVO) {
        if (!nombreNuevo.trim()) {
          setError('Escribí el nombre del puesto/tarea nuevo')
          setGuardando(false)
          return
        }
        idFinal = (await onCrearPuesto(nombreNuevo.trim())).id
      } else {
        const elegido = disponibles.find((p) => p.nombre === puestoNombre)
        idFinal = elegido.id || (await onCrearPuesto(elegido.nombre)).id
      }
      await onAgregar(idFinal, nivelId)
      setPuestoNombre('')
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
      <select value={puestoNombre} onChange={(e) => setPuestoNombre(e.target.value)}>
        <option value="" disabled>
          Puesto / tarea…
        </option>
        {disponibles.map((p) => (
          <option key={p.nombre} value={p.nombre}>
            {p.nombre}
          </option>
        ))}
        <option value={NUEVO}>+ Otra tarea (no es un puesto formal)…</option>
      </select>

      {puestoNombre === NUEVO && (
        <input
          type="text"
          placeholder="Nombre de la tarea"
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

import { useMemo, useState } from 'react'
import { AlertasBar } from './components/AlertasBar'
import { PersonasTable } from './components/PersonasTable'
import { MatrizPersonaPanel } from './components/MatrizPersonaPanel'
import { Toast } from '../../app/components/Toast'
import { usePersonalActivo } from './hooks/usePersonalActivo'
import { useCatalogosPolivalencia } from './hooks/useCatalogosPolivalencia'
import { usePolivalencia } from './hooks/usePolivalencia'
import { calcularEstado } from './lib/vigencia'
import './polivalencia.css'

function key(legajo, empresa) {
  return legajo + '|' + empresa
}

export function PolivalenciaPage() {
  const { personal, cargando: cargandoPersonal, error: errorPersonal } = usePersonalActivo()
  const { niveles, puestos, crearPuesto } = useCatalogosPolivalencia()
  const {
    personaPorLegajo,
    detallePorPersonaId,
    agregarPuesto,
    cambiarNivel,
    quitarPuesto,
    confirmarVigencia,
    error: errorPolivalencia,
  } = usePolivalencia()

  const [seleccionKey, setSeleccionKey] = useState(null)
  const [toast, setToast] = useState(null)

  function mostrarToast(msg, tipo = '') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  const puestoNombrePorId = useMemo(() => new Map(puestos.map((p) => [p.id, p.nombre])), [puestos])

  const filas = useMemo(() => {
    return personal.map((empleado) => {
      const persona = personaPorLegajo.get(key(empleado.legajo, empleado.empresa))
      const detalle = persona ? detallePorPersonaId.get(persona.id) || [] : []
      return {
        empleado,
        persona,
        estado: calcularEstado(empleado, persona),
        cantidadAsignados: detalle.length,
      }
    })
  }, [personal, personaPorLegajo, detallePorPersonaId])

  const vencidas = filas.filter((f) => f.estado.alerta).length
  const pendientesNuevas = filas.filter((f) => f.estado.estado === 'nueva_pendiente').length

  const filaSeleccionada = seleccionKey ? filas.find((f) => key(f.empleado.legajo, f.empleado.empresa) === seleccionKey) : null

  const filasDetalleSeleccionada = useMemo(() => {
    if (!filaSeleccionada?.persona) return []
    const detalle = detallePorPersonaId.get(filaSeleccionada.persona.id) || []
    return detalle.map((d) => ({ ...d, puestoNombre: puestoNombrePorId.get(d.puesto_id) || '—' }))
  }, [filaSeleccionada, detallePorPersonaId, puestoNombrePorId])

  async function handleCrearPuesto(nombre) {
    try {
      return await crearPuesto(nombre)
    } catch (err) {
      mostrarToast('No se pudo crear el puesto/tarea: ' + err.message, 'error')
      throw err
    }
  }

  async function handleAgregarPuesto(puestoId, nivelId) {
    try {
      await agregarPuesto(filaSeleccionada.empleado.legajo, filaSeleccionada.empleado.empresa, puestoId, nivelId)
      mostrarToast('Puesto/tarea asignado', 'ok')
    } catch (err) {
      mostrarToast('No se pudo asignar: ' + err.message, 'error')
    }
  }

  async function handleCambiarNivel(detalleId, nivelId) {
    try {
      await cambiarNivel(detalleId, nivelId)
    } catch (err) {
      mostrarToast('No se pudo cambiar el nivel: ' + err.message, 'error')
    }
  }

  async function handleQuitarPuesto(detalleId) {
    try {
      await quitarPuesto(detalleId)
      mostrarToast('Puesto/tarea quitado', 'ok')
    } catch (err) {
      mostrarToast('No se pudo quitar: ' + err.message, 'error')
    }
  }

  async function handleConfirmarVigencia() {
    try {
      await confirmarVigencia(filaSeleccionada.empleado.legajo, filaSeleccionada.empleado.empresa)
      mostrarToast('Vigencia confirmada', 'ok')
    } catch (err) {
      mostrarToast('No se pudo confirmar: ' + err.message, 'error')
    }
  }

  return (
    <div className="wrap">
      {(errorPersonal || errorPolivalencia) && (
        <div className="pv-error-banner">{errorPersonal || errorPolivalencia}</div>
      )}

      <AlertasBar vencidas={vencidas} pendientesNuevas={pendientesNuevas} />

      {cargandoPersonal ? (
        <div className="pv-vacio">Cargando personal activo…</div>
      ) : (
        <PersonasTable filas={filas} onAbrir={(f) => setSeleccionKey(key(f.empleado.legajo, f.empleado.empresa))} />
      )}

      {filaSeleccionada && (
        <MatrizPersonaPanel
          fila={filaSeleccionada}
          filasDetalle={filasDetalleSeleccionada}
          puestos={puestos}
          niveles={niveles}
          onCerrar={() => setSeleccionKey(null)}
          onCrearPuesto={handleCrearPuesto}
          onAgregarPuesto={handleAgregarPuesto}
          onCambiarNivel={handleCambiarNivel}
          onQuitarPuesto={handleQuitarPuesto}
          onConfirmarVigencia={handleConfirmarVigencia}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}

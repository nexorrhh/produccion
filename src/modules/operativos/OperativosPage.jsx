import { useMemo, useState } from 'react'
import { SetupBar, diaDeFecha, tipoSugerido } from './components/SetupBar'
import { Toolbar } from './components/Toolbar'
import { OperativosTable } from './components/OperativosTable'
import { ActionBar } from './components/ActionBar'
import { NotificacionesModal } from './components/NotificacionesModal'
import { Toast } from '../../app/components/Toast'
import { AnalisisOperativos } from './analisis/AnalisisOperativos'
import { ValidacionOperativos } from './validacion/ValidacionOperativos'
import { useOperativosData } from './hooks/useOperativosData'
import { useCitacionDeFecha } from './hooks/useCitacionDeFecha'
import { useAuth } from '../../app/auth/useAuth'
import { key, tipoPago } from './lib/clasificacion'
import { generarPdfListadoConvocados } from './lib/pdfListadoConvocados'
import { puedeValidar, esVistaAdmin } from './lib/permisos'
import { supabase } from '../../app/supabaseClient'
import './operativos.css'

function proximoSabado() {
  const hoy = new Date()
  const diasHastaSabado = (6 - hoy.getDay() + 7) % 7 || 7
  const prox = new Date(hoy)
  prox.setDate(hoy.getDate() + diasHastaSabado)
  return prox.toISOString().split('T')[0]
}

export function OperativosPage() {
  const { user } = useAuth()
  const { empleados, cumplimiento, mapaClasif, status, statusText } = useOperativosData()

  const [fecha, setFecha] = useState(proximoSabado)
  const [filtros, setFiltros] = useState({ search: '', empresa: '', puesto: '', tipopago: '' })
  const [vista, setVista] = useState('todos')
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)
  const [vistaPrincipal, setVistaPrincipal] = useState('citar')
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false)

  const {
    seleccion,
    citacionId,
    estadoTexto,
    validacion,
    guardar,
    aprobar,
    rechazar,
    moverFecha,
    copiarUltima,
    limpiar,
    toggleCitar,
    setTurno,
    setCampo,
  } = useCitacionDeFecha(fecha, empleados)

  const dia = diaDeFecha(fecha)
  const tipo = tipoSugerido(fecha)
  const vistaAdmin = esVistaAdmin(user)
  // Los supervisores de planta solo tienen Citar — si por algún resto de
  // estado quedaran en otra pestaña, esto los vuelve a Citar sin drama.
  const vistaEfectiva = vistaAdmin ? vistaPrincipal : 'citar'

  function mostrarToast(msg, tipoToast = '') {
    setToast({ msg, tipo: tipoToast })
    setTimeout(() => setToast(null), 3000)
  }

  // Un solo campo de fecha, sin botón aparte: si ya hay una citación
  // guardada bajo la fecha actual (citacionId), cambiarla acá corrige ESA
  // MISMA citación (moverFecha) en vez de crear una nueva y dejar la
  // vieja huérfana. Si todavía no hay nada guardado, es simplemente
  // navegar a ver/crear la citación de otra fecha — ahí sí se avisa antes
  // de perder algo marcado sin guardar.
  async function handleFechaChange(v) {
    if (citacionId) {
      // Bloqueo directo, sin alternativa: no se puede mover la citación
      // cargada a una fecha que ya tiene la suya propia (autorizada o no).
      // Para ver/editar otra citación existente hay que hacerlo desde
      // Validación (o limpiar/guardar la actual primero).
      try {
        await moverFecha(v)
        setFecha(v)
      } catch (err) {
        mostrarToast('No se pudo cambiar la fecha: ' + err.message, 'error')
      }
      return
    }
    if (Object.keys(seleccion).length > 0) {
      const ok = confirm('Vas a cambiar de fecha y se va a perder lo que marcaste sin guardar. ¿Continuar?')
      if (!ok) return
    }
    setFecha(v)
  }

  const puestos = useMemo(
    () => [...new Set(empleados.map((e) => e.desc_puesto).filter(Boolean))].sort(),
    [empleados]
  )

  const counters = useMemo(() => {
    const sels = Object.values(seleccion)
    const keys = Object.keys(seleccion)
    let q = 0,
      m = 0,
      s = 0
    keys.forEach((k) => {
      const e = empleados.find((x) => key(x) === k)
      if (!e) return
      const t = tipoPago(e, mapaClasif)
      if (t === 'mensual') m++
      else if (t === 'quincenal') q++
      else s++
    })
    return {
      citados: sels.length,
      quincenal: q,
      mensual: m,
      sinClasificar: s,
      manana: sels.filter((x) => x.manana).length,
      tarde: sels.filter((x) => x.tarde).length,
    }
  }, [seleccion, empleados, mapaClasif])

  // Guardar deja la citación en "pendiente_validacion" — el mail oficial
  // recién se dispara cuando Javier/Valentín la aprueba (handleAprobar).
  async function handleGuardar() {
    setGuardando(true)
    try {
      const { detalle } = await guardar(tipo, dia, user)
      mostrarToast('Citación guardada: ' + detalle.length + ' personas — pendiente de validación', 'ok')
    } catch (err) {
      mostrarToast('Error: ' + err.message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  async function handleAprobar() {
    setGuardando(true)
    try {
      const sels = Object.keys(seleccion)
      const detalle = sels.map((k) => {
        const e = empleados.find((x) => key(x) === k)
        const s = seleccion[k]
        return {
          legajo: e.legajo,
          empresa: e.empresa,
          apellido_y_nombre: e.apellido_y_nombre,
          desc_puesto: e.desc_puesto,
          turno_manana: !!s.manana,
          turno_tarde: !!s.tarde,
          ot: s.ot || null,
          trabajo: s.trabajo || null,
        }
      })
      const pdfBase64 = generarPdfListadoConvocados({ fecha, dia, tipo, detalle, mapaClasif })
      const { data, error } = await supabase.functions.invoke('enviar-listado-convocados', {
        body: {
          fecha,
          tipo,
          diaSemana: dia,
          cantidad: detalle.length,
          pdfBase64,
          aprobadoPor: user.nombre_apellido,
        },
      })
      if (error) {
        // supabase-js solo da un mensaje genérico ("Edge Function returned
        // a non-2xx status code") — el detalle real está en el cuerpo de
        // la respuesta, que queda en error.context.
        let detalle = error.message
        try {
          const body = await error.context.json()
          if (body?.error) detalle = body.error
        } catch {
          // si el cuerpo no es JSON, nos quedamos con error.message
        }
        throw new Error(detalle)
      }
      await aprobar(user)
      mostrarToast('Listado aprobado y enviado a ' + (data?.enviados ?? 0) + ' destinatario(s)', 'ok')
    } catch (err) {
      mostrarToast('No se pudo enviar el mail, la citación sigue pendiente: ' + err.message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  async function handleRechazar() {
    const comentario = window.prompt('¿Por qué se rechaza esta citación? (se lo va a ver quien la cargó)')
    if (comentario === null) return
    if (!comentario.trim()) {
      mostrarToast('El comentario de rechazo no puede estar vacío', 'error')
      return
    }
    try {
      await rechazar(user.id, comentario.trim())
      mostrarToast('Citación rechazada', 'ok')
    } catch (err) {
      mostrarToast('Error: ' + err.message, 'error')
    }
  }

  function handleAbrirValidacion(fechaElegida) {
    setFecha(fechaElegida)
    setVistaPrincipal('citar')
  }

  function handleLimpiar() {
    if (!Object.keys(seleccion).length) {
      mostrarToast('El listado ya está vacío')
      return
    }
    if (!confirm('¿Quitar a todas las personas del listado? Se perderán los cambios no guardados.')) return
    limpiar()
    mostrarToast('Listado limpiado')
  }

  async function handleCopiarUltima() {
    try {
      const haySeleccion = Object.keys(seleccion).length > 0
      const previa = confirm(
        '¿Cargar la citación anterior guardada?' + (haySeleccion ? '\n⚠ Se reemplazará la selección actual.' : '')
      )
      if (!previa) return
      const { anterior, cargados, omitidos } = await copiarUltima(fecha)
      let msg = `${cargados} personas cargadas desde ${anterior.fecha}`
      if (omitidos) msg += ` · ${omitidos} ya no están activos`
      mostrarToast(msg, 'ok')
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
  }

  return (
    <div className="wrap">
      {vistaAdmin && (
        <div className="op-tabs">
          <button className={vistaEfectiva === 'citar' ? 'active' : ''} onClick={() => setVistaPrincipal('citar')}>
            Citar
          </button>
          <button className={vistaEfectiva === 'analisis' ? 'active' : ''} onClick={() => setVistaPrincipal('analisis')}>
            Análisis
          </button>
          <button className={vistaEfectiva === 'validacion' ? 'active' : ''} onClick={() => setVistaPrincipal('validacion')}>
            Validación
          </button>
          <div className="op-tabs-spacer">
            <button className="btn btn-ghost" onClick={() => setMostrarNotificaciones(true)}>
              Destinatarios del listado
            </button>
          </div>
        </div>
      )}

      {mostrarNotificaciones && <NotificacionesModal onCerrar={() => setMostrarNotificaciones(false)} />}

      {vistaEfectiva === 'analisis' ? (
        <AnalisisOperativos />
      ) : vistaEfectiva === 'validacion' ? (
        <ValidacionOperativos onAbrir={handleAbrirValidacion} />
      ) : (
        <>
          <div className="op-status-line">
            <span className={'op-status-dot ' + status} />
            {statusText}
          </div>

          {validacion.estado && (
            <div
              className={
                'op-estado-banner ' +
                (validacion.estado === 'validada'
                  ? 'validada'
                  : validacion.estado === 'rechazada'
                    ? 'rechazada'
                    : 'pendiente')
              }
            >
              {validacion.estado === 'validada' && '✓ Validada y enviada'}
              {validacion.estado === 'pendiente_validacion' && '⏳ Pendiente de validación'}
              {validacion.estado === 'rechazada' &&
                '✕ Rechazada' + (validacion.comentarioRechazo ? ': ' + validacion.comentarioRechazo : '')}
            </div>
          )}

          <SetupBar fecha={fecha} onFechaChange={handleFechaChange} tipo={tipo} dia={dia} counters={counters} />

          <Toolbar filtros={filtros} onFiltrosChange={setFiltros} puestos={puestos} vista={vista} onVistaChange={setVista} />

          <OperativosTable
            empleados={empleados}
            mapaClasif={mapaClasif}
            cumplimiento={cumplimiento}
            seleccion={seleccion}
            filtros={filtros}
            vista={vista}
            onToggleCitar={toggleCitar}
            onSetTurno={setTurno}
            onSetCampo={setCampo}
          />

          <ActionBar
            estadoTexto={estadoTexto}
            citadosCount={Object.keys(seleccion).length}
            onLimpiar={handleLimpiar}
            onCopiarUltima={handleCopiarUltima}
            onGuardar={handleGuardar}
            guardando={guardando}
            puedeValidar={puedeValidar(user)}
            estadoValidacion={validacion.estado}
            citacionId={citacionId}
            onAprobar={handleAprobar}
            onRechazar={handleRechazar}
          />

          <Toast toast={toast} />
        </>
      )}
    </div>
  )
}

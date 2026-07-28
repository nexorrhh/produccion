import { useMemo, useState } from 'react'
import { SetupBar, diaDeFecha, tipoSugerido } from './components/SetupBar'
import { Toolbar } from './components/Toolbar'
import { DiagPanel } from './components/DiagPanel'
import { OperativosTable } from './components/OperativosTable'
import { ActionBar } from './components/ActionBar'
import { Toast } from './components/Toast'
import { useOperativosData } from './hooks/useOperativosData'
import { useCitacionDeFecha } from './hooks/useCitacionDeFecha'
import { key, tipoPago } from './lib/clasificacion'
import { exportarCSV } from './lib/csvExport'
import './operativos.css'

function proximoSabado() {
  const hoy = new Date()
  const diasHastaSabado = (6 - hoy.getDay() + 7) % 7 || 7
  const prox = new Date(hoy)
  prox.setDate(hoy.getDate() + diasHastaSabado)
  return prox.toISOString().split('T')[0]
}

export function OperativosPage() {
  const { empleados, cumplimiento, mapaClasif, status, statusText } = useOperativosData()

  const [fecha, setFecha] = useState(proximoSabado)
  const [tipo, setTipo] = useState(() => tipoSugerido(proximoSabado()))
  const [filtros, setFiltros] = useState({ search: '', empresa: '', puesto: '', tipopago: '' })
  const [vista, setVista] = useState('todos')
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

  const {
    seleccion,
    estadoTexto,
    guardar,
    copiarUltima,
    limpiar,
    toggleCitar,
    setTurno,
    setCampo,
  } = useCitacionDeFecha(fecha, empleados)

  const dia = diaDeFecha(fecha)

  function mostrarToast(msg, tipoToast = '') {
    setToast({ msg, tipo: tipoToast })
    setTimeout(() => setToast(null), 3000)
  }

  function handleFechaChange(v) {
    setFecha(v)
    setTipo(tipoSugerido(v))
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

  async function handleGuardar() {
    setGuardando(true)
    try {
      const n = await guardar(tipo, dia)
      mostrarToast('Citación guardada: ' + n + ' personas', 'ok')
    } catch (err) {
      mostrarToast('Error: ' + err.message, 'error')
    } finally {
      setGuardando(false)
    }
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

  function handleExportarCSV() {
    try {
      exportarCSV(seleccion, empleados, mapaClasif, fecha, dia)
      mostrarToast('CSV descargado', 'ok')
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
  }

  return (
    <div className="wrap">
      <div className="op-status-line">
        <span className={'op-status-dot ' + status} />
        {statusText}
      </div>

      <SetupBar
        fecha={fecha}
        onFechaChange={handleFechaChange}
        tipo={tipo}
        onTipoChange={setTipo}
        dia={dia}
        counters={counters}
      />

      <Toolbar filtros={filtros} onFiltrosChange={setFiltros} puestos={puestos} vista={vista} onVistaChange={setVista} />

      <DiagPanel empleados={empleados} mapaClasif={mapaClasif} />

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
        onExportarCSV={handleExportarCSV}
        onGuardar={handleGuardar}
        guardando={guardando}
      />

      <Toast toast={toast} />
    </div>
  )
}

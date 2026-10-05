import { categoriaAusencia } from '../hooks/useClasificacionAusencias'

// Todos los días del período (1 al último día del mes, recortado a hoy si
// es el mes en curso) — así un día sin ninguna fila en rrhh_horas_detalle
// se puede distinguir entre "libre" (tampoco hay nada en Capataz) y
// "falta cargar en Tango" (Capataz sí tiene horas ese día).
function diasDelPeriodo(periodo) {
  const [anio, mes] = periodo.split('-').map(Number)
  const ultimoDia = new Date(anio, mes, 0).getDate()
  const hoy = new Date()
  const esMesActual = hoy.getFullYear() === anio && hoy.getMonth() + 1 === mes
  const limite = esMesActual ? hoy.getDate() : ultimoDia
  const dias = []
  for (let d = 1; d <= limite; d++) {
    dias.push(`${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return dias
}

function diaSemanaCorto(fechaISO) {
  const d = new Date(fechaISO + 'T00:00:00')
  return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()]
}

function esSabadoODomingo(fechaISO) {
  const dia = new Date(fechaISO + 'T00:00:00').getDay()
  return dia === 0 || dia === 6
}

// Agrupa las filas de rrhh_horas_detalle de UNA persona+período, una por
// día, y arma el detalle completo: estado, balance (según si es mensual o
// quincenal — mismo criterio que presentismo-personas.js de Tablero_RRHH),
// horas por OT ese día (cruzando horas_ot_detalle, con el desglose por OT
// en `otDesglose` para el tooltip de la barra) y motivo de ausencia
// (cruzando rrhh_tardanzas_salidas + la categorización de
// rrhh_justificacion_config) cuando el día es una falta.
export function construirDetalleDiario({
  periodo,
  legajo,
  horasDetalle,
  horasOt = [],
  tardanzas = [],
  esMensual,
  mapaCategoriaAusencia,
}) {
  const porDia = new Map()
  diasDelPeriodo(periodo).forEach((fecha) => {
    porDia.set(fecha, {
      fecha,
      hs_esperadas: 0,
      hs_reales: 0,
      hs_trabajadas: 0,
      hs_justificadas: 0,
      hs_no_justificadas: 0,
      extra50: 0,
      extra100: 0,
      esVacacion: false,
      esViaje: false,
      tieneDetalle: false,
      horasOt: 0,
    })
  })

  horasDetalle.forEach((f) => {
    const d = porDia.get(f.fecha)
    if (!d) return // fuera del rango de días que se está mostrando (p. ej. mes siguiente)
    d.tieneDetalle = true
    d.hs_esperadas += Number(f.hs_esperadas || 0)
    d.hs_reales += Number(f.hs_reales || 0)
    d.hs_trabajadas += Number(f.hs_trabajadas || 0)
    d.hs_justificadas += Number(f.hs_justificadas || 0)
    d.hs_no_justificadas += Number(f.hs_no_justificadas || 0)
    const desc = (f.descripcion_tipo_hora || f.tipo_hora || '').toLowerCase()
    if (desc.includes('vacac')) d.esVacacion = true
    if (desc.includes('viaje')) d.esViaje = true
    const horasFila = Number(f.hs_trabajadas || f.hs_reales || 0)
    if (desc.includes('100')) d.extra100 += horasFila
    else if (desc.includes('50') || desc.includes('ext')) d.extra50 += horasFila
  })

  horasOt
    .filter((f) => f.legajo === legajo && !f.anomalo)
    .forEach((f) => {
      const d = porDia.get(f.fecha)
      if (!d) return
      d.horasOt += Number(f.horas || 0)
      if (!d._otMap) d._otMap = new Map()
      const clave = f.ot || '__sin_ot__'
      if (!d._otMap.has(clave)) {
        d._otMap.set(clave, { ot: f.ot, cliente: f.cliente, proyecto: f.proyecto_nombre, horas: 0 })
      }
      d._otMap.get(clave).horas += Number(f.horas || 0)
    })

  const tardanzaPorFecha = new Map()
  tardanzas
    .filter((t) => t.legajo === legajo)
    .forEach((t) => {
      // Si hay varias filas el mismo día (p.ej. tarde Y temprano), se
      // prioriza 'ausente' para resolver la categoría de motivo.
      const actual = tardanzaPorFecha.get(t.fecha)
      if (!actual || t.tipo === 'ausente') tardanzaPorFecha.set(t.fecha, t)
    })

  return [...porDia.values()]
    .map((d) => {
      const tardanza = tardanzaPorFecha.get(d.fecha)
      const normalTrabajadas = d.hs_trabajadas - d.extra50 - d.extra100
      const balance = esMensual ? d.hs_reales - d.hs_esperadas : normalTrabajadas - d.hs_esperadas
      const estado = estadoDeDia(d, tardanza, mapaCategoriaAusencia)
      const otDesglose = d._otMap ? [...d._otMap.values()].sort((a, b) => b.horas - a.horas) : []
      return {
        ...d,
        _otMap: undefined,
        otDesglose,
        balance,
        normalTrabajadas,
        estado,
        diaSemana: diaSemanaCorto(d.fecha),
        finDeSemana: esSabadoODomingo(d.fecha),
        motivoAusencia: tardanza?.codigo_justificacion
          ? tardanza.descripcion_justificacion || tardanza.codigo_justificacion
          : null,
      }
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

function estadoDeDia(d, tardanza, mapaCategoriaAusencia) {
  if (d.esVacacion) return d.hs_reales > 0 ? 'vactrab' : 'vacaciones'
  if (d.esViaje) return 'viaje'

  if (!d.tieneDetalle) {
    // Sin ninguna fila de Tango ese día: si Capataz sí tiene horas
    // cargadas, es un día a revisar (falta cargar en Tango); si tampoco
    // hay nada en Capataz, se asume día no laborable.
    return d.horasOt > 0 ? 'sin_tango' : 'libre'
  }

  if (d.hs_esperadas === 0) {
    // Sin jornada esperada ese día (p. ej. un sábado) pero con horas
    // reales cargadas en Tango: no es un día libre, es presencia extra
    // (un operativo de sábado, por ejemplo) — antes esto se perdía.
    return d.hs_reales > 0 ? 'extra' : 'libre'
  }
  if (d.hs_reales > d.hs_esperadas) return 'extra'
  if (d.hs_reales >= d.hs_esperadas) return 'ok'

  if (d.hs_reales === 0) {
    if (tardanza?.codigo_justificacion && mapaCategoriaAusencia) {
      return 'ausencia_' + categoriaAusencia(tardanza.codigo_justificacion, mapaCategoriaAusencia)
    }
    return d.hs_justificadas > 0 ? 'justif' : 'falta'
  }
  return 'parcial'
}

export const ESTADO_DIA_INFO = {
  ok: { label: 'Presente', letra: '✓', color: 'var(--green)' },
  extra: { label: 'Con extras', letra: '+', color: '#7c3aed' },
  parcial: { label: 'Fuera de horario', letra: '~', color: 'var(--amber)' },
  justif: { label: 'Falta justificada', letra: 'J', color: 'var(--com)' },
  falta: { label: 'Falta sin justificar', letra: '?', color: 'var(--red)' },
  libre: { label: 'Día no laborable', letra: '·', color: 'var(--text3)' },
  sin_tango: { label: 'Falta cargar en Tango', letra: '!', color: 'var(--red)' },
  vacaciones: { label: 'Vacaciones', letra: 'V', color: 'var(--com)' },
  vactrab: { label: 'Vacaciones trabajadas', letra: 'VT', color: 'var(--com)' },
  viaje: { label: 'Viaje laboral', letra: 'Vj', color: 'var(--com)' },
  ausencia_enfermedad: { label: 'Enfermedad', letra: 'E', color: '#d97706' },
  ausencia_accidente: { label: 'Accidente', letra: 'Ac', color: '#dc2626' },
  ausencia_licencia: { label: 'Licencia', letra: 'Li', color: '#0891b2' },
  ausencia_aviso: { label: 'Aviso', letra: 'Av', color: '#2563eb' },
  ausencia_sin_aviso: { label: 'Sin aviso', letra: 'SA', color: '#991b1b' },
  ausencia_sin_clasificar: { label: 'Sin clasificar', letra: '?', color: 'var(--text3)' },
}

export function fmtHorasMin(v) {
  const horas = Number(v) || 0
  const signo = horas < 0 ? '-' : ''
  const abs = Math.abs(horas)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  if (h === 0 && m === 0) return '0h'
  if (m === 0) return `${signo}${h}h`
  return `${signo}${h}h ${m}min`
}

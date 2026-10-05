// Agrupa las filas de rrhh_horas_detalle (una por tipo_hora) de UNA
// persona en un único registro por día, y deriva un estado simplificado
// para el calendario de detalle (Por persona / Ficha). No reproduce la
// distinción exacta de VACACION/VIAJE de Tango por código — se infiere por
// texto en descripcion_tipo_hora, que es lo único que tenemos confirmado.
export function agruparDetallePorDia(filasDetalle) {
  const porDia = new Map()
  filasDetalle.forEach((f) => {
    if (!porDia.has(f.fecha)) {
      porDia.set(f.fecha, {
        fecha: f.fecha,
        hs_esperadas: 0,
        hs_reales: 0,
        hs_trabajadas: 0,
        hs_justificadas: 0,
        hs_no_justificadas: 0,
        esVacacion: false,
        esViaje: false,
      })
    }
    const d = porDia.get(f.fecha)
    d.hs_esperadas += Number(f.hs_esperadas || 0)
    d.hs_reales += Number(f.hs_reales || 0)
    d.hs_trabajadas += Number(f.hs_trabajadas || 0)
    d.hs_justificadas += Number(f.hs_justificadas || 0)
    d.hs_no_justificadas += Number(f.hs_no_justificadas || 0)
    const desc = (f.descripcion_tipo_hora || f.tipo_hora || '').toLowerCase()
    if (desc.includes('vacac')) d.esVacacion = true
    if (desc.includes('viaje')) d.esViaje = true
  })

  return [...porDia.values()].map((d) => ({ ...d, estado: estadoDeDia(d) })).sort((a, b) => a.fecha.localeCompare(b.fecha))
}

function estadoDeDia(d) {
  if (d.esVacacion) return 'vacaciones'
  if (d.esViaje) return 'viaje'
  if (d.hs_esperadas === 0) return 'libre'
  if (d.hs_reales > d.hs_esperadas) return 'extra'
  if (d.hs_reales >= d.hs_esperadas) return 'ok'
  if (d.hs_reales === 0 && d.hs_justificadas > 0) return 'justif'
  if (d.hs_reales === 0) return 'falta'
  return 'parcial'
}

export const ESTADO_DIA_INFO = {
  ok: { label: 'Presente', letra: '✓', color: 'var(--green)' },
  extra: { label: 'Con horas extra', letra: '+', color: '#7c3aed' },
  parcial: { label: 'Jornada parcial', letra: '~', color: 'var(--amber)' },
  justif: { label: 'Ausencia justificada', letra: 'J', color: 'var(--com)' },
  falta: { label: 'Falta sin justificar', letra: '✕', color: 'var(--red)' },
  libre: { label: 'Día no laborable', letra: '·', color: 'var(--text3)' },
  vacaciones: { label: 'Vacaciones', letra: 'V', color: 'var(--com)' },
  viaje: { label: 'Viaje laboral', letra: 'Vj', color: 'var(--com)' },
}

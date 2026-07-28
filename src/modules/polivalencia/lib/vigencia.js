// Reglas de vigencia de la sección 5.3 de CLAUDE.md — se calculan en el
// cliente, no hay cron: cada vez que se abre el módulo se recalcula contra
// la fecha de hoy.
export const DIAS_VIGENCIA = 180 // confirmar/actualizar cada 6 meses
export const DIAS_PLAZO_NUEVO = 30 // plazo para definir polivalencia de alguien nuevo

function diasDesde(fechaIso) {
  if (!fechaIso) return Infinity
  return (Date.now() - new Date(fechaIso).getTime()) / 86400000
}

// empleado: { fecha_ingreso }. personaPolivalencia: fila de
// produccion_polivalencia_persona para ese legajo+empresa, o null si
// todavía no tiene ninguna.
export function calcularEstado(empleado, personaPolivalencia) {
  if (!personaPolivalencia) {
    if (diasDesde(empleado.fecha_ingreso) <= DIAS_PLAZO_NUEVO) {
      return { estado: 'nueva_pendiente', label: 'Nueva — pendiente', alerta: false }
    }
    return { estado: 'vencida_nunca', label: 'Vencida — nunca definida', alerta: true }
  }

  const ultima = personaPolivalencia.fecha_confirmacion || personaPolivalencia.fecha_definicion
  if (diasDesde(ultima) > DIAS_VIGENCIA) {
    return { estado: 'vencida_confirmar', label: 'Vencida — confirmar', alerta: true }
  }

  const proximoVencimiento = new Date(new Date(ultima).getTime() + DIAS_VIGENCIA * 86400000)
  return { estado: 'vigente', label: 'Vigente', alerta: false, proximoVencimiento }
}

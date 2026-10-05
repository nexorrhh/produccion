export function parseFechaISO(s) {
  if (!s) return null
  const [anio, mes, dia] = s.split('-').map(Number)
  if (!anio || !mes || !dia) return null
  return { anio, mes, dia }
}

// Años y meses completos desde fecha_ingreso hasta hoy.
export function calcAntiguedad(fechaIngreso, hoy = new Date()) {
  const f = parseFechaISO(fechaIngreso)
  if (!f) return null
  let anios = hoy.getFullYear() - f.anio
  let meses = hoy.getMonth() + 1 - f.mes
  if (meses < 0) {
    anios--
    meses += 12
  }
  if (hoy.getDate() < f.dia) {
    meses--
    if (meses < 0) {
      anios--
      meses += 12
    }
  }
  if (anios < 0) return { anios: 0, meses: 0 }
  return { anios, meses }
}

export function rangoAntiguedad(anios) {
  if (anios >= 10) return 'alta'
  if (anios >= 5) return 'media'
  return 'baja'
}

// "Edad que cumple este año" (no edad exacta ajustada por si ya pasó el
// cumpleaños) — mismo criterio que usa Tablero_RRHH para esta sección.
export function edadQueCumple(fechaNacimiento, hoy = new Date()) {
  const f = parseFechaISO(fechaNacimiento)
  if (!f) return null
  return hoy.getFullYear() - f.anio
}

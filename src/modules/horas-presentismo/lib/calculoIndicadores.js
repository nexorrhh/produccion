// Mismas fórmulas que presentismo-indicadores.js de Tablero_RRHH
// (calcularGrupo), confirmadas en la exploración del código original.

// % días: no es días_presentes / días_laborables — días_laborables
// incluye vacaciones/feriado, que no deben penalizar el presentismo.
export function pctPresentismo(fila) {
  const base = (fila.dias_presentes || 0) + (fila.dias_ausentes_nojust || 0)
  return base > 0 ? (fila.dias_presentes / base) * 100 : null
}

export function pctCumplimientoHoras(fila) {
  return fila.hs_esperadas > 0 ? (fila.hs_normales / fila.hs_esperadas) * 100 : null
}

export function pctAusentismo(fila) {
  const base = (fila.hs_normales || 0) + (fila.hs_ausencias || 0)
  return base > 0 ? (fila.hs_ausencias / base) * 100 : 0
}

export function colorAusentismo(pct) {
  if (pct < 5) return 'var(--green)'
  if (pct < 8) return 'var(--amber)'
  return 'var(--red)'
}

// Índice de puntualidad: 1 - (días con al menos un incidente de
// tardanza/salida anticipada) / días presentes. `diasConIncidente` ya
// viene deduplicado por día (un día con ambos eventos cuenta una vez).
export function pctPuntualidad(diasPresentes, diasConIncidente) {
  return diasPresentes > 0 ? ((diasPresentes - diasConIncidente) / diasPresentes) * 100 : null
}

// Suma los totales de un conjunto de filas de rrhh_horas_mensual (ya
// filtradas por período/grupo) — es lo que alimenta los KPIs agregados de
// Indicadores y de Ficha en modo Grupo/Sector.
export function sumarFilasMensual(filas) {
  const acc = {
    hs_esperadas: 0,
    hs_normales: 0,
    hs_extra50: 0,
    hs_extra100: 0,
    hs_ausencias: 0,
    hs_no_justificadas: 0,
    dias_presentes: 0,
    dias_ausentes_nojust: 0,
    dias_laborables: 0,
  }
  filas.forEach((f) => {
    acc.hs_esperadas += Number(f.hs_esperadas || 0)
    acc.hs_normales += Number(f.hs_normales || 0)
    acc.hs_extra50 += Number(f.hs_extra50 || 0)
    acc.hs_extra100 += Number(f.hs_extra100 || 0)
    acc.hs_ausencias += Number(f.hs_ausencias || 0)
    acc.hs_no_justificadas += Number(f.hs_no_justificadas || 0)
    acc.dias_presentes += Number(f.dias_presentes || 0)
    acc.dias_ausentes_nojust += Number(f.dias_ausentes_nojust || 0)
    acc.dias_laborables += Number(f.dias_laborables || 0)
  })
  return acc
}

// Indicadores agregados completos (KPIs) para un conjunto de filas
// mensuales + sus tardanzas/salidas del mismo período.
export function calcularIndicadores(filasMensual, filasTardanzas) {
  const tot = sumarFilasMensual(filasMensual)
  const diasConIncidentePorPersona = new Map()
  filasTardanzas
    .filter((t) => t.tipo === 'tarde' || t.tipo === 'temprano')
    .forEach((t) => {
      const clave = t.empresa + '|' + t.legajo + '|' + t.fecha
      diasConIncidentePorPersona.set(clave, true)
    })

  return {
    ...tot,
    pctPresentismo: pctPresentismo(tot),
    pctCumplimiento: pctCumplimientoHoras(tot),
    pctAusentismo: pctAusentismo(tot),
    pctPuntualidad: pctPuntualidad(tot.dias_presentes, diasConIncidentePorPersona.size),
    cantTardanzas: filasTardanzas.filter((t) => t.tipo === 'tarde').length,
    cantSalidasAnticipadas: filasTardanzas.filter((t) => t.tipo === 'temprano').length,
  }
}

export function fmtPct(v) {
  return v === null || v === undefined || Number.isNaN(v) ? '—' : Math.round(v) + '%'
}

export function fmtHoras(v) {
  return (Number(v) || 0).toFixed(1)
}

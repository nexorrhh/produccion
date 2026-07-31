// Texto explicativo para el tooltip de cumplimiento — de qué números sale
// el porcentaje, para tener más contexto a la hora de citar/analizar.

// Cumplimiento histórico de UNA persona, a lo largo de varios operativos
// (v_cumplimiento_persona: convocado/presente/ausente/no_convocado).
export function tituloCumplimientoPersona({ convocado, presente, ausente, no_convocado }) {
  const aus = ausente || 0
  const noConv = no_convocado || 0
  const pct = convocado > 0 ? Math.round((presente / convocado) * 100) : 0
  let titulo = `De ${convocado} operativo${convocado === 1 ? '' : 's'} a los que fue convocad@, vino a ${presente}`
  titulo += aus ? ` y faltó a ${aus}` : ', sin faltar ninguna vez'
  if (noConv) titulo += `. Además vino sin estar citad@ ${noConv} vez${noConv === 1 ? '' : 'es'}`
  titulo += ` (${pct}% de cumplimiento).`
  return titulo
}

// Cumplimiento de UN operativo puntual, entre toda la gente convocada ese
// día (v_resumen_fecha: convocados/presentes/ausentes/no_convocados).
export function tituloCumplimientoOperativo({ convocados, presentes, ausentes, no_convocados }) {
  const aus = ausentes || 0
  const noConv = no_convocados || 0
  const pct = convocados > 0 ? Math.round((presentes / convocados) * 100) : 0
  let titulo = `De ${convocados} persona${convocados === 1 ? '' : 's'} convocada${convocados === 1 ? '' : 's'} a este operativo, vinieron ${presentes}`
  titulo += aus ? ` y faltaron ${aus}` : ', sin faltar ninguna'
  if (noConv) {
    const verbo = noConv === 1 ? 'vino' : 'vinieron'
    titulo += `. Además ${verbo} ${noConv} persona${noConv === 1 ? '' : 's'} sin estar citada${noConv === 1 ? '' : 's'}`
  }
  titulo += ` (${pct}% de cumplimiento).`
  return titulo
}

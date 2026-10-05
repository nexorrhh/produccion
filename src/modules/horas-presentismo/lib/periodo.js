const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// periodo viene de Supabase como 'YYYY-MM'.
export function fmtPeriodo(periodo) {
  if (!periodo) return '—'
  const [anio, mes] = periodo.split('-').map(Number)
  if (!anio || !mes || !MESES[mes - 1]) return periodo
  return `${MESES[mes - 1]} ${anio}`
}

export function nombreEmpresa(empresa) {
  return empresa === 'CIMOMET' ? 'Cimomet S.A.' : 'Co.mo.ing S.R.L.'
}

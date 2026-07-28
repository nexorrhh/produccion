// Misma lógica que docs/reference/citaciones.html: la clasificación
// mensual/quincenal vive en rrhh_puestos_config (única fuente de verdad,
// editable en Plantel → Parametrización). Un puesto sin fila ahí es
// "sin_asignar".

export function tipoPago(empleado, mapaClasif) {
  const p = (empleado.desc_puesto || '').trim()
  return mapaClasif.get(p) || 'sin_asignar'
}

// Los puestos de GERENCIA se excluyen por completo (no aparecen en la
// tabla, contadores ni CSV). Se detecta por coincidencia sobre desc_puesto.
export function esGerencia(descPuesto) {
  const p = norm(descPuesto)
  return p.includes('gerencia') || p.includes('gerente')
}

const ACCENTS = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n' }

export function norm(s) {
  return (s || '')
    .toLowerCase()
    .split('')
    .map((ch) => ACCENTS[ch] || ch)
    .join('')
}

export function key(empleado) {
  return empleado.legajo + '|' + empleado.empresa
}

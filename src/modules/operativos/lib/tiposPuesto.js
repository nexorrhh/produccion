// Único lugar con el orden, las etiquetas y la clase CSS de cada grupo de
// puesto (quincenal/mensual/sin_asignar). La clasificación en sí la decide
// tipoPago() en clasificacion.js a partir de rrhh_puestos_config — la misma
// tabla que usa Tablero_RRHH (Plantel → Parametrización) para clasificar
// puestos, así que no hay una segunda fuente de verdad entre proyectos.
// Esto solo evita que el orden/las etiquetas se reescriban por pantalla.

export const TIPOS_PUESTO = [
  { key: 'quincenal', label: 'Quincenal', labelPlural: 'Quincenales', cssClass: 'quincenal' },
  { key: 'mensual', label: 'Mensual', labelPlural: 'Mensuales', cssClass: 'mensual' },
  { key: 'sin_asignar', label: 'Sin clasificar', labelPlural: 'Sin clasificar', cssClass: 'sinasignar' },
]

const POR_KEY = new Map(TIPOS_PUESTO.map((t) => [t.key, t]))

export function ordenTipoPuesto(tipo) {
  const idx = TIPOS_PUESTO.findIndex((t) => t.key === tipo)
  return idx === -1 ? TIPOS_PUESTO.length : idx
}

export function labelTipoPuesto(tipo) {
  return POR_KEY.get(tipo)?.label || tipo
}

export function labelPluralTipoPuesto(tipo) {
  return POR_KEY.get(tipo)?.labelPlural || tipo
}

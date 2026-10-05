// La clasificación mensual/quincenal vive en rrhh_puestos_config (tabla
// compartida, administrada desde Tablero_RRHH — este módulo solo la lee).
// Tango reescribe a veces el mismo puesto con otra capitalización (ej.
// "RRHH" vs "Rrhh"), así que la búsqueda es case-insensitive aunque el
// desc_puesto se siga mostrando tal cual viene en pantalla.
export function normPuesto(s) {
  return (s || '').trim().toUpperCase()
}

export function tipoPuesto(descPuesto, mapaClasif) {
  return mapaClasif.get(normPuesto(descPuesto)) || 'sin_asignar'
}

export function nombrePuesto(descPuesto) {
  const limpio = (descPuesto || '').trim()
  if (!limpio) return 'Sin puesto'
  if (limpio.toLowerCase() === 'rrhh') return 'RRHH'
  return limpio
}

const ACCENTS = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n' }

// Normalización de texto libre para búsqueda (sin tildes, minúscula) — copia
// local a propósito, igual que el resto de las funciones de este archivo
// (CLAUDE.md, sección 6: nada de importar lib/ de otro módulo).
export function norm(s) {
  return (s || '')
    .toLowerCase()
    .split('')
    .map((ch) => ACCENTS[ch] || ch)
    .join('')
}

export const TIPOS_PUESTO = [
  { key: 'mensual', label: 'Mensual', labelPlural: 'Mensuales', color: '#7c3aed' },
  { key: 'quincenal', label: 'Quincenal', labelPlural: 'Quincenales', color: 'var(--amber)' },
  { key: 'sin_asignar', label: 'Sin clasificar', labelPlural: 'Sin clasificar', color: 'var(--text3)' },
]

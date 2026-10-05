// Copia propia de este módulo a propósito (CLAUDE.md, sección 6: no
// importar lib/ de otro módulo, aunque la lógica sea parecida a la de
// Plantel/Operativos). Misma normalización que usa Tablero_RRHH: Tango
// reescribe a veces el mismo puesto con otra capitalización.
export function normPuesto(s) {
  return (s || '').trim().toUpperCase()
}

export function tipoPuesto(descPuesto, mapaClasif) {
  return mapaClasif.get(normPuesto(descPuesto)) || 'sin_asignar'
}

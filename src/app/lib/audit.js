// Helper de auditoría simple para tablas produccion_* (sección 4 de CLAUDE.md).
// No se usa en Operativos porque ese módulo escribe en tablas existentes
// (citaciones/citacion_detalle) que no llevan estas columnas.

export function stampCreate(user) {
  return {
    creado_por: user.id,
    creado_en: new Date().toISOString(),
  }
}

export function stampUpdate(user) {
  return {
    modificado_por: user.id,
    modificado_en: new Date().toISOString(),
  }
}

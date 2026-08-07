// Roles con "vista Admin": ven todo Operativos (Citar + Análisis +
// Validación + Destinatarios del listado) y pueden aprobar/rechazar
// citaciones. Todo lo demás (hoy: supervisor_planta) tiene "vista
// Supervisor" — solo puede armar y guardar la citación de Citar.
const ROLES_ADMIN = ['gerente_produccion', 'admin_sistema']

export function esVistaAdmin(user) {
  return ROLES_ADMIN.includes(user?.rol)
}

// Quién puede aprobar/rechazar una citación en el flujo de validación —
// hoy es el mismo conjunto de roles que la vista Admin.
export function puedeValidar(user) {
  return esVistaAdmin(user)
}

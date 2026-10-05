export const ROLES = [
  { key: 'gerente_produccion', label: 'Gerente de producción' },
  { key: 'admin_sistema', label: 'Administración del sistema' },
  { key: 'supervisor_planta', label: 'Supervisor de planta' },
  { key: 'superadmin', label: 'Superadmin' },
]

export function labelRol(rol) {
  return ROLES.find((r) => r.key === rol)?.label || rol
}

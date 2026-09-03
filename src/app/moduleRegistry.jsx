import { OperativosPage } from '../modules/operativos/OperativosPage'
import { BusquedaPersonalPage } from '../modules/busqueda-personal/BusquedaPersonalPage'
import { PolivalenciaPage } from '../modules/polivalencia/PolivalenciaPage'
import { AuditoriaPage } from '../modules/auditoria/AuditoriaPage'

// Registro central de módulos habilitados. Agregar o sacar un módulo del
// panel es agregar/sacar una entrada acá — no hay que tocar Sidebar,
// AppLayout ni el resto de los módulos (sección 6 de CLAUDE.md).
export const moduleRegistry = [
  {
    key: 'operativos',
    label: 'Gestión de Operativos',
    path: '/operativos',
    element: <OperativosPage />,
  },
  {
    key: 'busqueda-personal',
    label: 'Búsqueda de Personal',
    path: '/busqueda-personal',
    element: <BusquedaPersonalPage />,
    // Por ahora la maneja Javier — los supervisores de planta
    // (Carlos/Leonardo) no la ven en el menú. undefined = visible a todos.
    roles: ['gerente_produccion', 'admin_sistema'],
  },
  {
    key: 'polivalencia',
    label: 'Polivalencia',
    path: '/polivalencia',
    element: <PolivalenciaPage />,
  },
  {
    key: 'auditoria',
    label: 'Auditoría',
    path: '/auditoria',
    element: <AuditoriaPage />,
    // Uso de cimomet-v2 por otros sectores (Fabricación/Calidad/etc.) — no
    // le sirve a un supervisor de planta de Operativos, solo a Javier/Valentín.
    roles: ['gerente_produccion', 'admin_sistema'],
  },
]

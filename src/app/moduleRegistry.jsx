import { OperativosPage } from '../modules/operativos/OperativosPage'
import { BusquedaPersonalPage } from '../modules/busqueda-personal/BusquedaPersonalPage'

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
  },
]

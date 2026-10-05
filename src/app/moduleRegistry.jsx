import { OperativosPage } from '../modules/operativos/OperativosPage'
import { BusquedaPersonalPage } from '../modules/busqueda-personal/BusquedaPersonalPage'
import { PolivalenciaPage } from '../modules/polivalencia/PolivalenciaPage'
import { AuditoriaPage } from '../modules/auditoria/AuditoriaPage'
import { PlantelPage } from '../modules/plantel/PlantelPage'
import { HorasPresentismoPage } from '../modules/horas-presentismo/HorasPresentismoPage'

// Registro central de módulos habilitados. Agregar o sacar un módulo del
// panel es agregar/sacar una entrada acá — no hay que tocar Sidebar,
// AppLayout ni el resto de los módulos (sección 6 de CLAUDE.md).
//
// `grupo` es puramente de presentación (cómo se separan en el menú y en
// el checklist de Configuración → Perfiles): 'produccion' para lo que
// gestiona directamente el gerente de producción, 'rrhh' para lo que es
// esencialmente consulta de datos de Recursos Humanos.
export const moduleRegistry = [
  {
    key: 'operativos',
    label: 'Gestión de Operativos',
    path: '/operativos',
    element: <OperativosPage />,
    grupo: 'produccion',
  },
  {
    key: 'busqueda-personal',
    label: 'Búsqueda de Personal',
    path: '/busqueda-personal',
    element: <BusquedaPersonalPage />,
    // Por ahora la maneja Javier — los supervisores de planta
    // (Carlos/Leonardo) no la ven en el menú. undefined = visible a todos.
    roles: ['gerente_produccion', 'admin_sistema'],
    grupo: 'produccion',
  },
  {
    key: 'polivalencia',
    label: 'Polivalencia',
    path: '/polivalencia',
    element: <PolivalenciaPage />,
    grupo: 'produccion',
  },
  {
    key: 'auditoria',
    label: 'Auditoría',
    path: '/auditoria',
    element: <AuditoriaPage />,
    // Uso de cimomet-v2 por otros sectores (Fabricación/Calidad/etc.) — no
    // le sirve a un supervisor de planta de Operativos, solo a Javier/Valentín.
    roles: ['gerente_produccion', 'admin_sistema'],
    grupo: 'produccion',
  },
  {
    key: 'plantel',
    label: 'Plantel',
    path: '/plantel',
    element: <PlantelPage />,
    // Datos de personal (RRHH) solo de consulta — mismo criterio que
    // Auditoría y Búsqueda de Personal.
    roles: ['gerente_produccion', 'admin_sistema'],
    grupo: 'rrhh',
  },
  {
    key: 'horas-presentismo',
    label: 'Horas y Presentismo',
    path: '/horas-presentismo',
    element: <HorasPresentismoPage />,
    // Datos de RRHH (horas, cruce con Tango) solo de consulta — mismo
    // criterio que Plantel/Auditoría.
    roles: ['gerente_produccion', 'admin_sistema'],
    grupo: 'rrhh',
  },
]

export const GRUPOS_MODULO = [
  { key: 'produccion', label: 'Producción' },
  { key: 'rrhh', label: 'RRHH' },
]

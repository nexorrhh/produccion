import { useState } from 'react'
import { useEmpleadosPlantel } from './hooks/useEmpleadosPlantel'
import { useClasificacionPuestosPlantel } from './hooks/useClasificacionPuestosPlantel'
import { ResumenPlantel } from './components/ResumenPlantel'
import { ListadoPlantel } from './components/ListadoPlantel'
import { CumpleanosAntiguedad } from './components/CumpleanosAntiguedad'
import './plantel.css'

// Módulo de solo lectura: muestra el plantel activo (misma tabla `empleados`
// que ya lee Operativos, consultada de forma independiente — ver CLAUDE.md
// sección 6). No administra altas/bajas ni clasificación de puestos; eso
// sigue siendo responsabilidad exclusiva de Tablero_RRHH.
export function PlantelPage() {
  const { empleados, status, statusText } = useEmpleadosPlantel()
  const mapaClasif = useClasificacionPuestosPlantel()
  const [vista, setVista] = useState('resumen')

  return (
    <div className="wrap">
      <div className="pl-tabs">
        <button className={vista === 'resumen' ? 'active' : ''} onClick={() => setVista('resumen')}>
          Resumen
        </button>
        <button className={vista === 'listado' ? 'active' : ''} onClick={() => setVista('listado')}>
          Listado
        </button>
        <button className={vista === 'cumpleanos' ? 'active' : ''} onClick={() => setVista('cumpleanos')}>
          Cumpleaños y Antigüedad
        </button>
      </div>

      <div className="pl-status-line">
        <span className={'pl-status-dot ' + status} />
        {statusText}
      </div>

      {status === 'error' ? (
        <div className="pl-error-banner">{statusText}</div>
      ) : vista === 'resumen' ? (
        <ResumenPlantel empleados={empleados} mapaClasif={mapaClasif} />
      ) : vista === 'listado' ? (
        <ListadoPlantel empleados={empleados} mapaClasif={mapaClasif} />
      ) : (
        <CumpleanosAntiguedad empleados={empleados} mapaClasif={mapaClasif} />
      )}
    </div>
  )
}

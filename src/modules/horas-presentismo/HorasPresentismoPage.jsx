import { useState } from 'react'
import { useHorasOtDetalle } from './hooks/useHorasOtDetalle'
import { useHorasMensual } from './hooks/useHorasMensual'
import { useEmpleadosHP } from './hooks/useEmpleadosHP'
import { useClasificacionPuestosHP } from './hooks/useClasificacionPuestosHP'
import { HorasOT } from './components/HorasOT'
import { CruceHoras } from './components/CruceHoras'
import './horasPresentismo.css'

// Fase 1 de este módulo: el lado "Horas" (Horas por OT + Cruce de Horas),
// que en Tablero_RRHH ya es un bloque autocontenido aparte. El lado
// "Presentismo" (Indicadores / Novedades / Por persona / Ficha) es mucho
// más grande — queda para un próximo checkpoint. Solo lectura: no incluye
// las pantallas de carga de Excel ni de parametrización, que siguen
// siendo responsabilidad exclusiva de Tablero_RRHH.
export function HorasPresentismoPage() {
  const [vista, setVista] = useState('horas-ot')
  const { filas: filasOt, status, statusText } = useHorasOtDetalle()
  const { filas: horasMensual } = useHorasMensual()
  const { empleados } = useEmpleadosHP()
  const mapaClasif = useClasificacionPuestosHP()

  return (
    <div className="wrap">
      <div className="hp-tabs">
        <button className={vista === 'horas-ot' ? 'active' : ''} onClick={() => setVista('horas-ot')}>
          Horas por OT
        </button>
        <button className={vista === 'cruce' ? 'active' : ''} onClick={() => setVista('cruce')}>
          Cruce de Horas
        </button>
      </div>

      <div className="hp-status-line">
        <span className={'hp-status-dot ' + status} />
        {statusText}
      </div>

      {status === 'error' ? (
        <div className="hp-error-banner">{statusText}</div>
      ) : vista === 'horas-ot' ? (
        <HorasOT filas={filasOt} />
      ) : (
        <CruceHoras filasOt={filasOt} horasMensual={horasMensual} empleados={empleados} mapaClasif={mapaClasif} />
      )}
    </div>
  )
}

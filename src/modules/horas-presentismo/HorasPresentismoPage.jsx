import { useState } from 'react'
import { useHorasOtDetalle } from './hooks/useHorasOtDetalle'
import { useHorasMensual } from './hooks/useHorasMensual'
import { useHorasDetalle } from './hooks/useHorasDetalle'
import { useTardanzasSalidas } from './hooks/useTardanzasSalidas'
import { useAusentismoTipo } from './hooks/useAusentismoTipo'
import { useClasificacionAusencias } from './hooks/useClasificacionAusencias'
import { useEmpleadosHP } from './hooks/useEmpleadosHP'
import { useClasificacionPuestosHP } from './hooks/useClasificacionPuestosHP'
import { HorasOT } from './components/HorasOT'
import { CruceHoras } from './components/CruceHoras'
import { Indicadores } from './components/Indicadores'
import { Novedades } from './components/Novedades'
import { PorPersona } from './components/PorPersona'
import { Ficha } from './components/Ficha'
import { Loader } from '../../app/components/Loader'
import './horasPresentismo.css'

const TABS = [
  { key: 'horas-ot', label: 'Horas por OT' },
  { key: 'cruce', label: 'Cruce de Horas' },
  { key: 'indicadores', label: 'Indicadores' },
  { key: 'novedades', label: 'Novedades' },
  { key: 'personas', label: 'Por persona' },
  { key: 'ficha', label: 'Ficha' },
]

// Módulo porteado de Tablero_RRHH, solo lectura: no incluye las pantallas
// de carga de Excel ni de parametrización (clasificación de ausencias,
// exentos de fichada), que siguen siendo responsabilidad exclusiva de
// Tablero_RRHH. Tampoco incluye el sub-modo "Chequeo del día (fichadas)"
// de Novedades, porque implica subir un archivo del reloj biométrico.
export function HorasPresentismoPage() {
  const [vista, setVista] = useState('horas-ot')
  const { filas: filasOt, status, statusText } = useHorasOtDetalle()
  const { filas: horasMensual } = useHorasMensual()
  const { filas: horasDetalle } = useHorasDetalle()
  const { filas: tardanzas } = useTardanzasSalidas()
  const { filas: ausentismoTipo } = useAusentismoTipo()
  const mapaCategoriaAusencia = useClasificacionAusencias()
  const { empleados } = useEmpleadosHP()
  const mapaClasif = useClasificacionPuestosHP()

  return (
    <div className="wrap">
      <div className="hp-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={vista === t.key ? 'active' : ''} onClick={() => setVista(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {status === 'loading' ? (
        <Loader texto="Cargando horas…" />
      ) : status === 'error' ? (
        <div className="hp-error-banner">{statusText}</div>
      ) : (
        <>
          <div className="hp-status-line">
            <span className={'hp-status-dot ' + status} />
            {statusText}
          </div>
          <div key={vista} className="app-fade">
            {vista === 'horas-ot' ? (
              <HorasOT filas={filasOt} />
            ) : vista === 'cruce' ? (
              <CruceHoras filasOt={filasOt} horasMensual={horasMensual} empleados={empleados} mapaClasif={mapaClasif} />
            ) : vista === 'indicadores' ? (
              <Indicadores
                horasMensual={horasMensual}
                tardanzas={tardanzas}
                ausentismoTipo={ausentismoTipo}
                empleados={empleados}
                mapaClasif={mapaClasif}
              />
            ) : vista === 'novedades' ? (
              <Novedades
                tardanzas={tardanzas}
                horasDetalle={horasDetalle}
                horasMensual={horasMensual}
                empleados={empleados}
                mapaClasif={mapaClasif}
                mapaCategoriaAusencia={mapaCategoriaAusencia}
              />
            ) : vista === 'personas' ? (
              <PorPersona horasMensual={horasMensual} horasDetalle={horasDetalle} empleados={empleados} mapaClasif={mapaClasif} />
            ) : (
              <Ficha horasMensual={horasMensual} horasDetalle={horasDetalle} tardanzas={tardanzas} empleados={empleados} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

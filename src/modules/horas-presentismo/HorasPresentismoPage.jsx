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

// Mismo orden que el menú de Tablero_RRHH (Indicadores, Novedades,
// Personas, Ficha, Cargar, Horas por OT, Horas Cruce, Parametrización) —
// salteando Cargar y Parametrización, que quedan fuera de este módulo.
const TABS = [
  { key: 'indicadores', label: 'Indicadores' },
  { key: 'novedades', label: 'Novedades' },
  { key: 'personas', label: 'Por persona' },
  { key: 'ficha', label: 'Ficha' },
  { key: 'horas-ot', label: 'Horas por OT' },
  { key: 'cruce', label: 'Cruce de Horas' },
]

// Módulo porteado de Tablero_RRHH, solo lectura: no incluye las pantallas
// de carga de Excel ni de parametrización (clasificación de ausencias,
// exentos de fichada), que siguen siendo responsabilidad exclusiva de
// Tablero_RRHH. Tampoco incluye el sub-modo "Chequeo del día (fichadas)"
// de Novedades, porque implica subir un archivo del reloj biométrico.
export function HorasPresentismoPage() {
  const [vista, setVista] = useState('indicadores')
  const { filas: filasOt, status, statusText } = useHorasOtDetalle()
  const { filas: horasMensual, cargando: cargandoHorasMensual } = useHorasMensual()
  const { filas: horasDetalle, cargando: cargandoHorasDetalle } = useHorasDetalle()
  const { filas: tardanzas, cargando: cargandoTardanzas } = useTardanzasSalidas()
  const { filas: ausentismoTipo, cargando: cargandoAusentismoTipo } = useAusentismoTipo()
  const { mapaCategoria: mapaCategoriaAusencia, cargando: cargandoCategoriaAusencia } = useClasificacionAusencias()
  const { empleados, cargando: cargandoEmpleados } = useEmpleadosHP()
  const mapaClasif = useClasificacionPuestosHP()

  // Un solo gate de carga para todo el módulo: cada pestaña cruza varias
  // de estas fuentes a la vez, así que mostrar el spinner recién cuando
  // TODAS terminaron evita pantallas a medio cargar que parecen "sin
  // datos" sin serlo.
  const cargandoTodo =
    cargandoHorasMensual ||
    cargandoHorasDetalle ||
    cargandoTardanzas ||
    cargandoAusentismoTipo ||
    cargandoCategoriaAusencia ||
    cargandoEmpleados

  return (
    <div className="wrap">
      <div className="hp-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={vista === t.key ? 'active' : ''} onClick={() => setVista(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {status === 'loading' || cargandoTodo ? (
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
              <PorPersona
                horasMensual={horasMensual}
                horasDetalle={horasDetalle}
                horasOt={filasOt}
                tardanzas={tardanzas}
                mapaCategoriaAusencia={mapaCategoriaAusencia}
                empleados={empleados}
                mapaClasif={mapaClasif}
              />
            ) : (
              <Ficha
                horasMensual={horasMensual}
                horasDetalle={horasDetalle}
                horasOt={filasOt}
                tardanzas={tardanzas}
                mapaCategoriaAusencia={mapaCategoriaAusencia}
                empleados={empleados}
                mapaClasif={mapaClasif}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

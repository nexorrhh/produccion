import { useMemo, useState } from 'react'
import { KpisCumplimiento } from './components/KpisCumplimiento'
import { GraficoEvolucion } from './components/GraficoEvolucion'
import { GraficoAsistencia } from './components/GraficoAsistencia'
import { TablaPorOperativo } from './components/TablaPorOperativo'
import { TablaPorPersona } from './components/TablaPorPersona'
import { useResumenOperativos } from './hooks/useResumenOperativos'
import './analisis.css'

export function AnalisisOperativos() {
  const { porFecha, porPersona, cargando, error } = useResumenOperativos()
  const [vistaDetalle, setVistaDetalle] = useState('operativo')

  const totales = useMemo(() => {
    const totConv = porFecha.reduce((s, f) => s + f.convocados, 0)
    const totPres = porFecha.reduce((s, f) => s + f.presentes, 0)
    const totAus = porFecha.reduce((s, f) => s + f.ausentes, 0)
    const totNoc = porFecha.reduce((s, f) => s + f.no_convocados, 0)
    const cantSab = porFecha.filter((f) => f.tipo === 'Sabado').length
    return {
      totalOperativos: porFecha.length,
      cantSabados: cantSab,
      cantDomFer: porFecha.length - cantSab,
      totalConvocatorias: totConv,
      totalPresentes: totPres,
      totalAusentes: totAus,
      totalNoConvocados: totNoc,
      pctGlobal: totConv > 0 ? Math.round((totPres / totConv) * 100) : 0,
    }
  }, [porFecha])

  const datosLinea = useMemo(() => porFecha.map((f) => ({ fecha: f.fecha, pct: f.pct_cumplimiento })), [porFecha])

  if (cargando) return <div className="an-vacio">Cargando datos de operativos…</div>
  if (error) return <div className="an-error-banner">{error}</div>

  return (
    <div className="an-root">
      <KpisCumplimiento {...totales} />

      <div className="an-graficos">
        <div className="an-graf-card an-graf-card-wide">
          <h3 className="an-graf-titulo">Cumplimiento por operativo</h3>
          <GraficoEvolucion datos={datosLinea} />
        </div>
        <div className="an-graf-card">
          <h3 className="an-graf-titulo">Asistencia acumulada</h3>
          <GraficoAsistencia
            presentes={totales.totalPresentes}
            ausentes={totales.totalAusentes}
            noConvocados={totales.totalNoConvocados}
          />
        </div>
      </div>

      <div className="an-seccion">
        <div className="an-seccion-header">
          <h3 className="an-seccion-titulo">Detalle</h3>
          <div className="op-chip-toggle">
            <button className={vistaDetalle === 'operativo' ? 'active' : ''} onClick={() => setVistaDetalle('operativo')}>
              Por operativo
            </button>
            <button className={vistaDetalle === 'persona' ? 'active' : ''} onClick={() => setVistaDetalle('persona')}>
              Por persona
            </button>
          </div>
        </div>

        {vistaDetalle === 'operativo' ? <TablaPorOperativo filas={porFecha} /> : <TablaPorPersona filas={porPersona} />}
      </div>
    </div>
  )
}

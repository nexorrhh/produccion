import { useMemo, useState } from 'react'
import { fmtPeriodo, nombreEmpresa } from '../lib/periodo'
import { tipoPuesto } from '../lib/clasificacionPuesto'
import {
  calcularIndicadores,
  pctPresentismo,
  pctCumplimientoHoras,
  pctAusentismo,
  colorAusentismo,
  fmtPct,
  fmtHoras,
} from '../lib/calculoIndicadores'
import { KpisBloque } from './KpisBloque'

const SECCIONES = [
  { key: 'quincenal', label: 'Quincenales (taller)' },
  { key: 'mensual', label: 'Mensuales (administrativo)' },
]

function SeccionIndicadores({ titulo, filas, kpis, tardanzasSeccion }) {
  const [orden, setOrden] = useState({ key: 'pctAusentismo', dir: 'desc' })

  const tardanzasPorLegajo = useMemo(() => {
    const mapa = new Map()
    tardanzasSeccion.forEach((t) => {
      const clave = t.empresa + '|' + t.legajo
      if (!mapa.has(clave)) mapa.set(clave, { tarde: 0, temprano: 0 })
      const c = mapa.get(clave)
      if (t.tipo === 'tarde') c.tarde++
      else if (t.tipo === 'temprano') c.temprano++
    })
    return mapa
  }, [tardanzasSeccion])

  const filasCalc = useMemo(() => {
    return filas.map((f) => {
      const t = tardanzasPorLegajo.get(f.empresa + '|' + f.legajo) || { tarde: 0, temprano: 0 }
      return {
        ...f,
        pctPresentismo: pctPresentismo(f),
        pctCumplimiento: pctCumplimientoHoras(f),
        pctAusentismo: pctAusentismo(f),
        tardanzas: t.tarde,
        salidasAnticipadas: t.temprano,
      }
    })
  }, [filas, tardanzasPorLegajo])

  function toggleOrden(key) {
    setOrden((o) => (o.key === key ? { key, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  const ordenadas = useMemo(() => {
    const dir = orden.dir === 'asc' ? 1 : -1
    return [...filasCalc].sort((a, b) => {
      const va = a[orden.key]
      const vb = b[orden.key]
      if (va === null || va === undefined) return 1
      if (vb === null || vb === undefined) return -1
      if (typeof va === 'string') return dir * va.localeCompare(vb)
      return dir * ((va || 0) - (vb || 0))
    })
  }, [filasCalc, orden])

  function th(key, label) {
    return (
      <th key={key} className="hp-th-ordenable" onClick={() => toggleOrden(key)}>
        {label} {orden.key === key ? (orden.dir === 'asc' ? '▲' : '▼') : ''}
      </th>
    )
  }

  return (
    <div className="hp-seccion">
      <h3 className="hp-seccion-titulo">
        {titulo} ({filas.length})
      </h3>
      {filas.length === 0 ? (
        <div className="hp-vacio">Sin personal en esta sección para este período.</div>
      ) : (
        <>
          <KpisBloque kpis={kpis} />

          <table className="hp-tabla">
            <thead>
              <tr>
                {th('apellido', 'Nombre')}
                <th>Empresa</th>
                <th>Departamento</th>
                {th('hs_esperadas', 'Hs. esp.')}
                {th('hs_normales', 'Hs. norm.')}
                {th('pctCumplimiento', 'Cumpl.')}
                {th('pctAusentismo', 'Ausent.')}
                {th('pctPresentismo', 'Presentismo')}
                {th('tardanzas', 'Tardanzas')}
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((f) => (
                <tr key={f.empresa + '|' + f.legajo}>
                  <td>{(f.apellido || '') + ', ' + (f.nombre || '')}</td>
                  <td>{nombreEmpresa(f.empresa)}</td>
                  <td>{f.departamento || '—'}</td>
                  <td>{fmtHoras(f.hs_esperadas)}</td>
                  <td>{fmtHoras(f.hs_normales)}</td>
                  <td>{fmtPct(f.pctCumplimiento)}</td>
                  <td style={{ color: colorAusentismo(f.pctAusentismo) }}>{fmtPct(f.pctAusentismo)}</td>
                  <td>{fmtPct(f.pctPresentismo)}</td>
                  <td>{f.tardanzas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

// Mismas fórmulas y agrupación (Quincenales/Mensuales según
// rrhh_puestos_config) que presentismo-indicadores.js de Tablero_RRHH.
export function Indicadores({ horasMensual, tardanzas, ausentismoTipo, empleados, mapaClasif }) {
  const empleadosPorLegajo = useMemo(() => {
    const mapa = new Map()
    empleados.forEach((e) => mapa.set(e.empresa + '|' + e.legajo, e))
    return mapa
  }, [empleados])

  const periodos = useMemo(() => [...new Set(horasMensual.map((f) => f.periodo))].sort().reverse(), [horasMensual])
  const [periodoSel, setPeriodoSel] = useState('')
  const [empresa, setEmpresa] = useState('')
  const periodo = periodoSel || periodos[0] || ''

  const basePeriodo = useMemo(() => horasMensual.filter((f) => f.periodo === periodo), [horasMensual, periodo])
  const delPeriodo = useMemo(
    () => basePeriodo.filter((f) => !empresa || f.empresa === empresa),
    [basePeriodo, empresa]
  )
  const tardanzasDelPeriodo = useMemo(
    () => tardanzas.filter((t) => t.periodo === periodo).filter((t) => !empresa || t.empresa === empresa),
    [tardanzas, periodo, empresa]
  )

  const conTipo = useMemo(() => {
    return delPeriodo.map((f) => {
      const emp = empleadosPorLegajo.get(f.empresa + '|' + f.legajo)
      return { ...f, _tipo: emp ? tipoPuesto(emp.desc_puesto, mapaClasif) : 'sin_asignar' }
    })
  }, [delPeriodo, empleadosPorLegajo, mapaClasif])

  const ausentismoTipoDelPeriodo = useMemo(
    () => ausentismoTipo.filter((f) => f.periodo === periodo).sort((a, b) => b.hs_total - a.hs_total),
    [ausentismoTipo, periodo]
  )

  if (!periodos.length) {
    return <div className="hp-vacio">No hay datos de horas mensuales cargados todavía.</div>
  }

  return (
    <div className="hp-indicadores">
      <div className="hp-filtros">
        <select className="hp-select" value={periodo} onChange={(e) => setPeriodoSel(e.target.value)}>
          {periodos.map((p) => (
            <option key={p} value={p}>
              {fmtPeriodo(p)}
            </option>
          ))}
        </select>
        <div className="hp-pills">
          <button className={empresa === '' ? 'active' : ''} onClick={() => setEmpresa('')}>
            Todos <b>{basePeriodo.length}</b>
          </button>
          <button className={empresa === 'CIMOMET' ? 'active' : ''} onClick={() => setEmpresa('CIMOMET')}>
            Cimomet <b>{basePeriodo.filter((f) => f.empresa === 'CIMOMET').length}</b>
          </button>
          <button className={empresa === 'COMOING' ? 'active' : ''} onClick={() => setEmpresa('COMOING')}>
            Co.mo.ing <b>{basePeriodo.filter((f) => f.empresa === 'COMOING').length}</b>
          </button>
        </div>
      </div>

      {SECCIONES.map((s) => {
        const filasSeccion = conTipo.filter((f) => f._tipo === s.key)
        const legajosSeccion = new Set(filasSeccion.map((f) => f.empresa + '|' + f.legajo))
        const tardanzasSeccion = tardanzasDelPeriodo.filter((t) => legajosSeccion.has(t.empresa + '|' + t.legajo))
        const kpis = calcularIndicadores(filasSeccion, tardanzasSeccion)
        return (
          <SeccionIndicadores
            key={s.key}
            titulo={s.label}
            filas={filasSeccion}
            kpis={kpis}
            tardanzasSeccion={tardanzasSeccion}
          />
        )
      })}

      <div className="hp-graf-card">
        <h3 className="hp-graf-titulo">Ausentismo por tipo de novedad — {fmtPeriodo(periodo)}</h3>
        {ausentismoTipoDelPeriodo.length === 0 ? (
          <div className="hp-vacio">Sin datos para este período.</div>
        ) : (
          <table className="hp-tabla">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Horas</th>
              </tr>
            </thead>
            <tbody>
              {ausentismoTipoDelPeriodo.map((f) => (
                <tr key={f.tipo}>
                  <td>{f.tipo}</td>
                  <td>{fmtHoras(f.hs_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

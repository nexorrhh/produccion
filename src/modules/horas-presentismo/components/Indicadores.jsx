import { useMemo, useState } from 'react'
import { fmtPeriodo } from '../lib/periodo'
import { tipoPuesto } from '../lib/clasificacionPuesto'
import { calcularIndicadores, fmtHoras } from '../lib/calculoIndicadores'
import { KpisBloque } from './KpisBloque'

const SECCIONES = [
  { key: 'quincenal', label: 'Quincenales (taller)' },
  { key: 'mensual', label: 'Mensuales (administrativo)' },
]

// Solo indicadores generales por sección (Quincenales/Mensuales) — igual
// que presentismo-indicadores.js de Tablero_RRHH. El desglose por persona
// vive en la pestaña "Por persona", no acá (evita duplicar la misma
// tabla en dos pestañas distintas).
function SeccionIndicadores({ titulo, filas, kpis }) {
  return (
    <div className="hp-seccion">
      <h3 className="hp-seccion-titulo">
        {titulo} ({filas.length})
      </h3>
      {filas.length === 0 ? <div className="hp-vacio">Sin personal en esta sección para este período.</div> : <KpisBloque kpis={kpis} />}
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
        return <SeccionIndicadores key={s.key} titulo={s.label} filas={filasSeccion} kpis={kpis} />
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

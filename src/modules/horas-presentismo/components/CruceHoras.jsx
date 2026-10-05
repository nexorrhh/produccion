import { useMemo, useState } from 'react'
import { fmtPeriodo, nombreEmpresa } from '../lib/periodo'
import { tipoPuesto } from '../lib/clasificacionPuesto'

// Umbral de diferencia significativa — mismo criterio que Tablero_RRHH
// (horas-cruce.js): por debajo de 15% se considera ruido de redondeo, no
// un error real a revisar.
const PCT_DIF_SIGNIFICATIVA = 0.15

const ESTADOS = [
  { key: 'ok', label: 'OK', color: 'var(--green)' },
  { key: 'diferencia', label: 'Diferencia', color: 'var(--red)' },
  { key: 'solo_ot', label: 'Solo OT (sin Tango)', color: 'var(--amber)' },
  { key: 'solo_tango', label: 'Solo Tango (sin OT)', color: 'var(--text3)' },
]

// Compara, por legajo+empresa+período, las horas que Tango liquidó
// (rrhh_horas_mensual) contra las que Capataz registró por OT
// (horas_ot_detalle, sin las anómalas). Capataz es la fuente de verdad:
// toda diferencia se interpreta como un error a revisar en Tango, nunca al
// revés — mismo criterio que horas-cruce.js de Tablero_RRHH. El personal
// mensual casi nunca carga OT, así que se excluye del cruce salvo que ese
// período puntual sí tenga horas cargadas en Capataz (si no, siempre
// marcaría "sin OT" sin que sea un error real).
export function CruceHoras({ filasOt, horasMensual, empleados, mapaClasif }) {
  const empleadosPorLegajo = useMemo(() => {
    const mapa = new Map()
    empleados.forEach((e) => mapa.set(e.empresa + '|' + e.legajo, e))
    return mapa
  }, [empleados])

  const cruce = useMemo(() => {
    const otPorClave = new Map()
    filasOt.forEach((f) => {
      if (f.anomalo) return
      const clave = f.empresa + '|' + f.legajo + '|' + f.periodo
      otPorClave.set(clave, (otPorClave.get(clave) || 0) + Number(f.horas || 0))
    })

    const tangoPorClave = new Map()
    horasMensual.forEach((f) => {
      const clave = f.empresa + '|' + f.legajo + '|' + f.periodo
      const total =
        Number(f.hs_normales || 0) + Number(f.hs_extra50 || 0) + Number(f.hs_extra100 || 0) + Number(f.hs_vac_trabajadas || 0)
      tangoPorClave.set(clave, total)
    })

    const claves = new Set([...otPorClave.keys(), ...tangoPorClave.keys()])
    const filas = []
    claves.forEach((clave) => {
      const [empresa, legajoStr, periodo] = clave.split('|')
      const legajo = Number(legajoStr)
      const horasOt = otPorClave.get(clave) || 0
      const horasTango = tangoPorClave.get(clave) || 0
      const emp = empleadosPorLegajo.get(empresa + '|' + legajo)
      const esMensual = emp ? tipoPuesto(emp.desc_puesto, mapaClasif) === 'mensual' : false

      if (esMensual && horasOt === 0) return

      let estado
      if (horasOt > 0 && horasTango === 0) estado = 'solo_ot'
      else if (horasOt === 0 && horasTango > 0) estado = 'solo_tango'
      else {
        const dif = horasTango > 0 ? Math.abs(horasOt - horasTango) / horasTango : 0
        estado = dif >= PCT_DIF_SIGNIFICATIVA ? 'diferencia' : 'ok'
      }

      filas.push({ empresa, legajo, periodo, horasOt, horasTango, estado, nombre: emp?.apellido_y_nombre || '—' })
    })

    return filas.sort((a, b) => b.periodo.localeCompare(a.periodo) || a.legajo - b.legajo)
  }, [filasOt, horasMensual, empleadosPorLegajo, mapaClasif])

  const periodos = useMemo(() => [...new Set(cruce.map((f) => f.periodo))].sort().reverse(), [cruce])
  const [periodoSel, setPeriodoSel] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [estado, setEstado] = useState('')

  const periodo = periodoSel || periodos[0] || ''

  const delPeriodo = useMemo(() => cruce.filter((f) => f.periodo === periodo), [cruce, periodo])

  const conteos = useMemo(() => {
    const c = {}
    ESTADOS.forEach((e) => (c[e.key] = delPeriodo.filter((f) => f.estado === e.key).length))
    return c
  }, [delPeriodo])

  const filtrado = useMemo(() => {
    return delPeriodo.filter((f) => (!empresa || f.empresa === empresa) && (!estado || f.estado === estado))
  }, [delPeriodo, empresa, estado])

  if (!cruce.length) {
    return <div className="hp-vacio">No hay datos suficientes para cruzar (falta carga de Tango o de Capataz).</div>
  }

  return (
    <div className="hp-cruce">
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
            Todos <b>{delPeriodo.length}</b>
          </button>
          <button className={empresa === 'CIMOMET' ? 'active' : ''} onClick={() => setEmpresa('CIMOMET')}>
            Cimomet <b>{delPeriodo.filter((f) => f.empresa === 'CIMOMET').length}</b>
          </button>
          <button className={empresa === 'COMOING' ? 'active' : ''} onClick={() => setEmpresa('COMOING')}>
            Co.mo.ing <b>{delPeriodo.filter((f) => f.empresa === 'COMOING').length}</b>
          </button>
        </div>
        <div className="hp-pills">
          <button className={estado === '' ? 'active' : ''} onClick={() => setEstado('')}>
            Todos <b>{delPeriodo.length}</b>
          </button>
          {ESTADOS.map((e) => (
            <button key={e.key} className={estado === e.key ? 'active' : ''} onClick={() => setEstado(e.key)}>
              {e.label} <b>{conteos[e.key] || 0}</b>
            </button>
          ))}
        </div>
      </div>

      {filtrado.length === 0 ? (
        <div className="hp-vacio">No hay registros con estos filtros.</div>
      ) : (
        <table className="hp-tabla">
          <thead>
            <tr>
              <th>Legajo</th>
              <th>Nombre</th>
              <th>Empresa</th>
              <th>Hs. Tango</th>
              <th>Hs. Capataz (OT)</th>
              <th>Diferencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrado.map((f) => {
              const dif = f.horasTango > 0 ? ((f.horasOt - f.horasTango) / f.horasTango) * 100 : null
              const estadoCfg = ESTADOS.find((e) => e.key === f.estado)
              return (
                <tr key={f.empresa + '|' + f.legajo + '|' + f.periodo}>
                  <td>{f.legajo}</td>
                  <td>{f.nombre}</td>
                  <td>{nombreEmpresa(f.empresa)}</td>
                  <td>{f.horasTango.toFixed(1)}</td>
                  <td>{f.horasOt.toFixed(1)}</td>
                  <td>{dif === null ? '—' : (dif > 0 ? '+' : '') + dif.toFixed(0) + '%'}</td>
                  <td>
                    <span className="hp-chip" style={{ color: estadoCfg.color, borderColor: estadoCfg.color }}>
                      {estadoCfg.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

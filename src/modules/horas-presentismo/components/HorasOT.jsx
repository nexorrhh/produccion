import { useEffect, useMemo, useState } from 'react'
import { fmtPeriodo, nombreEmpresa } from '../lib/periodo'

function sumHoras(filas) {
  return filas.reduce((s, f) => s + Number(f.horas || 0), 0)
}

function GraficoApilado({ datos }) {
  const max = Math.max(1, ...datos.map((d) => d.conOt + d.sinOt))
  return (
    <div className="hp-barras">
      {datos.map((d) => {
        const total = d.conOt + d.sinOt
        return (
          <div className="hp-barra-fila" key={d.periodo}>
            <span className="hp-barra-label">{fmtPeriodo(d.periodo)}</span>
            <div className="hp-barra-track" style={{ width: (total / max) * 100 + '%' }}>
              {d.conOt > 0 && (
                <div
                  className="hp-barra-seg hp-barra-seg-con"
                  style={{ width: (d.conOt / total) * 100 + '%' }}
                  title={`Con OT: ${Math.round(d.conOt)}h`}
                />
              )}
              {d.sinOt > 0 && (
                <div
                  className="hp-barra-seg hp-barra-seg-sin"
                  style={{ width: (d.sinOt / total) * 100 + '%' }}
                  title={`Sin OT: ${Math.round(d.sinOt)}h`}
                />
              )}
            </div>
            <span className="hp-barra-total">{Math.round(total)}h</span>
          </div>
        )
      })}
    </div>
  )
}

// Período → OT (o "Sin OT") → Tarea → Persona → detalle día a día, mismo
// criterio de navegación que horas-ot.js en Tablero_RRHH. Las filas
// marcadas como anómalas (+16h en un día, detectado al cargar el Excel en
// Tablero_RRHH) se excluyen de todos los totales, igual que el original.
export function HorasOT({ filas }) {
  const noAnomalas = useMemo(() => filas.filter((f) => !f.anomalo), [filas])
  const anomalas = filas.length - noAnomalas.length

  const periodos = useMemo(() => [...new Set(noAnomalas.map((f) => f.periodo))].sort().reverse(), [noAnomalas])
  const [periodo, setPeriodo] = useState('')
  const [ot, setOt] = useState(null)
  const [tarea, setTarea] = useState(null)
  const [persona, setPersona] = useState(null)

  useEffect(() => {
    if (!periodo && periodos.length) setPeriodo(periodos[0])
  }, [periodos, periodo])

  const porPeriodo = useMemo(() => {
    return periodos.map((p) => {
      const filasP = noAnomalas.filter((f) => f.periodo === p)
      return {
        periodo: p,
        conOt: sumHoras(filasP.filter((f) => f.ot)),
        sinOt: sumHoras(filasP.filter((f) => !f.ot)),
      }
    })
  }, [periodos, noAnomalas])

  const filasPeriodo = useMemo(() => noAnomalas.filter((f) => f.periodo === periodo), [noAnomalas, periodo])

  const porOt = useMemo(() => {
    const mapa = new Map()
    filasPeriodo.forEach((f) => {
      const clave = f.ot || '__sin_ot__'
      if (!mapa.has(clave)) mapa.set(clave, { ot: f.ot, cliente: f.cliente, proyecto: f.proyecto_nombre, filas: [] })
      mapa.get(clave).filas.push(f)
    })
    return [...mapa.values()].map((g) => ({ ...g, horas: sumHoras(g.filas) })).sort((a, b) => b.horas - a.horas)
  }, [filasPeriodo])

  const grupoOt = ot !== null ? porOt.find((g) => (g.ot || '__sin_ot__') === ot) : null

  const porTarea = useMemo(() => {
    if (!grupoOt) return []
    const mapa = new Map()
    grupoOt.filas.forEach((f) => {
      const clave = f.operacion || '(sin tarea)'
      if (!mapa.has(clave)) mapa.set(clave, [])
      mapa.get(clave).push(f)
    })
    return [...mapa.entries()]
      .map(([operacion, fs]) => ({ operacion, filas: fs, horas: sumHoras(fs) }))
      .sort((a, b) => b.horas - a.horas)
  }, [grupoOt])

  const grupoTarea = tarea !== null ? porTarea.find((g) => g.operacion === tarea) : null

  const porPersona = useMemo(() => {
    if (!grupoTarea) return []
    const mapa = new Map()
    grupoTarea.filas.forEach((f) => {
      const clave = f.empresa + '|' + f.legajo
      if (!mapa.has(clave)) mapa.set(clave, { legajo: f.legajo, nombre: f.nombre, empresa: f.empresa, filas: [] })
      mapa.get(clave).filas.push(f)
    })
    return [...mapa.values()].map((g) => ({ ...g, horas: sumHoras(g.filas) })).sort((a, b) => b.horas - a.horas)
  }, [grupoTarea])

  const grupoPersona = persona !== null ? porPersona.find((g) => g.empresa + '|' + g.legajo === persona) : null
  const diasPersona = useMemo(() => {
    if (!grupoPersona) return []
    return [...grupoPersona.filas].sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [grupoPersona])

  function irAPeriodo(p) {
    setPeriodo(p)
    setOt(null)
    setTarea(null)
    setPersona(null)
  }
  function irAOt(key) {
    setOt(key)
    setTarea(null)
    setPersona(null)
  }
  function irATarea(key) {
    setTarea(key)
    setPersona(null)
  }

  if (!filas.length) {
    return <div className="hp-vacio">No hay horas por OT cargadas todavía.</div>
  }

  return (
    <div className="hp-horas-ot">
      <div className="hp-graf-card">
        <h3 className="hp-graf-titulo">Horas con OT vs. sin OT por período</h3>
        <GraficoApilado datos={porPeriodo} />
        {anomalas > 0 && (
          <div className="hp-nota">
            {anomalas} registro{anomalas === 1 ? '' : 's'} excluido{anomalas === 1 ? '' : 's'} de los totales por ser
            cargas anómalas (más de 16h en un día — costeo de proyecto, no asistencia real).
          </div>
        )}
      </div>

      <div className="hp-drill-header">
        <div className="hp-breadcrumb">
          <button className={!ot ? 'active' : ''} onClick={() => irAPeriodo(periodo)}>
            {fmtPeriodo(periodo)}
          </button>
          {ot !== null && (
            <>
              <span>›</span>
              <button className={!tarea ? 'active' : ''} onClick={() => irAOt(ot)}>
                {grupoOt?.ot || 'Sin OT'}
              </button>
            </>
          )}
          {tarea !== null && (
            <>
              <span>›</span>
              <button className={!persona ? 'active' : ''} onClick={() => irATarea(tarea)}>
                {tarea}
              </button>
            </>
          )}
          {persona !== null && (
            <>
              <span>›</span>
              <button className="active">{grupoPersona?.nombre}</button>
            </>
          )}
        </div>

        <select className="hp-select" value={periodo} onChange={(e) => irAPeriodo(e.target.value)}>
          {periodos.map((p) => (
            <option key={p} value={p}>
              {fmtPeriodo(p)}
            </option>
          ))}
        </select>
      </div>

      {persona !== null && grupoPersona ? (
        <table className="hp-tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Horas</th>
            </tr>
          </thead>
          <tbody>
            {diasPersona.map((f, i) => (
              <tr key={i}>
                <td>{f.fecha}</td>
                <td>{Number(f.horas).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : tarea !== null ? (
        <table className="hp-tabla hp-tabla-clic">
          <thead>
            <tr>
              <th>Persona</th>
              <th>Empresa</th>
              <th>Horas</th>
            </tr>
          </thead>
          <tbody>
            {porPersona.map((g) => (
              <tr key={g.empresa + '|' + g.legajo} onClick={() => setPersona(g.empresa + '|' + g.legajo)}>
                <td>{g.nombre}</td>
                <td>{nombreEmpresa(g.empresa)}</td>
                <td>{g.horas.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : ot !== null ? (
        <table className="hp-tabla hp-tabla-clic">
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Horas</th>
            </tr>
          </thead>
          <tbody>
            {porTarea.map((g) => (
              <tr key={g.operacion} onClick={() => irATarea(g.operacion)}>
                <td>{g.operacion}</td>
                <td>{g.horas.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="hp-tabla hp-tabla-clic">
          <thead>
            <tr>
              <th>OT</th>
              <th>Cliente</th>
              <th>Proyecto</th>
              <th>Horas</th>
            </tr>
          </thead>
          <tbody>
            {porOt.map((g) => (
              <tr key={g.ot || '__sin_ot__'} onClick={() => irAOt(g.ot || '__sin_ot__')}>
                <td>{g.ot || 'Sin OT'}</td>
                <td>{g.cliente || '—'}</td>
                <td>{g.proyecto || '—'}</td>
                <td>{g.horas.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

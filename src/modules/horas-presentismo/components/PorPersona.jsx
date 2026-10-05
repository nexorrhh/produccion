import { useMemo, useState } from 'react'
import { fmtPeriodo, nombreEmpresa } from '../lib/periodo'
import { tipoPuesto } from '../lib/clasificacionPuesto'
import {
  pctPresentismo,
  pctCumplimientoHoras,
  pctAusentismo,
  colorAusentismo,
  fmtPct,
  fmtHoras,
} from '../lib/calculoIndicadores'
import { agruparDetallePorDia, ESTADO_DIA_INFO } from '../lib/estadoDia'

const TIPOS = [
  { key: 'mensual', label: 'Mensuales' },
  { key: 'quincenal', label: 'Quincenales' },
  { key: 'sin_asignar', label: 'Sin clasificar' },
]

function norm(s) {
  return (s || '').toLowerCase()
}

// Calendario de estado diario — reutilizado también por Ficha (misma
// persona, distinta pantalla de entrada).
export function DetalleDiario({ dias }) {
  if (!dias.length) return <div className="hp-vacio-chico">No hay detalle diario cargado para este período.</div>
  return (
    <div className="hp-calendario">
      {dias.map((d) => {
        const info = ESTADO_DIA_INFO[d.estado]
        return (
          <div key={d.fecha} className="hp-dia-celda" style={{ borderColor: info.color }} title={`${d.fecha} — ${info.label}`}>
            <div className="hp-dia-fecha">{d.fecha.slice(8, 10)}</div>
            <div className="hp-dia-letra" style={{ color: info.color }}>
              {info.letra}
            </div>
            <div className="hp-dia-horas">{fmtHoras(d.hs_reales)}h</div>
          </div>
        )
      })}
    </div>
  )
}

export function PorPersona({ horasMensual, horasDetalle, empleados, mapaClasif }) {
  const periodos = useMemo(() => [...new Set(horasMensual.map((f) => f.periodo))].sort().reverse(), [horasMensual])
  const [periodoSel, setPeriodoSel] = useState('')
  const periodo = periodoSel || periodos[0] || ''
  const [empresa, setEmpresa] = useState('')
  const [tipo, setTipo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)

  const empleadosPorLegajo = useMemo(() => {
    const mapa = new Map()
    empleados.forEach((e) => mapa.set(e.empresa + '|' + e.legajo, e))
    return mapa
  }, [empleados])

  const filas = useMemo(() => {
    return horasMensual
      .filter((f) => f.periodo === periodo)
      .map((f) => {
        const emp = empleadosPorLegajo.get(f.empresa + '|' + f.legajo)
        return {
          ...f,
          _tipo: emp ? tipoPuesto(emp.desc_puesto, mapaClasif) : 'sin_asignar',
          pctPresentismo: pctPresentismo(f),
          pctCumplimiento: pctCumplimientoHoras(f),
          pctAusentismo: pctAusentismo(f),
        }
      })
      .filter((f) => !empresa || f.empresa === empresa)
      .filter((f) => !tipo || f._tipo === tipo)
      .filter((f) => !busqueda || norm((f.apellido || '') + ' ' + (f.nombre || '')).includes(norm(busqueda)))
      .sort((a, b) => (a.apellido || '').localeCompare(b.apellido || ''))
  }, [horasMensual, periodo, empleadosPorLegajo, mapaClasif, empresa, tipo, busqueda])

  const filaSel = seleccionado ? filas.find((f) => f.empresa + '|' + f.legajo === seleccionado) : null

  const diasSel = useMemo(() => {
    if (!filaSel) return []
    return agruparDetallePorDia(horasDetalle.filter((f) => f.legajo === filaSel.legajo && f.periodo === periodo))
  }, [filaSel, horasDetalle, periodo])

  if (!periodos.length) {
    return <div className="hp-vacio">No hay datos de horas mensuales cargados todavía.</div>
  }

  return (
    <div className="hp-personas">
      <div className="hp-filtros">
        <select
          className="hp-select"
          value={periodo}
          onChange={(e) => {
            setPeriodoSel(e.target.value)
            setSeleccionado(null)
          }}
        >
          {periodos.map((p) => (
            <option key={p} value={p}>
              {fmtPeriodo(p)}
            </option>
          ))}
        </select>
        <input
          className="hp-input-busqueda"
          placeholder="Buscar por nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="hp-pills">
          <button className={empresa === '' ? 'active' : ''} onClick={() => setEmpresa('')}>
            Todos
          </button>
          <button className={empresa === 'CIMOMET' ? 'active' : ''} onClick={() => setEmpresa('CIMOMET')}>
            Cimomet
          </button>
          <button className={empresa === 'COMOING' ? 'active' : ''} onClick={() => setEmpresa('COMOING')}>
            Co.mo.ing
          </button>
        </div>
        <div className="hp-pills">
          <button className={tipo === '' ? 'active' : ''} onClick={() => setTipo('')}>
            Todos
          </button>
          {TIPOS.map((t) => (
            <button key={t.key} className={tipo === t.key ? 'active' : ''} onClick={() => setTipo(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filas.length === 0 ? (
        <div className="hp-vacio">No hay nadie que coincida con estos filtros.</div>
      ) : (
        <table className="hp-tabla hp-tabla-clic">
          <thead>
            <tr>
              <th>Legajo</th>
              <th>Nombre</th>
              <th>Empresa</th>
              <th>Departamento</th>
              <th>Presentismo</th>
              <th>Cumplimiento</th>
              <th>Ausentismo</th>
              <th>Extra 50%</th>
              <th>Hs. no justif.</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const clave = f.empresa + '|' + f.legajo
              return (
                <tr
                  key={clave}
                  className={seleccionado === clave ? 'hp-fila-activa' : ''}
                  onClick={() => setSeleccionado(seleccionado === clave ? null : clave)}
                >
                  <td>{f.legajo}</td>
                  <td>{(f.apellido || '') + ', ' + (f.nombre || '')}</td>
                  <td>{nombreEmpresa(f.empresa)}</td>
                  <td>{f.departamento || '—'}</td>
                  <td>{fmtPct(f.pctPresentismo)}</td>
                  <td>{fmtPct(f.pctCumplimiento)}</td>
                  <td style={{ color: colorAusentismo(f.pctAusentismo) }}>{fmtPct(f.pctAusentismo)}</td>
                  <td>{fmtHoras(f.hs_extra50)}</td>
                  <td>{fmtHoras(f.hs_no_justificadas)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {filaSel && (
        <div className="hp-detalle-dia-card">
          <h3 className="hp-seccion-titulo">
            Detalle de {filaSel.apellido}, {filaSel.nombre} — {fmtPeriodo(periodo)}
          </h3>
          <DetalleDiario dias={diasSel} />
        </div>
      )}
    </div>
  )
}

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
import { construirDetalleDiario, ESTADO_DIA_INFO, fmtHorasMin } from '../lib/estadoDia'

const TIPOS = [
  { key: 'mensual', label: 'Mensuales' },
  { key: 'quincenal', label: 'Quincenales' },
  { key: 'sin_asignar', label: 'Sin clasificar' },
]

function norm(s) {
  return (s || '').toLowerCase()
}

// Leyenda de todos los estados posibles de un día — se muestra siempre
// completa (igual que Tablero_RRHH) para que sirva de referencia de
// color/sigla aunque ese día en particular no haya aparecido todavía.
function LeyendaEstados() {
  return (
    <div className="hp-leyenda">
      {Object.entries(ESTADO_DIA_INFO).map(([key, info]) => (
        <span key={key} className="hp-leyenda-chip" style={{ color: info.color, borderColor: info.color }}>
          {info.letra} {info.label}
        </span>
      ))}
    </div>
  )
}

function KpisPersona({ dias }) {
  const presentes = dias.filter((d) => d.estado === 'ok' || d.estado === 'extra' || d.estado === 'parcial')
  const sabados = presentes.filter((d) => d.diaSemana === 'Sáb').length
  const semana = presentes.length - sabados
  const horasReales = dias.reduce((s, d) => s + d.hs_reales, 0)
  const balance = dias.reduce((s, d) => s + d.balance, 0)
  const diasConExtra = dias.filter((d) => d.extra50 > 0 || d.extra100 > 0)
  const totalExtra50 = dias.reduce((s, d) => s + d.extra50, 0)
  const totalExtra100 = dias.reduce((s, d) => s + d.extra100, 0)

  return (
    <div className="hp-kpis-persona">
      <div className="hp-kpi-persona">
        <div className="hp-kpi-persona-valor">{presentes.length}</div>
        <div className="hp-kpi-persona-label">Días presente</div>
        <div className="hp-kpi-persona-sub">
          {semana} de semana{sabados ? ` · ${sabados} sábado${sabados > 1 ? 's' : ''}` : ''}
        </div>
      </div>
      <div className="hp-kpi-persona">
        <div className="hp-kpi-persona-valor">{fmtHorasMin(horasReales)}</div>
        <div className="hp-kpi-persona-label">Horas reales</div>
        <div className="hp-kpi-persona-sub">Tiempo total en el trabajo</div>
      </div>
      <div className="hp-kpi-persona">
        <div className="hp-kpi-persona-valor">{balance >= 0 ? '+' : ''}{fmtHorasMin(balance)}</div>
        <div className="hp-kpi-persona-label">Balance del período</div>
        <div className="hp-kpi-persona-sub">
          {fmtHorasMin(dias.reduce((s, d) => s + d.hs_trabajadas, 0))} trabajadas de{' '}
          {fmtHorasMin(dias.reduce((s, d) => s + d.hs_esperadas, 0))} esperadas
        </div>
      </div>
      <div className="hp-kpi-persona hp-kpi-persona-extra">
        <div className="hp-kpi-persona-valor">{fmtHorasMin(totalExtra50 + totalExtra100)}</div>
        <div className="hp-kpi-persona-label">Horas extra ({diasConExtra.length} días)</div>
        <div className="hp-kpi-persona-sub">
          {totalExtra50 > 0 && `${fmtHorasMin(totalExtra50)} al 50%`}
          {totalExtra50 > 0 && totalExtra100 > 0 && ' · '}
          {totalExtra100 > 0 && `${fmtHorasMin(totalExtra100)} al 100%`}
        </div>
      </div>
    </div>
  )
}

function TablaDetalleDiario({ dias }) {
  const maxOt = Math.max(1, ...dias.map((d) => d.horasOt))
  return (
    <table className="hp-tabla hp-tabla-dias">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Reales</th>
          <th>Esperadas</th>
          <th>Balance</th>
          <th>Trabajadas</th>
          <th>Extra 50%</th>
          <th>Extra 100%</th>
          <th>Justif.</th>
          <th>OT (Capataz)</th>
        </tr>
      </thead>
      <tbody>
        {dias
          .filter((d) => d.estado !== 'libre')
          .map((d) => {
            const info = ESTADO_DIA_INFO[d.estado]
            return (
              <tr key={d.fecha}>
                <td>
                  {d.fecha.slice(8, 10)}/{d.fecha.slice(5, 7)} {d.diaSemana}
                </td>
                <td>
                  <span className="hp-chip" style={{ color: info.color, borderColor: info.color }}>
                    {info.letra} {info.label}
                  </span>
                  {d.motivoAusencia && <span className="hp-dia-motivo"> — {d.motivoAusencia}</span>}
                </td>
                <td>{fmtHoras(d.hs_reales)}</td>
                <td>{fmtHoras(d.hs_esperadas)}</td>
                <td style={{ color: d.balance < 0 ? 'var(--red)' : d.balance > 0 ? 'var(--green)' : undefined }}>
                  {d.balance >= 0 ? '±' : ''}
                  {fmtHoras(d.balance)}
                </td>
                <td>{fmtHoras(d.hs_trabajadas)}</td>
                <td>{d.extra50 > 0 ? fmtHoras(d.extra50) : '—'}</td>
                <td>{d.extra100 > 0 ? fmtHoras(d.extra100) : '—'}</td>
                <td>{d.hs_justificadas > 0 ? fmtHoras(d.hs_justificadas) : '—'}</td>
                <td>
                  {d.horasOt > 0 ? (
                    <div className="hp-ot-bar-celda">
                      <div className="hp-ot-bar-track">
                        <div className="hp-ot-bar-fill" style={{ width: (d.horasOt / maxOt) * 100 + '%' }} />
                      </div>
                      <span>{fmtHoras(d.horasOt)}</span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            )
          })}
      </tbody>
    </table>
  )
}

// Calendario compacto (vistazo rápido) + KPIs + leyenda + tabla completa —
// reutilizado también por Ficha (misma persona, distinta pantalla de
// entrada).
export function DetalleDiario({ dias }) {
  if (!dias.length) return <div className="hp-vacio-chico">No hay detalle diario cargado para este período.</div>
  const conMovimiento = dias.filter((d) => d.estado !== 'libre')
  if (!conMovimiento.length) {
    return <div className="hp-vacio-chico">Sin días laborables cargados todavía en este período.</div>
  }
  return (
    <>
      <KpisPersona dias={dias} />
      <LeyendaEstados />
      <div className="hp-calendario">
        {conMovimiento.map((d) => {
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
      <TablaDetalleDiario dias={dias} />
    </>
  )
}

export function PorPersona({ horasMensual, horasDetalle, horasOt, tardanzas, mapaCategoriaAusencia, empleados, mapaClasif }) {
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

  const delPeriodoConTipo = useMemo(() => {
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
  }, [horasMensual, periodo, empleadosPorLegajo, mapaClasif])

  const contarEmpresa = (emp) => (emp ? delPeriodoConTipo.filter((f) => f.empresa === emp).length : delPeriodoConTipo.length)
  const contarTipo = (t) => delPeriodoConTipo.filter((f) => f._tipo === t).length

  const filas = useMemo(() => {
    return delPeriodoConTipo
      .filter((f) => !empresa || f.empresa === empresa)
      .filter((f) => !tipo || f._tipo === tipo)
      .filter((f) => !busqueda || norm((f.apellido || '') + ' ' + (f.nombre || '')).includes(norm(busqueda)))
      .sort((a, b) => (a.apellido || '').localeCompare(b.apellido || ''))
  }, [delPeriodoConTipo, empresa, tipo, busqueda])

  const filaSel = seleccionado ? filas.find((f) => f.empresa + '|' + f.legajo === seleccionado) : null

  const diasSel = useMemo(() => {
    if (!filaSel) return []
    return construirDetalleDiario({
      periodo,
      legajo: filaSel.legajo,
      horasDetalle: horasDetalle.filter((f) => f.legajo === filaSel.legajo && f.periodo === periodo),
      horasOt,
      tardanzas: tardanzas.filter((t) => t.empresa === filaSel.empresa && t.periodo === periodo),
      esMensual: filaSel._tipo === 'mensual',
      mapaCategoriaAusencia,
    })
  }, [filaSel, horasDetalle, horasOt, tardanzas, periodo, mapaCategoriaAusencia])

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
          placeholder="Buscar por legajo o nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="hp-pills">
          <button className={empresa === '' ? 'active' : ''} onClick={() => setEmpresa('')}>
            Todos <b>{contarEmpresa('')}</b>
          </button>
          <button className={empresa === 'CIMOMET' ? 'active' : ''} onClick={() => setEmpresa('CIMOMET')}>
            Cimomet <b>{contarEmpresa('CIMOMET')}</b>
          </button>
          <button className={empresa === 'COMOING' ? 'active' : ''} onClick={() => setEmpresa('COMOING')}>
            Co.mo.ing <b>{contarEmpresa('COMOING')}</b>
          </button>
        </div>
        <div className="hp-pills">
          <button className={tipo === '' ? 'active' : ''} onClick={() => setTipo('')}>
            Todos <b>{delPeriodoConTipo.length}</b>
          </button>
          {TIPOS.map((t) => (
            <button key={t.key} className={tipo === t.key ? 'active' : ''} onClick={() => setTipo(t.key)}>
              {t.label} <b>{contarTipo(t.key)}</b>
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
            Detalle — {filaSel.apellido}, {filaSel.nombre} · {fmtPeriodo(periodo)} ·{' '}
            {filaSel._tipo === 'mensual' ? 'Mensual' : filaSel._tipo === 'quincenal' ? 'Quincenal' : 'Sin clasificar'}
          </h3>
          <DetalleDiario dias={diasSel} />
        </div>
      )}
    </div>
  )
}

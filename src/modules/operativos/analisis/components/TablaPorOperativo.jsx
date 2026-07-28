import { useMemo, useState } from 'react'
import { colorPct, diaDe, fmtFecha } from '../lib/formatoFecha'

const LIMITE = 10

function BarraPct({ pct }) {
  const color = colorPct(pct)
  return (
    <div className="an-barra">
      <div className="an-barra-track">
        <div className="an-barra-fill" style={{ width: pct + '%', background: color }} />
      </div>
      <span className="an-barra-pct" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

export function TablaPorOperativo({ filas }) {
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState(false)

  const filtradas = useMemo(() => {
    let lista = [...filas]
    if (filtroTipo === 'Sabado') lista = lista.filter((f) => f.tipo === 'Sabado')
    if (filtroTipo === 'domfer') lista = lista.filter((f) => f.tipo !== 'Sabado')
    if (busqueda) {
      const txt = busqueda.toLowerCase()
      lista = lista.filter(
        (f) => fmtFecha(f.fecha).toLowerCase().includes(txt) || (f.dia_semana || '').toLowerCase().includes(txt)
      )
    }
    return lista.sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [filas, filtroTipo, busqueda])

  const visibles = expandido ? filtradas : filtradas.slice(0, LIMITE)

  return (
    <div>
      <div className="an-tabla-toolbar">
        <div className="op-chip-toggle">
          <button className={filtroTipo === 'todos' ? 'active' : ''} onClick={() => setFiltroTipo('todos')}>
            Todos
          </button>
          <button className={filtroTipo === 'Sabado' ? 'active' : ''} onClick={() => setFiltroTipo('Sabado')}>
            Sábados
          </button>
          <button className={filtroTipo === 'domfer' ? 'active' : ''} onClick={() => setFiltroTipo('domfer')}>
            Dom. y Feriados
          </button>
        </div>
        <input
          type="text"
          className="an-busqueda"
          placeholder="Buscar por fecha o día…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="an-table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Día</th>
              <th>Tipo</th>
              <th className="center">Convocados</th>
              <th className="center">Presentes</th>
              <th className="center">Ausentes</th>
              <th className="center">No conv.</th>
              <th>Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length ? (
              visibles.map((f) => (
                <tr key={f.fecha}>
                  <td>{fmtFecha(f.fecha)}</td>
                  <td>{f.dia_semana || diaDe(f.fecha)}</td>
                  <td>{f.tipo === 'Sabado' ? 'Sábado' : f.tipo}</td>
                  <td className="center">{f.convocados}</td>
                  <td className="center">{f.presentes}</td>
                  <td className="center">{f.ausentes}</td>
                  <td className="center">{f.no_convocados}</td>
                  <td>
                    <BarraPct pct={Math.round(f.pct_cumplimiento)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="an-vacio">
                  Sin operativos para este filtro
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtradas.length > LIMITE && (
        <div className="an-ver-mas">
          <button className="btn" onClick={() => setExpandido((e) => !e)}>
            {expandido ? 'Ver menos' : `Ver más — ${filtradas.length - LIMITE} operativos más`}
          </button>
        </div>
      )}
    </div>
  )
}

import { fmtFecha } from '../lib/formatoFecha'

// Mismos colores que la dona de "Asistencia acumulada" (Presentes/
// Ausentes/No convocados), + gris para "Convocado" (todavía sin marcar
// por la herramienta de asistencia).
const SITUACION_COLOR = {
  Presente: '#1baf7a',
  Ausente: '#eb6834',
  'No convocado': '#2a78d6',
  Convocado: '#94a3b8',
}

export function DetalleOperativoModal({ fecha, detalle, cargando, error, onCerrar }) {
  const filas = detalle?.citacion_detalle
    ? [...detalle.citacion_detalle].sort((a, b) =>
        (a.apellido_y_nombre || '').localeCompare(b.apellido_y_nombre || '')
      )
    : []

  return (
    <div className="det-overlay" onClick={onCerrar}>
      <div className="det-panel" onClick={(e) => e.stopPropagation()}>
        <div className="det-header">
          <div>
            <div className="det-titulo">{fmtFecha(fecha)}</div>
            {detalle && (
              <div className="det-sub">
                {detalle.dia_semana} · {detalle.tipo === 'Sabado' ? 'Sábado' : detalle.tipo}
              </div>
            )}
          </div>
          <button type="button" className="btn btn-ghost" onClick={onCerrar}>
            Cerrar
          </button>
        </div>

        {cargando && <div className="an-vacio">Cargando…</div>}
        {error && <div className="an-error-banner">{error}</div>}
        {!cargando && !error && !filas.length && <div className="an-vacio">No hay datos para esta fecha.</div>}

        {!cargando && !error && filas.length > 0 && (
          <div className="det-tabla-wrap">
            <table className="det-tabla">
              <thead>
                <tr>
                  <th>Legajo</th>
                  <th>Apellido y nombre</th>
                  <th>Empresa</th>
                  <th>Puesto</th>
                  <th className="center">Turno</th>
                  <th>Situación</th>
                  <th>Nº OT</th>
                  <th>Trabajo</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((d) => {
                  const turno =
                    d.turno_manana && d.turno_tarde ? 'Ambos' : d.turno_manana ? '07-12' : d.turno_tarde ? '12-16' : '—'
                  const color = SITUACION_COLOR[d.situacion] || '#94a3b8'
                  return (
                    <tr key={d.legajo + '|' + d.empresa}>
                      <td>
                        <span className="op-legajo-num">{d.legajo}</span>
                      </td>
                      <td className="op-nombre-main">{d.apellido_y_nombre}</td>
                      <td>
                        {d.empresa === 'CIMOMET' ? (
                          <span className="badge badge-cim">Cimomet</span>
                        ) : (
                          <span className="badge badge-com">Co.mo.ing</span>
                        )}
                      </td>
                      <td>{d.desc_puesto || '—'}</td>
                      <td className="center">{turno}</td>
                      <td>
                        <span className="det-situacion" style={{ background: color + '22', color }}>
                          {d.situacion || 'Convocado'}
                        </span>
                      </td>
                      <td>{d.ot || '—'}</td>
                      <td>{d.trabajo || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

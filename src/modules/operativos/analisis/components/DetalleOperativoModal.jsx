import { fmtFecha } from '../lib/formatoFecha'
import { tipoPago } from '../../lib/clasificacion'
import { TIPOS_PUESTO } from '../../lib/tiposPuesto'

// Mismos colores que la dona de "Asistencia acumulada" (Presentes/
// Ausentes/No convocados), + gris para "Convocado" (todavía sin marcar
// por la herramienta de asistencia).
const SITUACION_COLOR = {
  Presente: '#1baf7a',
  Ausente: '#eb6834',
  'No convocado': '#2a78d6',
  Convocado: '#94a3b8',
}

function turnoDe(d) {
  return d.turno_manana && d.turno_tarde ? 'Ambos' : d.turno_manana ? '07-12' : d.turno_tarde ? '12-16' : '—'
}

export function DetalleOperativoModal({ fecha, detalle, mapaClasif, cargando, error, onCerrar }) {
  const filas = detalle?.citacion_detalle
    ? [...detalle.citacion_detalle].sort((a, b) =>
        (a.apellido_y_nombre || '').localeCompare(b.apellido_y_nombre || '')
      )
    : []

  // El listado para entregar a supervisores es de los CONVOCADOS
  // (se excluye a quien vino sin estar citado — "No convocado" — porque
  // no formaba parte de la convocatoria original). No se asume "Ausente"
  // para nadie: si todavía no se marcó asistencia, situacion sigue siendo
  // "Convocado" y así se imprime, tal cual.
  const convocados = filas.filter((d) => d.situacion !== 'No convocado')
  const gruposImpresion = TIPOS_PUESTO.map((t) => ({
    ...t,
    items: convocados.filter((d) => tipoPago(d, mapaClasif) === t.key),
  })).filter((g) => g.items.length)

  function imprimir() {
    window.print()
  }

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
          <div className="det-header-acciones">
            {convocados.length > 0 && (
              <button type="button" className="btn" onClick={imprimir}>
                Imprimir listado de convocados
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
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
                      <td className="center">{turnoDe(d)}</td>
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

      {/* Vista de impresión — oculta en pantalla, visible solo al imprimir
          (ver .det-print-only en analisis.css). Optimizada para entregar
          en papel: agrupada Quincenal/Mensual/Sin clasificar, ordenada por
          apellido, sin columnas que no le sirven a un supervisor en mano
          (sin cumplimiento, sin "situación" pendiente de marcar). */}
      {detalle && (
        <div className="det-print-only">
          <div className="det-print-header">
            <div className="det-print-empresa">Cimomet S.A. &amp; Co.mo.ing S.R.L.</div>
            <h1>Listado de convocados</h1>
            <div className="det-print-sub">
              {fmtFecha(fecha)} · {detalle.dia_semana} · {detalle.tipo === 'Sabado' ? 'Sábado' : detalle.tipo} ·{' '}
              {convocados.length} persona{convocados.length === 1 ? '' : 's'}
            </div>
          </div>

          {gruposImpresion.map((g) => (
            <div className="det-print-grupo" key={g.key}>
              <div className="det-print-grupo-titulo">
                {g.labelPlural} ({g.items.length})
              </div>
              <table className="det-print-tabla">
                <thead>
                  <tr>
                    <th>Legajo</th>
                    <th>Apellido y nombre</th>
                    <th>Empresa</th>
                    <th>Puesto</th>
                    <th>Turno</th>
                    <th>Nº OT</th>
                    <th>Trabajo</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((d) => (
                    <tr key={d.legajo + '|' + d.empresa}>
                      <td>{d.legajo}</td>
                      <td>{d.apellido_y_nombre}</td>
                      <td>{d.empresa === 'CIMOMET' ? 'Cimomet' : 'Co.mo.ing'}</td>
                      <td>{d.desc_puesto || '—'}</td>
                      <td>{turnoDe(d)}</td>
                      <td>{d.ot || ''}</td>
                      <td>{d.trabajo || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

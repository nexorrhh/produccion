import { useValidacionOperativos } from './hooks/useValidacionOperativos'

function fmtFecha(f) {
  return new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function tipoLabel(tipo) {
  return tipo === 'Sabado' ? 'Sábado' : tipo
}

export function ValidacionOperativos({ onAbrir }) {
  const { pendientes, cargando, error } = useValidacionOperativos()

  if (cargando) return <div className="noti-vacio">Cargando…</div>
  if (error) return <div className="noti-error">{error}</div>
  if (!pendientes.length) {
    return <div className="noti-vacio">No hay citaciones pendientes de validación ni rechazadas.</div>
  }

  return (
    <div className="op-table-container val-tabla-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th className="center">Personas</th>
            <th>Cargado por</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {pendientes.map((c) => (
            <tr key={c.id} className="val-fila" onClick={() => onAbrir(c.fecha)}>
              <td className="op-nombre-main">{fmtFecha(c.fecha)}</td>
              <td>
                {tipoLabel(c.tipo)} · {c.dia_semana}
              </td>
              <td className="center">{c.cantidad}</td>
              <td>{c.creadoPorNombre}</td>
              <td>
                {c.estado === 'rechazada' ? (
                  <span className="val-estado val-estado-rechazada" title={c.comentario_rechazo || ''}>
                    Rechazada{c.rechazadoPorNombre ? ' por ' + c.rechazadoPorNombre : ''}
                  </span>
                ) : (
                  <span className="val-estado val-estado-pendiente">Pendiente de validación</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

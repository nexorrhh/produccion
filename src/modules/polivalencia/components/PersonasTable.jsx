function fmtFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR')
}

export function PersonasTable({ filas, onAbrir }) {
  if (!filas.length) {
    return <div className="pv-table-container pv-vacio">No hay personal activo para mostrar.</div>
  }

  return (
    <div className="pv-table-container">
      <table>
        <thead>
          <tr>
            <th style={{ width: 70 }}>Legajo</th>
            <th>Apellido y nombre</th>
            <th style={{ width: 90 }}>Empresa</th>
            <th>Puesto</th>
            <th style={{ width: 90 }} className="center">
              Asignados
            </th>
            <th>Estado</th>
            <th style={{ width: 130 }}>Última confirmación</th>
            <th style={{ width: 90 }}></th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.empleado.legajo + '|' + f.empleado.empresa} className={f.estado.alerta ? 'pv-row-alerta' : ''}>
              <td>
                <span className="pv-legajo-num">{f.empleado.legajo}</span>
              </td>
              <td className="pv-nombre-main">{f.empleado.apellido_y_nombre}</td>
              <td>
                {f.empleado.empresa === 'CIMOMET' ? (
                  <span className="badge badge-cim">Cimomet</span>
                ) : (
                  <span className="badge badge-com">Co.mo.ing</span>
                )}
              </td>
              <td>{f.empleado.desc_puesto || '—'}</td>
              <td className="center">{f.cantidadAsignados}</td>
              <td>
                <span className={'pv-estado-badge pv-' + f.estado.estado}>{f.estado.label}</span>
              </td>
              <td>{fmtFecha(f.persona?.fecha_confirmacion || f.persona?.fecha_definicion)}</td>
              <td>
                <button className="btn" onClick={() => onAbrir(f)}>
                  Ver / Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

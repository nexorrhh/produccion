// Grilla completa: filas = personas, columnas = puestos/tareas del
// catálogo, cada celda muestra el nivel (o "—" si no lo cubre).
export function MatrizCompleta({ personal, puestos, nivelPorCelda }) {
  if (!puestos.length) {
    return <div className="pv-vacio">Todavía no hay puestos/tareas cargados en Polivalencia.</div>
  }
  if (!personal.length) {
    return <div className="pv-vacio">No hay personal activo para mostrar.</div>
  }

  return (
    <div className="pv-matriz-scroll">
      <table className="pv-matriz">
        <thead>
          <tr>
            <th className="pv-matriz-sticky">Apellido y nombre</th>
            {puestos.map((p) => (
              <th key={p.id}>{p.nombre}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {personal.map((e) => {
            const k = e.legajo + '|' + e.empresa
            return (
              <tr key={k}>
                <td className="pv-matriz-sticky pv-nombre-main">{e.apellido_y_nombre}</td>
                {puestos.map((p) => {
                  const nivel = nivelPorCelda.get(k + '|' + p.id)
                  return (
                    <td key={p.id} className="center">
                      {nivel ? <span className={'pv-estado-badge pv-nivel-' + nivel.orden}>{nivel.nombre}</span> : '—'}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

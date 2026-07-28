// Por cada puesto/tarea: quién lo puede cubrir y con qué nivel de
// autonomía, para responder "si falta un X, ¿quién lo reemplaza y qué tan
// bien?".
export function CoberturaPorPuesto({ cobertura }) {
  if (!cobertura.length) {
    return <div className="pv-vacio">Todavía no hay puestos/tareas cargados en Polivalencia.</div>
  }

  return (
    <div className="pv-cobertura">
      {cobertura.map(({ puesto, grupos, total }) => (
        <div className="pv-cobertura-puesto" key={puesto.id}>
          <div className="pv-cobertura-puesto-header">
            <span>{puesto.nombre}</span>
            <span className="g-count">
              {total} persona{total === 1 ? '' : 's'}
            </span>
          </div>
          {total === 0 ? (
            <div className="pv-cobertura-vacio">Nadie puede cubrir este puesto todavía.</div>
          ) : (
            grupos.map(({ nivel, personas }) => (
              <div className="pv-cobertura-grupo" key={nivel.id}>
                <span className={'pv-estado-badge pv-nivel-' + nivel.orden}>{nivel.nombre}</span>
                <span className="pv-cobertura-nombres">
                  {personas.map((p) => p.apellido_y_nombre).join(' · ')}
                </span>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  )
}

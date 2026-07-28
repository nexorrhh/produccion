import { useState } from 'react'
import { tipoPago } from '../lib/clasificacion'

export function DiagPanel({ empleados, mapaClasif }) {
  const [open, setOpen] = useState(false)

  const puestos = [...new Set(empleados.map((e) => e.desc_puesto).filter(Boolean))].sort()
  const conteo = {}
  empleados.forEach((e) => {
    const p = e.desc_puesto || '(sin puesto)'
    conteo[p] = (conteo[p] || 0) + 1
  })

  const mensual = [],
    quincenal = [],
    sinAsignar = []
  puestos.forEach((p) => {
    const t = tipoPago({ desc_puesto: p }, mapaClasif)
    ;(t === 'mensual' ? mensual : t === 'quincenal' ? quincenal : sinAsignar).push(p)
  })

  const columnas = [
    { clase: 'q', titulo: 'Quincenal', lista: quincenal },
    { clase: 'm', titulo: 'Mensual', lista: mensual },
    { clase: 'x', titulo: 'Sin clasificar', lista: sinAsignar },
  ]

  return (
    <div className="op-diag">
      <div className={'op-diag-head' + (open ? ' open' : '')} onClick={() => setOpen((o) => !o)}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 11H3v10h6V11zM21 3h-6v18h6V3zM15 7H9v14h6V7z" />
        </svg>
        Clasificación de puestos (revisá acá qué quedó en cada grupo)
        <svg className="op-chev" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {open && (
        <div className="op-diag-body open">
          <div className="op-diag-cols">
            {columnas.map((c) => (
              <div className={'op-diag-col ' + c.clase} key={c.clase}>
                <h4>
                  {c.titulo} ({c.lista.length})
                </h4>
                <ul>
                  {c.lista.length ? (
                    c.lista.map((p) => (
                      <li key={p}>
                        {p}
                        <span className="n">{conteo[p] || 0}</span>
                      </li>
                    ))
                  ) : (
                    <li style={{ color: 'var(--text3)' }}>—</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'

const ACCENTS = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n' }

function norm(s) {
  return (s || '')
    .toLowerCase()
    .split('')
    .map((ch) => ACCENTS[ch] || ch)
    .join('')
}

const LIMITE = 50

export function SelectorReemplazo({ personal, cargando, seleccionado, onSeleccionar, onQuitar }) {
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)

  const coincidencias = useMemo(() => {
    if (!query.trim()) return personal.slice(0, LIMITE)
    const txt = norm(query)
    return personal.filter((p) => norm(p.apellido_y_nombre).includes(txt)).slice(0, LIMITE)
  }, [personal, query])

  if (seleccionado) {
    return (
      <div className="bp-reemplazo-elegido">
        <span>
          {seleccionado.nombre} ·{' '}
          {seleccionado.empresa === 'CIMOMET' ? 'Cimomet' : 'Co.mo.ing'} · legajo {seleccionado.legajo}
        </span>
        <button type="button" className="btn btn-ghost" onClick={onQuitar}>
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="bp-reemplazo-buscador">
      <input
        type="text"
        placeholder={cargando ? 'Cargando personal de baja…' : 'Buscar por apellido y nombre…'}
        value={query}
        disabled={cargando}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
      />
      {abierto && (
        <div className="bp-reemplazo-lista">
          {coincidencias.length ? (
            coincidencias.map((p) => (
              <button
                type="button"
                key={p.legajo + '|' + p.empresa}
                className="bp-reemplazo-item"
                onMouseDown={() => {
                  onSeleccionar(p)
                  setQuery('')
                  setAbierto(false)
                }}
              >
                {p.apellido_y_nombre}
                <span className="bp-reemplazo-item-sub">
                  {p.empresa === 'CIMOMET' ? 'Cimomet' : 'Co.mo.ing'} · legajo {p.legajo}
                </span>
              </button>
            ))
          ) : (
            <div className="bp-reemplazo-vacio">Sin coincidencias.</div>
          )}
        </div>
      )}
    </div>
  )
}

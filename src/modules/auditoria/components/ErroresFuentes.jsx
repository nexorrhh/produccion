import { useState } from 'react'

// Muestra qué tablas/columnas de cimomet-v2 no se pudieron leer, con el
// mensaje real de Supabase — para poder corregir el nombre contra el error
// real en vez de adivinar dos veces.
export function ErroresFuentes({ errores }) {
  const [abierto, setAbierto] = useState(false)
  if (!errores.length) return null

  return (
    <div className="aud-errores">
      <button type="button" className="aud-errores-toggle" onClick={() => setAbierto((v) => !v)}>
        ⚠ {errores.length} fuente{errores.length > 1 ? 's' : ''} no se pudo{errores.length > 1 ? 'ieron' : ''} leer —{' '}
        {abierto ? 'ocultar' : 'ver detalle'}
      </button>
      {abierto && (
        <ul className="aud-errores-lista">
          {errores.map((e) => (
            <li key={e.tabla}>
              <b>{e.tabla}</b> ({e.sector}){e.incierta ? ' — columna sin confirmar' : ''}: {e.mensaje}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

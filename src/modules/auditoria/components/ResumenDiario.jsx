import { SECTORES } from '../lib/fuentesAuditoria'

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

function fechaCorta(f) {
  return new Date(f).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// Objetivo central del módulo: ¿se usa cada sector a diario? Se calcula acá,
// en el cliente, a partir de los mismos eventos ya traídos — no se crea
// ninguna vista ni tabla nueva en la base de cimomet-v2.
export function ResumenDiario({ eventos, diasRango, cargando }) {
  if (cargando) return <div className="aud-vacio">Cargando…</div>

  const hoy = hoyISO()

  const filas = SECTORES.map((s) => {
    const propios = eventos.filter((e) => e.sector === s.key)
    const dias = new Set(propios.map((e) => e.fecha.slice(0, 10)))
    return {
      sector: s,
      cantidad: propios.length,
      diasConActividad: dias.size,
      usadoHoy: dias.has(hoy),
      ultimo: propios[0] || null,
    }
  })

  return (
    <div className="aud-tabla-wrap">
      <table className="aud-tabla">
        <thead>
          <tr>
            <th>Sector</th>
            <th className="center">¿Usado hoy?</th>
            <th>Días con actividad</th>
            <th>Eventos</th>
            <th>Último evento</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.sector.key}>
              <td className="aud-nombre">{f.sector.label}</td>
              <td className="center">
                <span className={'aud-badge-hoy ' + (f.usadoHoy ? 'si' : 'no')}>{f.usadoHoy ? 'Sí' : 'No'}</span>
              </td>
              <td>
                {f.diasConActividad} / {diasRango}
              </td>
              <td>{f.cantidad}</td>
              <td>
                {f.ultimo ? (
                  <>
                    {fechaCorta(f.ultimo.fecha)} —{' '}
                    {f.ultimo.autorNombre || (f.ultimo.autorRol ? `rol: ${f.ultimo.autorRol}` : '— sin identificar')}
                  </>
                ) : (
                  '— sin eventos en el rango'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

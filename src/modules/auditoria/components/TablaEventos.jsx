import { SECTORES } from '../lib/fuentesAuditoria'

const LABEL_SECTOR = Object.fromEntries(SECTORES.map((s) => [s.key, s.label]))

function fechaCorta(f) {
  return new Date(f).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TablaEventos({ eventos, cargando }) {
  if (cargando) return <div className="aud-vacio">Cargando…</div>
  if (!eventos.length) return <div className="aud-vacio">No hay eventos en este rango.</div>

  return (
    <div className="aud-tabla-wrap">
      <table className="aud-tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Sector</th>
            <th>Autor</th>
            <th>OT</th>
            <th>Descripción</th>
            <th>Tabla de origen</th>
          </tr>
        </thead>
        <tbody>
          {eventos.map((e) => (
            <tr key={e.id}>
              <td>{fechaCorta(e.fecha)}</td>
              <td>{LABEL_SECTOR[e.sector] || e.sector}</td>
              <td>{e.autorNombre || (e.autorRol ? `rol: ${e.autorRol}` : '— sin identificar')}</td>
              <td>{e.ot ? e.ot.numero + (e.ot.cliente ? ' - ' + e.ot.cliente : '') : '—'}</td>
              <td>{e.descripcion}</td>
              <td className="aud-tabla-origen">{e.tabla}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

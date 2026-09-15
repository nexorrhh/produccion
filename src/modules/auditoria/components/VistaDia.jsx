import { SECTORES } from '../lib/fuentesAuditoria'

function horaCorta(f) {
  return new Date(f).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// Un día, todos los sectores siempre visibles (incluso sin actividad — es
// justo lo que se quiere controlar), cada uno con su lista de eventos.
export function VistaDia({ eventos, cargando }) {
  if (cargando) return <div className="aud-vacio">Cargando…</div>

  const porSector = SECTORES.map((s) => ({
    sector: s,
    eventos: [...eventos].filter((e) => e.sector === s.key).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
  }))

  return (
    <div className="aud-dia-grid">
      {porSector.map(({ sector, eventos: evs }) => (
        <div key={sector.key} className={'aud-sector-card' + (evs.length ? '' : ' vacio')}>
          <div className="aud-sector-card-header">
            <span className="aud-sector-nombre">{sector.label}</span>
            <span className={'aud-sector-count' + (evs.length ? '' : ' cero')}>
              {evs.length ? evs.length + ' evento' + (evs.length > 1 ? 's' : '') : 'Sin actividad'}
            </span>
          </div>

          {evs.length > 0 ? (
            <ul className="aud-sector-eventos">
              {evs.map((e) => (
                <li key={e.id}>
                  <span className="aud-evento-hora">{horaCorta(e.fecha)}</span>
                  <span className="aud-evento-autor">
                    {e.autorNombre || (e.autorRol ? `rol: ${e.autorRol}` : 'sin identificar')}
                  </span>
                  <span className="aud-evento-desc">
                    {e.descripcion}
                    {e.ot ? ` · OT ${e.ot.numero}${e.ot.cliente ? ' - ' + e.ot.cliente : ''}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="aud-sector-sin-eventos">No se registró actividad este día.</div>
          )}
        </div>
      ))}
    </div>
  )
}

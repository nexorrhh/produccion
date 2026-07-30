import { key, norm, tipoPago } from '../lib/clasificacion'
import { TIPOS_PUESTO } from '../lib/tiposPuesto'

export function OperativosTable({
  empleados,
  mapaClasif,
  cumplimiento,
  seleccion,
  filtros,
  vista,
  onToggleCitar,
  onSetTurno,
  onSetCampo,
}) {
  const txt = norm(filtros.search)
  const lista = empleados.filter((e) => {
    if (filtros.empresa && e.empresa !== filtros.empresa) return false
    if (filtros.puesto && e.desc_puesto !== filtros.puesto) return false
    if (txt && !norm(e.apellido_y_nombre).includes(txt) && !String(e.legajo).includes(txt)) return false
    if (vista === 'citados' && !seleccion[key(e)]) return false
    if (filtros.tipopago && tipoPago(e, mapaClasif) !== filtros.tipopago) return false
    return true
  })

  if (!lista.length) {
    return (
      <div className="op-table-container">
        <table>
          <thead>
            <HeaderRow />
          </thead>
          <tbody>
            <tr className="op-state-row">
              <td colSpan={10}>Sin resultados</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  const grupos = TIPOS_PUESTO.map((t) => ({
    tipo: t.key,
    clase: t.cssClass,
    titulo: t.labelPlural,
    items: lista.filter((e) => tipoPago(e, mapaClasif) === t.key),
  })).filter((g) => g.items.length)

  return (
    <div className="op-table-container">
      <table>
        <thead>
          <HeaderRow />
        </thead>
        <tbody>
          {grupos.map((g) => (
            <GroupRows
              key={g.tipo}
              grupo={g}
              cumplimiento={cumplimiento}
              seleccion={seleccion}
              onToggleCitar={onToggleCitar}
              onSetTurno={onSetTurno}
              onSetCampo={onSetCampo}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HeaderRow() {
  return (
    <tr>
      <th className="center" style={{ width: 50 }}>
        Citar
      </th>
      <th style={{ width: 70 }}>Legajo</th>
      <th>Apellido y nombre</th>
      <th style={{ width: 90 }}>Empresa</th>
      <th>Puesto</th>
      <th className="center" style={{ width: 60 }}>
        07-12
      </th>
      <th className="center" style={{ width: 60 }}>
        12-16
      </th>
      <th style={{ width: 100 }}>Nº OT</th>
      <th style={{ width: 160 }}>Trabajo</th>
      <th style={{ width: 130 }}>Cumplimiento</th>
    </tr>
  )
}

function GroupRows({ grupo, cumplimiento, seleccion, onToggleCitar, onSetTurno, onSetCampo }) {
  const citados = grupo.items.filter((e) => seleccion[key(e)]).length
  return (
    <>
      <tr className="op-group-row">
        <td colSpan={10}>
          <div className={'op-group-head ' + grupo.clase}>
            {grupo.titulo}
            <span className="g-count">{grupo.items.length}</span>
            {citados > 0 && (
              <span className="g-cited">
                {citados} citado{citados > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </td>
      </tr>
      {grupo.items.map((e) => (
        <FilaEmpleado
          key={key(e)}
          empleado={e}
          sel={seleccion[key(e)]}
          cumplimiento={cumplimiento[key(e)]}
          onToggleCitar={onToggleCitar}
          onSetTurno={onSetTurno}
          onSetCampo={onSetCampo}
        />
      ))}
    </>
  )
}

function FilaEmpleado({ empleado: e, sel, cumplimiento: cmp, onToggleCitar, onSetTurno, onSetCampo }) {
  const k = key(e)
  const cited = !!sel

  let cmpNode = <span style={{ color: 'var(--text3)', fontSize: 12 }}>Sin historial</span>
  if (cmp && cmp.convocado > 0) {
    const pct = Math.round(cmp.pct_cumplimiento)
    const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)'
    cmpNode = (
      <div className="op-cmp-bar">
        <div className="op-cmp-track">
          <div className="op-cmp-fill" style={{ width: pct + '%', background: color }} />
        </div>
        <span className="op-cmp-pct" style={{ color }}>
          {pct}%
        </span>
      </div>
    )
  }

  return (
    <tr className={cited ? 'cited' : ''}>
      <td className="center">
        <input type="checkbox" className="op-chk" checked={cited} onChange={() => onToggleCitar(k)} />
      </td>
      <td>
        <span className="op-legajo-num">{e.legajo}</span>
      </td>
      <td className="op-nombre-main">{e.apellido_y_nombre}</td>
      <td>
        {e.empresa === 'CIMOMET' ? (
          <span className="badge badge-cim">Cimomet</span>
        ) : (
          <span className="badge badge-com">Co.mo.ing</span>
        )}
      </td>
      <td>
        <span className="badge op-badge-puesto">{e.desc_puesto || '—'}</span>
      </td>
      <td className="center">
        <input
          type="checkbox"
          className="op-chk"
          checked={!!(sel && sel.manana)}
          disabled={!cited}
          onChange={(ev) => onSetTurno(k, 'manana', ev.target.checked)}
        />
      </td>
      <td className="center">
        <input
          type="checkbox"
          className="op-chk"
          checked={!!(sel && sel.tarde)}
          disabled={!cited}
          onChange={(ev) => onSetTurno(k, 'tarde', ev.target.checked)}
        />
      </td>
      <td>
        <input
          type="text"
          className="op-inp-cell op-inp-ot"
          defaultValue={sel ? sel.ot : ''}
          key={k + '-ot-' + cited}
          disabled={!cited}
          placeholder="OT"
          onBlur={(ev) => onSetCampo(k, 'ot', ev.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          className="op-inp-cell"
          defaultValue={sel ? sel.trabajo || '' : ''}
          key={k + '-trabajo-' + cited}
          disabled={!cited}
          placeholder="Trabajo"
          onBlur={(ev) => onSetCampo(k, 'trabajo', ev.target.value)}
        />
      </td>
      <td>{cmpNode}</td>
    </tr>
  )
}

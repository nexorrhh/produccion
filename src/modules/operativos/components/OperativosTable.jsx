import { key, norm, tipoPago } from '../lib/clasificacion'
import { TIPOS_PUESTO } from '../lib/tiposPuesto'
import { CumplimientoBarra } from './CumplimientoBarra'
import { flechaOrden, ordenarFilas, useOrdenTabla } from '../../../app/lib/ordenarTabla'

function valorOrden(e, campo) {
  if (campo === 'legajo') return e.legajo
  if (campo === 'empresa') return e.empresa
  return e.apellido_y_nombre
}

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
  const { campo, direccion, alternar } = useOrdenTabla()

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
        <table className="op-tabla-desktop">
          <thead>
            <HeaderRow campo={campo} direccion={direccion} onOrdenar={alternar} />
          </thead>
          <tbody>
            <tr className="op-state-row">
              <td colSpan={10}>Sin resultados</td>
            </tr>
          </tbody>
        </table>
        <div className="op-cards-vacio">Sin resultados</div>
      </div>
    )
  }

  const grupos = TIPOS_PUESTO.map((t) => ({
    tipo: t.key,
    clase: t.cssClass,
    titulo: t.labelPlural,
    items: ordenarFilas(
      lista.filter((e) => tipoPago(e, mapaClasif) === t.key),
      campo,
      direccion,
      (e) => valorOrden(e, campo)
    ),
  })).filter((g) => g.items.length)

  return (
    <div className="op-table-container">
      {/* Tabla: pantallas anchas (desktop). Tarjetas: tablet/celular — ver
          op-tabla-desktop / op-cards en operativos.css (@media). Se
          renderizan las dos, CSS decide cuál se ve, así no hace falta
          detectar el ancho por JS. */}
      <table className="op-tabla-desktop">
        <thead>
          <HeaderRow campo={campo} direccion={direccion} onOrdenar={alternar} />
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

      <div className="op-cards">
        {grupos.map((g) => (
          <GrupoTarjetas
            key={g.tipo}
            grupo={g}
            cumplimiento={cumplimiento}
            seleccion={seleccion}
            onToggleCitar={onToggleCitar}
            onSetTurno={onSetTurno}
            onSetCampo={onSetCampo}
          />
        ))}
      </div>
    </div>
  )
}

function HeaderRow({ campo, direccion, onOrdenar }) {
  return (
    <tr>
      <th className="center" style={{ width: 50 }}>
        Citar
      </th>
      <th style={{ width: 70, cursor: 'pointer' }} onClick={() => onOrdenar('legajo')}>
        Legajo{flechaOrden('legajo', campo, direccion)}
      </th>
      <th style={{ cursor: 'pointer' }} onClick={() => onOrdenar('apellido_y_nombre')}>
        Apellido y nombre{flechaOrden('apellido_y_nombre', campo, direccion)}
      </th>
      <th style={{ width: 90, cursor: 'pointer' }} onClick={() => onOrdenar('empresa')}>
        Empresa{flechaOrden('empresa', campo, direccion)}
      </th>
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
    cmpNode = (
      <CumplimientoBarra
        pct={Math.round(cmp.pct_cumplimiento)}
        presentes={cmp.presente}
        ausentes={cmp.ausente || 0}
        noConvocados={cmp.no_convocado || 0}
        totalLabel="Total operativos"
        total={cmp.convocado}
        tituloContexto={e.apellido_y_nombre}
      />
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

// Vista de tarjetas — tablet/celular. Mismos datos y acciones que
// FilaEmpleado, pero apiladas y con botones/checkboxes grandes para
// tocar con el dedo. El detalle (turno/OT/trabajo/cumplimiento) solo se
// expande para quien ya está citado, así se ve todo sin achicar nada: la
// lista completa entra escaneable, y lo que hay que completar aparece
// grande apenas se tilda a alguien.
function GrupoTarjetas({ grupo, cumplimiento, seleccion, onToggleCitar, onSetTurno, onSetCampo }) {
  const citados = grupo.items.filter((e) => seleccion[key(e)]).length
  return (
    <div className="op-card-grupo">
      <div className={'op-group-head ' + grupo.clase}>
        {grupo.titulo}
        <span className="g-count">{grupo.items.length}</span>
        {citados > 0 && (
          <span className="g-cited">
            {citados} citado{citados > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {grupo.items.map((e) => (
        <TarjetaEmpleado
          key={key(e)}
          empleado={e}
          sel={seleccion[key(e)]}
          cumplimiento={cumplimiento[key(e)]}
          onToggleCitar={onToggleCitar}
          onSetTurno={onSetTurno}
          onSetCampo={onSetCampo}
        />
      ))}
    </div>
  )
}

function TarjetaEmpleado({ empleado: e, sel, cumplimiento: cmp, onToggleCitar, onSetTurno, onSetCampo }) {
  const k = key(e)
  const cited = !!sel

  let cmpNode = <span className="op-card-cmp-sin">Sin historial</span>
  if (cmp && cmp.convocado > 0) {
    cmpNode = (
      <CumplimientoBarra
        pct={Math.round(cmp.pct_cumplimiento)}
        presentes={cmp.presente}
        ausentes={cmp.ausente || 0}
        noConvocados={cmp.no_convocado || 0}
        totalLabel="Total operativos"
        total={cmp.convocado}
        tituloContexto={e.apellido_y_nombre}
      />
    )
  }

  return (
    <div className={'op-card' + (cited ? ' cited' : '')}>
      <label className="op-card-cabecera">
        <input type="checkbox" className="op-chk op-chk-lg" checked={cited} onChange={() => onToggleCitar(k)} />
        <div className="op-card-identidad">
          <div className="op-card-nombre">{e.apellido_y_nombre}</div>
          <div className="op-card-meta">
            <span className="op-legajo-num">{e.legajo}</span>
            {e.empresa === 'CIMOMET' ? (
              <span className="badge badge-cim">Cimomet</span>
            ) : (
              <span className="badge badge-com">Co.mo.ing</span>
            )}
            <span className="badge op-badge-puesto">{e.desc_puesto || '—'}</span>
          </div>
        </div>
      </label>

      {cited && (
        <div className="op-card-detalle">
          <div className="op-card-turnos">
            <label className={'op-card-turno' + (sel.manana ? ' on' : '')}>
              <input
                type="checkbox"
                checked={!!sel.manana}
                onChange={(ev) => onSetTurno(k, 'manana', ev.target.checked)}
              />
              07-12
            </label>
            <label className={'op-card-turno' + (sel.tarde ? ' on' : '')}>
              <input
                type="checkbox"
                checked={!!sel.tarde}
                onChange={(ev) => onSetTurno(k, 'tarde', ev.target.checked)}
              />
              12-16
            </label>
          </div>
          <div className="op-card-campos">
            <input
              type="text"
              className="op-inp-cell op-inp-ot"
              defaultValue={sel.ot || ''}
              key={k + '-ot-card-' + cited}
              placeholder="Nº OT"
              onBlur={(ev) => onSetCampo(k, 'ot', ev.target.value)}
            />
            <input
              type="text"
              className="op-inp-cell"
              defaultValue={sel.trabajo || ''}
              key={k + '-trabajo-card-' + cited}
              placeholder="Trabajo"
              onBlur={(ev) => onSetCampo(k, 'trabajo', ev.target.value)}
            />
          </div>
        </div>
      )}

      <div className="op-card-cumplimiento">{cmpNode}</div>
    </div>
  )
}

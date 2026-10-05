import { useMemo, useState } from 'react'
import { tipoPuesto, nombrePuesto, norm, TIPOS_PUESTO } from '../lib/clasificacionPuesto'

function iniciales(apellidoYNombre) {
  const [apellido, nombre] = (apellidoYNombre || '').split(',').map((s) => s.trim())
  const a = apellido?.[0] || ''
  const n = nombre?.[0] || ''
  return (a + n).toUpperCase() || '?'
}

export function ListadoPlantel({ empleados, mapaClasif }) {
  const [busqueda, setBusqueda] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [tipo, setTipo] = useState('')
  const [puesto, setPuesto] = useState('')

  const conTipo = useMemo(
    () => empleados.map((e) => ({ ...e, _tipo: tipoPuesto(e.desc_puesto, mapaClasif) })),
    [empleados, mapaClasif]
  )

  const tiposConGente = useMemo(() => {
    const presentes = new Set(conTipo.map((e) => e._tipo))
    return TIPOS_PUESTO.filter((t) => presentes.has(t.key))
  }, [conTipo])

  const puestos = useMemo(
    () => [...new Set(conTipo.map((e) => nombrePuesto(e.desc_puesto)))].sort(),
    [conTipo]
  )

  const filtrados = useMemo(() => {
    const q = norm(busqueda.trim())
    return conTipo
      .filter((e) => !empresa || e.empresa === empresa)
      .filter((e) => !tipo || e._tipo === tipo)
      .filter((e) => !puesto || nombrePuesto(e.desc_puesto) === puesto)
      .filter((e) => !q || norm(e.apellido_y_nombre).includes(q))
      .sort((a, b) => a.empresa.localeCompare(b.empresa) || a.apellido_y_nombre.localeCompare(b.apellido_y_nombre))
  }, [conTipo, busqueda, empresa, tipo, puesto])

  const countEmpresa = (emp) => (emp ? conTipo.filter((e) => e.empresa === emp).length : conTipo.length)

  return (
    <div className="pl-listado">
      <div className="pl-listado-filtros">
        <input
          type="text"
          className="pl-input-busqueda"
          placeholder="Buscar por nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="pl-pills">
          <button className={empresa === '' ? 'active' : ''} onClick={() => setEmpresa('')}>
            Todos <b>{countEmpresa('')}</b>
          </button>
          <button className={empresa === 'CIMOMET' ? 'active' : ''} onClick={() => setEmpresa('CIMOMET')}>
            Cimomet <b>{countEmpresa('CIMOMET')}</b>
          </button>
          <button className={empresa === 'COMOING' ? 'active' : ''} onClick={() => setEmpresa('COMOING')}>
            Co.mo.ing <b>{countEmpresa('COMOING')}</b>
          </button>
        </div>

        <div className="pl-pills">
          <button className={tipo === '' ? 'active' : ''} onClick={() => setTipo('')}>
            Todos
          </button>
          {tiposConGente.map((t) => (
            <button key={t.key} className={tipo === t.key ? 'active' : ''} onClick={() => setTipo(t.key)}>
              {t.labelPlural} <b>{conTipo.filter((e) => e._tipo === t.key).length}</b>
            </button>
          ))}
        </div>

        <select value={puesto} onChange={(e) => setPuesto(e.target.value)} className="pl-select-puesto">
          <option value="">Todos los puestos</option>
          {puestos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="pl-listado-count">{filtrados.length} personas</div>

      {filtrados.length === 0 ? (
        <div className="pl-vacio">No hay nadie que coincida con estos filtros.</div>
      ) : (
        <div className="pl-tarjetas">
          {filtrados.map((e) => (
            <div className="pl-empleado-card" key={e.empresa + '|' + e.legajo}>
              <div className="pl-empleado-avatar">{iniciales(e.apellido_y_nombre)}</div>
              <div className="pl-empleado-info">
                <div className="pl-empleado-nombre">{e.apellido_y_nombre}</div>
                <div className="pl-empleado-puesto">{nombrePuesto(e.desc_puesto)}</div>
              </div>
              <div className="pl-empleado-meta">
                <span className={'badge ' + (e.empresa === 'CIMOMET' ? 'badge-cim' : 'badge-com')}>
                  {e.empresa === 'CIMOMET' ? 'Cimomet' : 'Co.mo.ing'}
                </span>
                <span className="pl-empleado-legajo">#{e.legajo}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { flechaOrden, ordenarFilas, useOrdenTabla } from '../../../app/lib/ordenarTabla'

function fmtFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR')
}

function valorOrden(f, campo) {
  if (campo === 'legajo') return f.empleado.legajo
  if (campo === 'empresa') return f.empleado.empresa
  return f.empleado.apellido_y_nombre
}

export function PersonasTable({ filas, onAbrir }) {
  const [empresa, setEmpresa] = useState('')
  const [puesto, setPuesto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const { campo, direccion, alternar } = useOrdenTabla()

  const puestos = useMemo(
    () => [...new Set(filas.map((f) => f.empleado.desc_puesto).filter(Boolean))].sort(),
    [filas]
  )

  const filtradas = useMemo(() => {
    let lista = filas
    if (empresa) lista = lista.filter((f) => f.empleado.empresa === empresa)
    if (puesto) lista = lista.filter((f) => f.empleado.desc_puesto === puesto)
    if (busqueda) {
      const txt = busqueda.toLowerCase()
      lista = lista.filter(
        (f) =>
          (f.empleado.apellido_y_nombre || '').toLowerCase().includes(txt) ||
          String(f.empleado.legajo).includes(txt)
      )
    }
    return lista
  }, [filas, empresa, puesto, busqueda])

  const ordenadas = useMemo(
    () => ordenarFilas(filtradas, campo, direccion, (f) => valorOrden(f, campo)),
    [filtradas, campo, direccion]
  )

  return (
    <div>
      <div className="pv-analisis-toolbar">
        <div className="pv-chip-toggle">
          <button className={empresa === '' ? 'active' : ''} onClick={() => setEmpresa('')}>
            Todos
          </button>
          <button className={empresa === 'CIMOMET' ? 'active' : ''} onClick={() => setEmpresa('CIMOMET')}>
            Cimomet
          </button>
          <button className={empresa === 'COMOING' ? 'active' : ''} onClick={() => setEmpresa('COMOING')}>
            Co.mo.ing
          </button>
        </div>
        <div className="pv-toolbar-right">
          <select className="pv-filter" value={puesto} onChange={(e) => setPuesto(e.target.value)}>
            <option value="">Todos los puestos</option>
            {puestos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="pv-busqueda"
            placeholder="Buscar por legajo o nombre…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {!filtradas.length ? (
        <div className="pv-table-container pv-vacio">
          {filas.length ? 'Sin personas para los filtros seleccionados.' : 'No hay personal activo para mostrar.'}
        </div>
      ) : (
        <div className="pv-table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 70, cursor: 'pointer' }} onClick={() => alternar('legajo')}>
                  Legajo{flechaOrden('legajo', campo, direccion)}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => alternar('apellido_y_nombre')}>
                  Apellido y nombre{flechaOrden('apellido_y_nombre', campo, direccion)}
                </th>
                <th style={{ width: 90, cursor: 'pointer' }} onClick={() => alternar('empresa')}>
                  Empresa{flechaOrden('empresa', campo, direccion)}
                </th>
                <th>Puesto</th>
                <th style={{ width: 90 }} className="center">
                  Asignados
                </th>
                <th>Estado</th>
                <th style={{ width: 130 }}>Última confirmación</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((f) => (
                <tr key={f.empleado.legajo + '|' + f.empleado.empresa} className={f.estado.alerta ? 'pv-row-alerta' : ''}>
                  <td>
                    <span className="pv-legajo-num">{f.empleado.legajo}</span>
                  </td>
                  <td className="pv-nombre-main">{f.empleado.apellido_y_nombre}</td>
                  <td>
                    {f.empleado.empresa === 'CIMOMET' ? (
                      <span className="badge badge-cim">Cimomet</span>
                    ) : (
                      <span className="badge badge-com">Co.mo.ing</span>
                    )}
                  </td>
                  <td>{f.empleado.desc_puesto || '—'}</td>
                  <td className="center">{f.cantidadAsignados}</td>
                  <td>
                    <span className={'pv-estado-badge pv-' + f.estado.estado}>{f.estado.label}</span>
                  </td>
                  <td>{fmtFecha(f.persona?.fecha_confirmacion || f.persona?.fecha_definicion)}</td>
                  <td>
                    <button className="btn" onClick={() => onAbrir(f)}>
                      Ver / Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

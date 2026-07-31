import { useMemo, useState } from 'react'
import { CumplimientoBarra } from '../../components/CumplimientoBarra'
import { flechaOrden, ordenarFilas, useOrdenTabla } from '../../../../app/lib/ordenarTabla'

function valorOrden(p, campo) {
  if (campo === 'legajo') return p.legajo
  if (campo === 'empresa') return p.empresa
  return p.apellido_y_nombre
}

const LIMITE = 10

export function TablaPorPersona({ filas }) {
  const [empresa, setEmpresa] = useState('')
  const [puesto, setPuesto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState(false)
  const { campo, direccion, alternar } = useOrdenTabla()

  const puestos = useMemo(
    () => [...new Set(filas.map((p) => p.desc_puesto).filter(Boolean))].sort(),
    [filas]
  )

  const filtradas = useMemo(() => {
    let lista = [...filas].sort((a, b) => (a.apellido_y_nombre || '').localeCompare(b.apellido_y_nombre || ''))
    if (empresa) lista = lista.filter((p) => p.empresa === empresa)
    if (puesto) lista = lista.filter((p) => p.desc_puesto === puesto)
    if (busqueda) {
      const txt = busqueda.toLowerCase()
      lista = lista.filter(
        (p) => (p.apellido_y_nombre || '').toLowerCase().includes(txt) || String(p.legajo).includes(txt)
      )
    }
    return lista
  }, [filas, empresa, puesto, busqueda])

  const ordenadas = useMemo(
    () => ordenarFilas(filtradas, campo, direccion, (p) => valorOrden(p, campo)),
    [filtradas, campo, direccion]
  )

  const visibles = expandido ? ordenadas : ordenadas.slice(0, LIMITE)

  return (
    <div>
      <div className="an-tabla-toolbar">
        <div className="op-chip-toggle">
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
        <select className="an-filter" value={puesto} onChange={(e) => setPuesto(e.target.value)}>
          <option value="">Todos los puestos</option>
          {puestos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="an-busqueda"
          placeholder="Buscar por legajo o nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="an-table-container">
        <table>
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => alternar('legajo')}>
                Legajo{flechaOrden('legajo', campo, direccion)}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => alternar('apellido_y_nombre')}>
                Apellido y nombre{flechaOrden('apellido_y_nombre', campo, direccion)}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => alternar('empresa')}>
                Empresa{flechaOrden('empresa', campo, direccion)}
              </th>
              <th className="center">Conv.</th>
              <th className="center">Pres.</th>
              <th className="center">Aus.</th>
              <th className="center">No conv.</th>
              <th>Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length ? (
              visibles.map((p) => (
                <tr key={p.legajo + '|' + p.empresa}>
                  <td>
                    <span className="op-legajo-num">{p.legajo}</span>
                  </td>
                  <td className="op-nombre-main">{p.apellido_y_nombre}</td>
                  <td>
                    {p.empresa === 'CIMOMET' ? (
                      <span className="badge badge-cim">Cimomet</span>
                    ) : (
                      <span className="badge badge-com">Co.mo.ing</span>
                    )}
                  </td>
                  <td className="center">{p.convocado}</td>
                  <td className="center">{p.presente}</td>
                  <td className="center">{p.ausente}</td>
                  <td className="center">{p.no_convocado}</td>
                  <td>
                    <CumplimientoBarra
                      pct={Math.round(p.pct_cumplimiento)}
                      presentes={p.presente}
                      ausentes={p.ausente || 0}
                      noConvocados={p.no_convocado || 0}
                      totalLabel="Total operativos"
                      total={p.convocado}
                      tituloContexto={p.apellido_y_nombre}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="an-vacio">
                  Sin personas para los filtros seleccionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtradas.length > LIMITE && (
        <div className="an-ver-mas">
          <button className="btn" onClick={() => setExpandido((e) => !e)}>
            {expandido ? 'Ver menos' : `Ver más — ${filtradas.length - LIMITE} personas más`}
          </button>
        </div>
      )}
    </div>
  )
}

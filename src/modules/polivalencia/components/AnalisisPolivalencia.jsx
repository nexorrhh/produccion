import { useMemo, useState } from 'react'
import { MatrizCompleta } from './MatrizCompleta'
import { CoberturaPorPuesto } from './CoberturaPorPuesto'

function key(legajo, empresa) {
  return legajo + '|' + empresa
}

export function AnalisisPolivalencia({ personal, puestos, niveles, personaPorLegajo, detallePorPersonaId }) {
  const [vista, setVista] = useState('matriz')
  const [empresa, setEmpresa] = useState('')
  const [puestoFiltro, setPuestoFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const puestosPersonal = useMemo(
    () => [...new Set(personal.map((e) => e.desc_puesto).filter(Boolean))].sort(),
    [personal]
  )

  const personalFiltrado = useMemo(() => {
    let lista = personal
    if (empresa) lista = lista.filter((e) => e.empresa === empresa)
    if (puestoFiltro) lista = lista.filter((e) => e.desc_puesto === puestoFiltro)
    if (busqueda) {
      const txt = busqueda.toLowerCase()
      lista = lista.filter(
        (e) => (e.apellido_y_nombre || '').toLowerCase().includes(txt) || String(e.legajo).includes(txt)
      )
    }
    return lista
  }, [personal, empresa, puestoFiltro, busqueda])

  const nivelPorId = useMemo(() => new Map(niveles.map((n) => [n.id, n])), [niveles])

  // key `${legajo}|${empresa}|${puestoId}` -> nivel { id, nombre, orden }
  const nivelPorCelda = useMemo(() => {
    const m = new Map()
    personalFiltrado.forEach((e) => {
      const persona = personaPorLegajo.get(key(e.legajo, e.empresa))
      if (!persona) return
      const detalle = detallePorPersonaId.get(persona.id) || []
      detalle.forEach((d) => {
        const nivel = nivelPorId.get(d.nivel_id)
        if (nivel) m.set(key(e.legajo, e.empresa) + '|' + d.puesto_id, nivel)
      })
    })
    return m
  }, [personalFiltrado, personaPorLegajo, detallePorPersonaId, nivelPorId])

  const cobertura = useMemo(() => {
    const porPuesto = new Map(puestos.map((p) => [p.id, []]))
    personalFiltrado.forEach((e) => {
      const persona = personaPorLegajo.get(key(e.legajo, e.empresa))
      if (!persona) return
      const detalle = detallePorPersonaId.get(persona.id) || []
      detalle.forEach((d) => {
        const nivel = nivelPorId.get(d.nivel_id)
        const bucket = porPuesto.get(d.puesto_id)
        if (nivel && bucket) bucket.push({ empleado: e, nivel })
      })
    })

    return puestos.map((puesto) => {
      const asignados = (porPuesto.get(puesto.id) || []).sort((a, b) =>
        a.empleado.apellido_y_nombre.localeCompare(b.empleado.apellido_y_nombre)
      )
      const porNivel = new Map()
      asignados.forEach(({ empleado, nivel }) => {
        const arr = porNivel.get(nivel.id) || []
        arr.push(empleado)
        porNivel.set(nivel.id, arr)
      })
      const grupos = [...porNivel.entries()]
        .map(([nivelId, personas]) => ({ nivel: nivelPorId.get(nivelId), personas }))
        .sort((a, b) => b.nivel.orden - a.nivel.orden)

      return { puesto, grupos, total: asignados.length }
    })
  }, [puestos, personalFiltrado, personaPorLegajo, detallePorPersonaId, nivelPorId])

  return (
    <div>
      <div className="pv-analisis-toolbar">
        <div className="pv-chip-toggle">
          <button className={vista === 'matriz' ? 'active' : ''} onClick={() => setVista('matriz')}>
            Matriz completa
          </button>
          <button className={vista === 'cobertura' ? 'active' : ''} onClick={() => setVista('cobertura')}>
            Cobertura por puesto
          </button>
        </div>
        <div className="pv-toolbar-right">
          <select className="pv-filter" value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
            <option value="">Ambas empresas</option>
            <option value="CIMOMET">Cimomet</option>
            <option value="COMOING">Co.mo.ing</option>
          </select>
          <select className="pv-filter" value={puestoFiltro} onChange={(e) => setPuestoFiltro(e.target.value)}>
            <option value="">Todos los puestos</option>
            {puestosPersonal.map((p) => (
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

      {vista === 'matriz' ? (
        <MatrizCompleta personal={personalFiltrado} puestos={puestos} nivelPorCelda={nivelPorCelda} />
      ) : (
        <CoberturaPorPuesto cobertura={cobertura} />
      )}
    </div>
  )
}

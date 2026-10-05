import { useMemo } from 'react'
import { KpisPlantel } from './KpisPlantel'
import { DonutChart } from './DonutChart'
import { tipoPuesto, nombrePuesto, TIPOS_PUESTO } from '../lib/clasificacionPuesto'

export function ResumenPlantel({ empleados, mapaClasif }) {
  const stats = useMemo(() => {
    let cimomet = 0
    let comoing = 0
    const porTipo = { mensual: [], quincenal: [], sin_asignar: [] }
    empleados.forEach((e) => {
      if (e.empresa === 'CIMOMET') cimomet++
      else comoing++
      porTipo[tipoPuesto(e.desc_puesto, mapaClasif)].push(e)
    })
    return { cimomet, comoing, porTipo }
  }, [empleados, mapaClasif])

  const total = empleados.length
  const mensuales = stats.porTipo.mensual.length
  const quincenales = stats.porTipo.quincenal.length
  const sinClasificar = stats.porTipo.sin_asignar.length

  const gruposPorPuesto = useMemo(() => {
    return TIPOS_PUESTO.map((t) => {
      const items = stats.porTipo[t.key]
      const porPuesto = new Map()
      items.forEach((e) => {
        const nombre = nombrePuesto(e.desc_puesto)
        if (!porPuesto.has(nombre)) porPuesto.set(nombre, { nombre, cimomet: 0, comoing: 0, personas: [] })
        const g = porPuesto.get(nombre)
        if (e.empresa === 'CIMOMET') g.cimomet++
        else g.comoing++
        g.personas.push(e.apellido_y_nombre)
      })
      const puestos = [...porPuesto.values()]
        .map((p) => ({ ...p, total: p.cimomet + p.comoing, personas: [...p.personas].sort((a, b) => a.localeCompare(b)) }))
        .sort((a, b) => b.total - a.total)
      return { ...t, items, puestos }
    }).filter((g) => g.items.length)
  }, [stats])

  const maxPuesto = Math.max(1, ...gruposPorPuesto.flatMap((g) => g.puestos.map((p) => p.total)))

  if (!total) {
    return <div className="pl-vacio">No hay personal activo cargado.</div>
  }

  return (
    <div className="pl-resumen">
      <KpisPlantel
        total={total}
        cimomet={stats.cimomet}
        comoing={stats.comoing}
        mensuales={mensuales}
        quincenales={quincenales}
        sinClasificar={sinClasificar}
      />

      <div className="pl-graficos">
        <div className="pl-graf-card">
          <h3 className="pl-graf-titulo">Distribución por empresa</h3>
          <DonutChart
            segmentos={[
              { key: 'cim', label: 'Cimomet S.A.', color: 'var(--cim)', valor: stats.cimomet },
              { key: 'com', label: 'Co.mo.ing S.R.L.', color: 'var(--com)', valor: stats.comoing },
            ]}
          />
        </div>
        <div className="pl-graf-card">
          <h3 className="pl-graf-titulo">Sector de liquidación</h3>
          <DonutChart
            segmentos={TIPOS_PUESTO.map((t) => ({
              key: t.key,
              label: t.labelPlural,
              color: t.color,
              valor: stats.porTipo[t.key].length,
            }))}
          />
        </div>
      </div>

      <div className="pl-cruce-card">
        <h3 className="pl-graf-titulo">Empresa × Sector de liquidación</h3>
        <table className="pl-cruce-tabla">
          <thead>
            <tr>
              <th></th>
              {TIPOS_PUESTO.map((t) => (
                <th key={t.key}>{t.labelPlural}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {['CIMOMET', 'COMOING'].map((emp) => {
              const nombre = emp === 'CIMOMET' ? 'Cimomet S.A.' : 'Co.mo.ing S.R.L.'
              const fila = TIPOS_PUESTO.map((t) => stats.porTipo[t.key].filter((e) => e.empresa === emp).length)
              const totalFila = fila.reduce((s, x) => s + x, 0)
              return (
                <tr key={emp}>
                  <td className="pl-cruce-emp">{nombre}</td>
                  {fila.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                  <td>
                    <b>{totalFila}</b>
                  </td>
                </tr>
              )
            })}
            <tr className="pl-cruce-total">
              <td>Total</td>
              {TIPOS_PUESTO.map((t) => (
                <td key={t.key}>{stats.porTipo[t.key].length}</td>
              ))}
              <td>
                <b>{total}</b>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {gruposPorPuesto.map((g) => (
        <div className="pl-sector-card" key={g.key}>
          <h3 className="pl-graf-titulo">
            {g.labelPlural.toUpperCase()} ({g.items.length})
          </h3>
          <div className="pl-sector-puestos">
            {g.puestos.map((p) => (
              <div className="pl-sector-fila" key={p.nombre} title={p.nombre + ' (' + p.total + ')\n' + p.personas.join('\n')}>
                <div className="pl-sector-fila-header">
                  <span>{p.nombre}</span>
                  <b>{p.total}</b>
                </div>
                <div className="pl-sector-barra" style={{ width: (p.total / maxPuesto) * 100 + '%' }}>
                  {p.cimomet > 0 && (
                    <div
                      className="pl-sector-seg pl-sector-seg-cim"
                      style={{ width: (p.cimomet / p.total) * 100 + '%' }}
                      title={`Cimomet: ${p.cimomet}`}
                    />
                  )}
                  {p.comoing > 0 && (
                    <div
                      className="pl-sector-seg pl-sector-seg-com"
                      style={{ width: (p.comoing / p.total) * 100 + '%' }}
                      title={`Co.mo.ing: ${p.comoing}`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

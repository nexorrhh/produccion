import { useMemo, useState } from 'react'
import { calcAntiguedad, rangoAntiguedad, edadQueCumple, parseFechaISO } from '../lib/antiguedad'
import { tipoPuesto, nombrePuesto, TIPOS_PUESTO } from '../lib/clasificacionPuesto'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function useSort(initialKey, initialDir = 'asc') {
  const [sort, setSort] = useState({ key: initialKey, dir: initialDir })
  function toggle(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }
  return [sort, toggle]
}

export function CumpleanosAntiguedad({ empleados, mapaClasif }) {
  const hoy = new Date()
  const [empresa, setEmpresa] = useState('')
  const [tipo, setTipo] = useState('')
  const [mesAniv, setMesAniv] = useState(hoy.getMonth())
  const [anioAniv, setAnioAniv] = useState(hoy.getFullYear())
  const [sortAntig, toggleSortAntig] = useSort('antiguedadMeses', 'desc')

  const conTipo = useMemo(
    () => empleados.map((e) => ({ ...e, _tipo: tipoPuesto(e.desc_puesto, mapaClasif) })),
    [empleados, mapaClasif]
  )

  const filtrados = useMemo(
    () => conTipo.filter((e) => !empresa || e.empresa === empresa).filter((e) => !tipo || e._tipo === tipo),
    [conTipo, empresa, tipo]
  )

  const cumpleanosMes = useMemo(() => {
    return filtrados
      .map((e) => {
        const f = parseFechaISO(e.fecha_nacimiento)
        if (!f || f.mes !== hoy.getMonth() + 1) return null
        return { ...e, dia: f.dia, cumple: edadQueCumple(e.fecha_nacimiento, hoy) }
      })
      .filter(Boolean)
      .sort((a, b) => a.dia - b.dia)
  }, [filtrados])

  const aniversarios = useMemo(() => {
    return filtrados
      .map((e) => {
        const f = parseFechaISO(e.fecha_ingreso)
        if (!f || f.mes !== mesAniv + 1) return null
        const aniosCumple = anioAniv - f.anio
        if (aniosCumple < 2) return null
        return { ...e, dia: f.dia, aniosCumple }
      })
      .filter(Boolean)
      .sort((a, b) => a.dia - b.dia)
  }, [filtrados, mesAniv, anioAniv])

  const antiguedadFilas = useMemo(() => {
    return filtrados
      .map((e) => {
        const a = calcAntiguedad(e.fecha_ingreso, hoy)
        if (!a) return null
        return {
          ...e,
          anios: a.anios,
          meses: a.meses,
          antiguedadMeses: a.anios * 12 + a.meses,
          rango: rangoAntiguedad(a.anios),
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        const dir = sortAntig.dir === 'asc' ? 1 : -1
        if (sortAntig.key === 'apellido_y_nombre') return dir * a.apellido_y_nombre.localeCompare(b.apellido_y_nombre)
        return dir * (a[sortAntig.key] - b[sortAntig.key])
      })
  }, [filtrados, sortAntig])

  const esMesActual = mesAniv === hoy.getMonth() && anioAniv === hoy.getFullYear()

  function moverMes(delta) {
    let m = mesAniv + delta
    let a = anioAniv
    if (m < 0) {
      m = 11
      a--
    }
    if (m > 11) {
      m = 0
      a++
    }
    setMesAniv(m)
    setAnioAniv(a)
  }

  function thSort(key, label) {
    return (
      <th onClick={() => toggleSortAntig(key)} className="pl-th-ordenable">
        {label} {sortAntig.key === key ? (sortAntig.dir === 'asc' ? '▲' : '▼') : ''}
      </th>
    )
  }

  return (
    <div className="pl-cumple">
      <div className="pl-pills">
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
      <div className="pl-pills">
        <button className={tipo === '' ? 'active' : ''} onClick={() => setTipo('')}>
          Todos
        </button>
        {TIPOS_PUESTO.map((t) => (
          <button key={t.key} className={tipo === t.key ? 'active' : ''} onClick={() => setTipo(t.key)}>
            {t.labelPlural}
          </button>
        ))}
      </div>

      <section className="pl-seccion">
        <h3 className="pl-seccion-titulo">
          🎂 Cumpleaños de {MESES[hoy.getMonth()]} ({cumpleanosMes.length})
        </h3>
        {cumpleanosMes.length === 0 ? (
          <div className="pl-vacio">Nadie cumple años este mes.</div>
        ) : (
          <table className="pl-tabla">
            <thead>
              <tr>
                <th>Día</th>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Empresa</th>
                <th>Cumple</th>
              </tr>
            </thead>
            <tbody>
              {cumpleanosMes.map((e) => (
                <tr key={e.empresa + '|' + e.legajo} className={e.dia === hoy.getDate() ? 'pl-fila-hoy' : ''}>
                  <td>
                    {e.dia}
                    {e.dia === hoy.getDate() ? ' · ¡Hoy!' : ''}
                  </td>
                  <td>{e.apellido_y_nombre}</td>
                  <td>{nombrePuesto(e.desc_puesto)}</td>
                  <td>{e.empresa === 'CIMOMET' ? 'Cimomet' : 'Co.mo.ing'}</td>
                  <td>{e.cumple} años</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="pl-seccion">
        <div className="pl-seccion-header">
          <h3 className="pl-seccion-titulo">
            🏅 Aniversarios laborales — {MESES[mesAniv]} {anioAniv} ({aniversarios.length})
          </h3>
          <div className="pl-nav-mes">
            <button className="btn btn-ghost" onClick={() => moverMes(-1)}>
              ‹
            </button>
            {!esMesActual && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setMesAniv(hoy.getMonth())
                  setAnioAniv(hoy.getFullYear())
                }}
              >
                Hoy
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => moverMes(1)}>
              ›
            </button>
          </div>
        </div>
        {aniversarios.length === 0 ? (
          <div className="pl-vacio">No hay aniversarios de 2+ años este mes.</div>
        ) : (
          <table className="pl-tabla">
            <thead>
              <tr>
                <th>Día</th>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Empresa</th>
                <th>Antigüedad</th>
              </tr>
            </thead>
            <tbody>
              {aniversarios.map((e) => {
                const esHoy = esMesActual && e.dia === hoy.getDate()
                const faltan = esMesActual ? e.dia - hoy.getDate() : null
                return (
                  <tr key={e.empresa + '|' + e.legajo} className={esHoy ? 'pl-fila-hoy' : ''}>
                    <td>{e.dia}</td>
                    <td>{e.apellido_y_nombre}</td>
                    <td>{nombrePuesto(e.desc_puesto)}</td>
                    <td>{e.empresa === 'CIMOMET' ? 'Cimomet' : 'Co.mo.ing'}</td>
                    <td>{esHoy ? '¡Hoy!' : faltan > 0 ? `en ${faltan}d` : `${e.aniosCumple} años ✓`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="pl-seccion">
        <h3 className="pl-seccion-titulo">⭐ Antigüedad ({antiguedadFilas.length})</h3>
        {antiguedadFilas.length === 0 ? (
          <div className="pl-vacio">Sin datos de antigüedad.</div>
        ) : (
          <table className="pl-tabla">
            <thead>
              <tr>
                {thSort('apellido_y_nombre', 'Nombre')}
                <th>Puesto</th>
                <th>Empresa</th>
                {thSort('antiguedadMeses', 'Antigüedad')}
              </tr>
            </thead>
            <tbody>
              {antiguedadFilas.map((e) => (
                <tr key={e.empresa + '|' + e.legajo}>
                  <td>{e.apellido_y_nombre}</td>
                  <td>{nombrePuesto(e.desc_puesto)}</td>
                  <td>{e.empresa === 'CIMOMET' ? 'Cimomet' : 'Co.mo.ing'}</td>
                  <td>
                    <span className={'pl-chip pl-chip-' + e.rango}>
                      {e.anios} años {e.meses > 0 ? `${e.meses}m` : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

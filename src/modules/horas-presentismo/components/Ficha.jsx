import { useMemo, useState } from 'react'
import { fmtPeriodo, nombreEmpresa } from '../lib/periodo'
import { tipoPuesto } from '../lib/clasificacionPuesto'
import { calcularIndicadores } from '../lib/calculoIndicadores'
import { construirDetalleDiario } from '../lib/estadoDia'
import { KpisBloque } from './KpisBloque'
import { DetalleDiario } from './PorPersona'

function norm(s) {
  return (s || '').toLowerCase()
}

// Ficha individual (buscar una persona) o de Grupo/Sector (varias a la
// vez) — mismo cálculo de KPIs que Indicadores (lib/calculoIndicadores.js),
// aplicado a una sola persona o a la selección. No incluye exportación a
// PDF del original (queda para una próxima vuelta si hace falta).
export function Ficha({ horasMensual, horasDetalle, horasOt, tardanzas, mapaCategoriaAusencia, empleados, mapaClasif }) {
  const periodos = useMemo(() => [...new Set(horasMensual.map((f) => f.periodo))].sort().reverse(), [horasMensual])
  const [periodoSel, setPeriodoSel] = useState('')
  const periodo = periodoSel || periodos[0] || ''
  const [modo, setModo] = useState('individual')

  const [busqueda, setBusqueda] = useState('')
  const [legajoSel, setLegajoSel] = useState(null)

  const sectores = useMemo(() => [...new Set(empleados.map((e) => e.desc_puesto).filter(Boolean))].sort(), [empleados])
  const [sectorSel, setSectorSel] = useState('')
  const [seleccionGrupo, setSeleccionGrupo] = useState(new Set())

  const horasDelPeriodo = useMemo(() => horasMensual.filter((f) => f.periodo === periodo), [horasMensual, periodo])
  const tardanzasDelPeriodo = useMemo(() => tardanzas.filter((t) => t.periodo === periodo), [tardanzas, periodo])

  const candidatosBusqueda = useMemo(() => {
    if (!busqueda.trim()) return []
    const q = norm(busqueda)
    return empleados.filter((e) => norm(e.apellido_y_nombre).includes(q)).slice(0, 8)
  }, [busqueda, empleados])

  const filaIndividual = legajoSel ? horasDelPeriodo.find((f) => f.empresa + '|' + f.legajo === legajoSel) : null
  const empleadoIndividual = legajoSel ? empleados.find((e) => e.empresa + '|' + e.legajo === legajoSel) : null

  const kpisIndividual = filaIndividual
    ? calcularIndicadores(
        [filaIndividual],
        tardanzasDelPeriodo.filter((t) => t.empresa + '|' + t.legajo === legajoSel)
      )
    : null

  const diasIndividual = useMemo(() => {
    if (!filaIndividual) return []
    const esMensual = empleadoIndividual ? tipoPuesto(empleadoIndividual.desc_puesto, mapaClasif) === 'mensual' : false
    return construirDetalleDiario({
      periodo,
      legajo: filaIndividual.legajo,
      horasDetalle: horasDetalle.filter((f) => f.legajo === filaIndividual.legajo && f.periodo === periodo),
      horasOt,
      tardanzas: tardanzasDelPeriodo.filter((t) => t.empresa === filaIndividual.empresa),
      esMensual,
      mapaCategoriaAusencia,
    })
  }, [filaIndividual, empleadoIndividual, horasDetalle, horasOt, tardanzasDelPeriodo, periodo, mapaClasif, mapaCategoriaAusencia])

  const empleadosSector = useMemo(
    () => (sectorSel ? empleados.filter((e) => e.desc_puesto === sectorSel) : []),
    [sectorSel, empleados]
  )

  function toggleGrupo(clave) {
    setSeleccionGrupo((s) => {
      const next = new Set(s)
      if (next.has(clave)) next.delete(clave)
      else next.add(clave)
      return next
    })
  }
  function seleccionarSectorCompleto() {
    setSeleccionGrupo((s) => {
      const next = new Set(s)
      empleadosSector.forEach((e) => next.add(e.empresa + '|' + e.legajo))
      return next
    })
  }

  const filasGrupo = useMemo(
    () => horasDelPeriodo.filter((f) => seleccionGrupo.has(f.empresa + '|' + f.legajo)),
    [horasDelPeriodo, seleccionGrupo]
  )
  const tardanzasGrupo = useMemo(
    () => tardanzasDelPeriodo.filter((t) => seleccionGrupo.has(t.empresa + '|' + t.legajo)),
    [tardanzasDelPeriodo, seleccionGrupo]
  )
  const kpisGrupo = seleccionGrupo.size ? calcularIndicadores(filasGrupo, tardanzasGrupo) : null

  if (!periodos.length) {
    return <div className="hp-vacio">No hay datos de horas mensuales cargados todavía.</div>
  }

  return (
    <div className="hp-ficha">
      <div className="hp-filtros">
        <select className="hp-select" value={periodo} onChange={(e) => setPeriodoSel(e.target.value)}>
          {periodos.map((p) => (
            <option key={p} value={p}>
              {fmtPeriodo(p)}
            </option>
          ))}
        </select>
        <div className="hp-pills">
          <button className={modo === 'individual' ? 'active' : ''} onClick={() => setModo('individual')}>
            Individual
          </button>
          <button className={modo === 'grupo' ? 'active' : ''} onClick={() => setModo('grupo')}>
            Grupo / Sector
          </button>
        </div>
      </div>

      {modo === 'individual' ? (
        <>
          <div className="hp-ficha-buscador">
            <input
              className="hp-input-busqueda"
              placeholder="Buscar persona por nombre…"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setLegajoSel(null)
              }}
            />
            {candidatosBusqueda.length > 0 && !legajoSel && (
              <ul className="hp-ficha-sugerencias">
                {candidatosBusqueda.map((e) => (
                  <li
                    key={e.empresa + '|' + e.legajo}
                    onClick={() => {
                      setLegajoSel(e.empresa + '|' + e.legajo)
                      setBusqueda(e.apellido_y_nombre)
                    }}
                  >
                    {e.apellido_y_nombre} — {nombreEmpresa(e.empresa)} · {e.desc_puesto || 'Sin puesto'}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!filaIndividual ? (
            <div className="hp-vacio">
              {legajoSel ? 'No hay datos de horas para esta persona en este período.' : 'Buscá una persona para ver su ficha.'}
            </div>
          ) : (
            <div className="hp-seccion">
              <h3 className="hp-seccion-titulo">
                {empleadoIndividual?.apellido_y_nombre || filaIndividual.apellido + ', ' + filaIndividual.nombre} ·{' '}
                {fmtPeriodo(periodo)}
                {empleadoIndividual &&
                  (() => {
                    const t = tipoPuesto(empleadoIndividual.desc_puesto, mapaClasif)
                    return <> · {t === 'mensual' ? 'Mensual' : t === 'quincenal' ? 'Quincenal' : 'Sin clasificar'}</>
                  })()}
              </h3>
              <KpisBloque kpis={kpisIndividual} />
              <DetalleDiario dias={diasIndividual} />
            </div>
          )}
        </>
      ) : (
        <div className="hp-ficha-grupo">
          <div className="hp-ficha-grupo-selector">
            <div className="hp-sector-selector">
              <select className="hp-select" value={sectorSel} onChange={(e) => setSectorSel(e.target.value)}>
                <option value="">Elegir sector/puesto…</option>
                {sectores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button className="btn btn-ghost" onClick={seleccionarSectorCompleto} disabled={!sectorSel}>
                Agregar todo el sector
              </button>
              {seleccionGrupo.size > 0 && (
                <button className="btn btn-ghost" onClick={() => setSeleccionGrupo(new Set())}>
                  Vaciar selección
                </button>
              )}
            </div>

            <div className="hp-ficha-checklist">
              {empleados.map((e) => {
                const clave = e.empresa + '|' + e.legajo
                return (
                  <label key={clave} className="hp-ficha-check-item">
                    <input type="checkbox" checked={seleccionGrupo.has(clave)} onChange={() => toggleGrupo(clave)} />
                    {e.apellido_y_nombre} <span className="hp-novedad-empresa">{nombreEmpresa(e.empresa)}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {!kpisGrupo ? (
            <div className="hp-vacio">Elegí al menos una persona para ver el grupo.</div>
          ) : (
            <div className="hp-seccion">
              <h3 className="hp-seccion-titulo">
                Grupo seleccionado ({seleccionGrupo.size} personas) — {fmtPeriodo(periodo)}
              </h3>
              <KpisBloque kpis={kpisGrupo} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

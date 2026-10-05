import { useMemo, useState } from 'react'
import { tipoPuesto } from '../lib/clasificacionPuesto'
import { categoriaAusencia } from '../hooks/useClasificacionAusencias'
import { nombreEmpresa } from '../lib/periodo'

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}
function sumarDias(fechaISO, n) {
  const d = new Date(fechaISO + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function fechaLarga(fechaISO) {
  return new Date(fechaISO + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
function esHoraExtra(f) {
  const d = (f.descripcion_tipo_hora || f.tipo_hora || '').toLowerCase()
  return d.includes('ext') || d.includes('50') || d.includes('100')
}

const GRUPOS = [
  { key: 'quincenal', label: 'Quincenales' },
  { key: 'mensual', label: 'Mensuales' },
  { key: 'sin_asignar', label: 'Sin clasificar' },
]

// Registro diario de "qué pasó" — relee tardanzas/salidas/ausencias y el
// detalle de horas ya cargados, no inventa datos nuevos. Mismo criterio
// que Tablero_RRHH: agrupado en Quincenales/Mensuales/Sin clasificar.
// Solo el lado "datos de Tango" — el sub-modo "Chequeo del día (fichadas)"
// del original implica subir un archivo del reloj biométrico, así que
// queda fuera (es carga de datos, fuera del alcance de este módulo).
export function Novedades({ tardanzas, horasDetalle, horasMensual, empleados, mapaClasif, mapaCategoriaAusencia }) {
  const [fecha, setFecha] = useState(hoyISO)

  const empleadosPorLegajoEmpresa = useMemo(() => {
    const mapa = new Map()
    empleados.forEach((e) => mapa.set(e.empresa + '|' + e.legajo, e))
    return mapa
  }, [empleados])

  const empleadosPorLegajoSolo = useMemo(() => {
    const mapa = new Map()
    empleados.forEach((e) => {
      if (!mapa.has(e.legajo)) mapa.set(e.legajo, [])
      mapa.get(e.legajo).push(e)
    })
    return mapa
  }, [empleados])

  // rrhh_horas_detalle no trae columna `empresa` confiable (ver
  // useHorasDetalle.js) — para esas filas se resuelve por legajo solo
  // cuando no hay ambigüedad entre Cimomet/Co.mo.ing.
  function resolver(legajo, empresa) {
    if (empresa) {
      const e = empleadosPorLegajoEmpresa.get(empresa + '|' + legajo)
      if (e) return e
    }
    const candidatos = empleadosPorLegajoSolo.get(legajo) || []
    return candidatos.length === 1 ? candidatos[0] : null
  }
  function grupoDe(legajo, empresa) {
    const e = resolver(legajo, empresa)
    return e ? tipoPuesto(e.desc_puesto, mapaClasif) : 'sin_asignar'
  }
  function nombreDe(legajo, empresa) {
    const e = resolver(legajo, empresa)
    return e ? e.apellido_y_nombre : 'Legajo ' + legajo
  }

  const tardanzasDia = useMemo(() => tardanzas.filter((t) => t.fecha === fecha), [tardanzas, fecha])

  // Para "Horas extra" hace falta saber a qué período pertenece el día
  // elegido, así se puede cruzar legajo contra rrhh_horas_mensual cuando
  // el legajo del detalle es ambiguo entre empresas.
  const periodoDia = fecha.slice(0, 7)
  const empresaPorLegajoPeriodo = useMemo(() => {
    const mapa = new Map()
    horasMensual
      .filter((f) => f.periodo === periodoDia)
      .forEach((f) => mapa.set(f.legajo, (mapa.get(f.legajo) || new Set()).add(f.empresa)))
    return mapa
  }, [horasMensual, periodoDia])

  function empresaDetalle(legajo) {
    const set = empresaPorLegajoPeriodo.get(legajo)
    if (set && set.size === 1) return [...set][0]
    return null
  }

  const extrasDia = useMemo(
    () => horasDetalle.filter((f) => f.fecha === fecha && esHoraExtra(f) && Number(f.hs_reales || f.hs_trabajadas || 0) > 0),
    [horasDetalle, fecha]
  )

  function agrupar(lista, legajoKey, empresaKey) {
    const porGrupo = { quincenal: [], mensual: [], sin_asignar: [] }
    lista.forEach((f) => {
      const empresa = empresaKey ? f[empresaKey] : empresaDetalle(f[legajoKey])
      const g = grupoDe(f[legajoKey], empresa)
      porGrupo[g].push({ ...f, _empresaResuelta: empresa })
    })
    return porGrupo
  }

  const faltasPorGrupo = useMemo(() => agrupar(tardanzasDia.filter((t) => t.tipo === 'ausente'), 'legajo', 'empresa'), [tardanzasDia])
  const tardePorGrupo = useMemo(() => agrupar(tardanzasDia.filter((t) => t.tipo === 'tarde'), 'legajo', 'empresa'), [tardanzasDia])
  const tempranoPorGrupo = useMemo(() => agrupar(tardanzasDia.filter((t) => t.tipo === 'temprano'), 'legajo', 'empresa'), [tardanzasDia])
  const extraPorGrupo = useMemo(() => agrupar(extrasDia, 'legajo', null), [extrasDia])

  function totalGrupos(porGrupo) {
    return porGrupo.quincenal.length + porGrupo.mensual.length + porGrupo.sin_asignar.length
  }

  return (
    <div className="hp-novedades">
      <div className="hp-nav-dia">
        <button className="btn" onClick={() => setFecha((f) => sumarDias(f, -1))}>
          ← Día anterior
        </button>
        <div className="hp-fecha-actual">
          <input type="date" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} />
          <span className="hp-fecha-label">{fechaLarga(fecha)}</span>
        </div>
        <button className="btn" onClick={() => setFecha((f) => sumarDias(f, 1))} disabled={fecha === hoyISO()}>
          Día siguiente →
        </button>
        {fecha !== hoyISO() && (
          <button className="btn btn-ghost" onClick={() => setFecha(hoyISO())}>
            Volver a hoy
          </button>
        )}
      </div>

      <BloqueNovedad
        titulo="Faltas"
        porGrupo={faltasPorGrupo}
        nombreDe={nombreDe}
        render={(t) => (
          <>
            {t.codigo_justificacion ? `${t.codigo_justificacion} — ${categoriaAusencia(t.codigo_justificacion, mapaCategoriaAusencia)}` : 'Sin código'}
          </>
        )}
      />
      <BloqueNovedad
        titulo="Llegadas tarde"
        porGrupo={tardePorGrupo}
        nombreDe={nombreDe}
        render={(t) => <>{t.minutos ? `${t.minutos} min` : ''}</>}
      />
      <BloqueNovedad
        titulo="Salidas anticipadas"
        porGrupo={tempranoPorGrupo}
        nombreDe={nombreDe}
        render={(t) => <>{t.minutos ? `${t.minutos} min` : ''}</>}
      />
      <BloqueNovedad
        titulo="Horas extra"
        porGrupo={extraPorGrupo}
        nombreDe={nombreDe}
        render={(f) => <>{Number(f.hs_reales || f.hs_trabajadas || 0).toFixed(1)} hs — {f.descripcion_tipo_hora || f.tipo_hora}</>}
      />
    </div>
  )
}

function BloqueNovedad({ titulo, porGrupo, nombreDe, render }) {
  const total = porGrupo.quincenal.length + porGrupo.mensual.length + porGrupo.sin_asignar.length
  return (
    <div className="hp-seccion">
      <h3 className="hp-seccion-titulo">
        {titulo} ({total})
      </h3>
      {total === 0 ? (
        <div className="hp-vacio-chico">Sin novedades de este tipo.</div>
      ) : (
        <div className="hp-novedad-grupos">
          {GRUPOS.map((g) => {
            const items = porGrupo[g.key]
            if (!items.length) return null
            return (
              <div className="hp-novedad-grupo" key={g.key}>
                <div className="hp-novedad-grupo-titulo">
                  {g.label} ({items.length})
                </div>
                <ul className="hp-novedad-lista">
                  {items.map((it, i) => (
                    <li key={i}>
                      <span className="hp-novedad-nombre">{nombreDe(it.legajo, it._empresaResuelta)}</span>
                      {it._empresaResuelta && <span className="hp-novedad-empresa">{nombreEmpresa(it._empresaResuelta)}</span>}
                      <span className="hp-novedad-detalle">{render(it)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

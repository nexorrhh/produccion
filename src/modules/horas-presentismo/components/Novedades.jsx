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
function fechaCorta(fechaISO) {
  return new Date(fechaISO + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}
// Lunes de la semana que contiene `fechaISO` (semana laboral lunes-viernes,
// mismo criterio que presentismo-novedades.js de Tablero_RRHH).
function lunesDeLaSemana(fechaISO) {
  const d = new Date(fechaISO + 'T00:00:00')
  const dia = d.getDay()
  const offset = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
function esHoraExtra(f) {
  const d = (f.descripcion_tipo_hora || f.tipo_hora || '').toLowerCase()
  return d.includes('ext') || d.includes('50') || d.includes('100')
}

// Vacaciones, viaje laboral y feriado nunca cuentan como ausentismo —
// mismo criterio (CODIGOS_EXCLUIDOS_AUSENTISMO) que
// presentismo-indicadores.js de Tablero_RRHH.
const CODIGOS_EXCLUIDOS_FALTA = ['VACACION', 'VIAJE', 'AUS_FER']
function esFaltaReal(t) {
  const codigo = (t.codigo_justificacion || '').toUpperCase()
  return !CODIGOS_EXCLUIDOS_FALTA.includes(codigo)
}

const GRUPOS = [
  { key: 'quincenal', label: 'Quincenales' },
  { key: 'mensual', label: 'Mensuales' },
  { key: 'sin_asignar', label: 'Sin clasificar' },
]

// Registro de "qué pasó" — relee tardanzas/salidas/ausencias y el detalle
// de horas ya cargados, no inventa datos nuevos. Navegable por día o por
// semana laboral (lunes a viernes), igual que Tablero_RRHH. Cada categoría
// arranca contraída (solo título + cantidad) y se despliega al tocarla —
// así de un vistazo se ve el resumen del día sin que la pantalla quede
// larguísima. No incluye el sub-modo "Chequeo del día (fichadas)" del
// original porque implica subir un archivo del reloj biométrico (carga de
// datos, fuera de alcance de este módulo).
export function Novedades({ tardanzas, horasDetalle, horasOt, empleados, mapaClasif, mapaCategoriaAusencia }) {
  const [modo, setModo] = useState('dia') // dia | semana
  const [fecha, setFecha] = useState(hoyISO)
  const [expandidos, setExpandidos] = useState(() => new Set())

  function toggleExpandido(key) {
    setExpandidos((s) => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const desde = modo === 'semana' ? lunesDeLaSemana(fecha) : fecha
  const hasta = modo === 'semana' ? sumarDias(desde, 4) : fecha

  function moverRango(direccion) {
    const paso = modo === 'semana' ? 7 : 1
    setFecha((f) => sumarDias(f, direccion * paso))
  }

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
  // useHorasDetalle.js) — para esas filas (Horas extra) hay que resolver
  // persona por otro camino. `empleados` incluye también gente inactiva
  // (para poder nombrar a alguien que ya no trabaja acá en una novedad
  // vieja), y como Cimomet y Co.mo.ing reutilizan números de legajo entre
  // sí, el mismo legajo puede tener más de un candidato: se prueba, en
  // orden, (1) el cruce exacto empresa+legajo cuando la fuente sí trae
  // empresa (tardanzas), (2) si hay un único legajo en todo el padrón,
  // (3) si hay un único candidato ACTIVO entre los posibles, y (4) como
  // último recurso para horas extra, el mismo legajo+fecha en
  // horas_ot_detalle (Capataz), que sí guarda nombre y empresa sin
  // ambigüedad por fila.
  function resolverPersona(legajo, fecha, empresaConocida) {
    if (empresaConocida) {
      const e = empleadosPorLegajoEmpresa.get(empresaConocida + '|' + legajo)
      if (e) return { nombre: e.apellido_y_nombre, empresa: empresaConocida, descPuesto: e.desc_puesto }
    }
    const candidatos = empleadosPorLegajoSolo.get(legajo) || []
    if (candidatos.length === 1) {
      return { nombre: candidatos[0].apellido_y_nombre, empresa: candidatos[0].empresa, descPuesto: candidatos[0].desc_puesto }
    }
    const activos = candidatos.filter((c) => c.activo)
    if (activos.length === 1) {
      return { nombre: activos[0].apellido_y_nombre, empresa: activos[0].empresa, descPuesto: activos[0].desc_puesto }
    }
    const otMatch = horasOt.find((h) => h.legajo === legajo && h.fecha === fecha)
    if (otMatch) return { nombre: otMatch.nombre, empresa: otMatch.empresa, descPuesto: null }
    return null
  }

  const enRango = (f) => f.fecha >= desde && f.fecha <= hasta

  const tardanzasRango = useMemo(() => tardanzas.filter(enRango), [tardanzas, desde, hasta])

  const extrasRango = useMemo(
    () => horasDetalle.filter((f) => enRango(f) && esHoraExtra(f) && Number(f.hs_reales || f.hs_trabajadas || 0) > 0),
    [horasDetalle, desde, hasta]
  )

  function agrupar(lista, empresaKey) {
    const porGrupo = { quincenal: [], mensual: [], sin_asignar: [] }
    lista.forEach((f) => {
      const persona = resolverPersona(f.legajo, f.fecha, empresaKey ? f[empresaKey] : null)
      const grupo = persona ? tipoPuesto(persona.descPuesto, mapaClasif) : 'sin_asignar'
      porGrupo[grupo].push({
        ...f,
        _nombreResuelto: persona ? persona.nombre : 'Legajo ' + f.legajo,
        _empresaResuelta: persona ? persona.empresa : null,
      })
    })
    return porGrupo
  }

  const faltasPorGrupo = useMemo(
    () => agrupar(tardanzasRango.filter((t) => t.tipo === 'ausente' && esFaltaReal(t)), 'empresa'),
    [tardanzasRango]
  )
  const tardePorGrupo = useMemo(() => agrupar(tardanzasRango.filter((t) => t.tipo === 'tarde'), 'empresa'), [tardanzasRango])
  const tempranoPorGrupo = useMemo(() => agrupar(tardanzasRango.filter((t) => t.tipo === 'temprano'), 'empresa'), [tardanzasRango])
  const extraPorGrupo = useMemo(() => agrupar(extrasRango, null), [extrasRango])

  return (
    <div className="hp-novedades">
      <div className="hp-nav-dia">
        <div className="hp-pills">
          <button className={modo === 'dia' ? 'active' : ''} onClick={() => setModo('dia')}>
            Día
          </button>
          <button className={modo === 'semana' ? 'active' : ''} onClick={() => setModo('semana')}>
            Semana
          </button>
        </div>
        <button className="btn" onClick={() => moverRango(-1)}>
          ← {modo === 'semana' ? 'Semana anterior' : 'Día anterior'}
        </button>
        <div className="hp-fecha-actual">
          <input type="date" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} />
          <span className="hp-fecha-label">
            {modo === 'semana' ? `Semana del ${fechaCorta(desde)} al ${fechaCorta(hasta)}` : fechaLarga(fecha)}
          </span>
        </div>
        <button className="btn" onClick={() => moverRango(1)} disabled={hasta >= hoyISO()}>
          {modo === 'semana' ? 'Semana siguiente' : 'Día siguiente'} →
        </button>
        {fecha !== hoyISO() && (
          <button className="btn btn-ghost" onClick={() => setFecha(hoyISO())}>
            Volver a hoy
          </button>
        )}
      </div>

      <BloqueNovedad
        clave="faltas"
        titulo="Faltas"
        porGrupo={faltasPorGrupo}
        expandido={expandidos.has('faltas')}
        onToggle={() => toggleExpandido('faltas')}
        render={(t) => (
          <>{t.codigo_justificacion ? `${t.codigo_justificacion} — ${categoriaAusencia(t.codigo_justificacion, mapaCategoriaAusencia)}` : 'Sin código'}</>
        )}
      />
      <BloqueNovedad
        clave="tarde"
        titulo="Llegadas tarde"
        porGrupo={tardePorGrupo}
        expandido={expandidos.has('tarde')}
        onToggle={() => toggleExpandido('tarde')}
        render={(t) => <>{t.minutos ? `${t.minutos} min` : ''}</>}
      />
      <BloqueNovedad
        clave="temprano"
        titulo="Salidas anticipadas"
        porGrupo={tempranoPorGrupo}
        expandido={expandidos.has('temprano')}
        onToggle={() => toggleExpandido('temprano')}
        render={(t) => <>{t.minutos ? `${t.minutos} min` : ''}</>}
      />
      <BloqueNovedad
        clave="extra"
        titulo="Horas extra"
        porGrupo={extraPorGrupo}
        expandido={expandidos.has('extra')}
        onToggle={() => toggleExpandido('extra')}
        render={(f) => (
          <>
            {Number(f.hs_reales || f.hs_trabajadas || 0).toFixed(1)} hs — {f.descripcion_tipo_hora || f.tipo_hora}
          </>
        )}
      />
    </div>
  )
}

function BloqueNovedad({ titulo, porGrupo, render, expandido, onToggle }) {
  const total = porGrupo.quincenal.length + porGrupo.mensual.length + porGrupo.sin_asignar.length
  return (
    <div className="hp-seccion hp-seccion-colapsable">
      <button className="hp-seccion-header-clic" onClick={onToggle} disabled={total === 0}>
        <span className="hp-seccion-titulo-colapsable">
          {titulo} <b className={total === 0 ? 'hp-cero' : ''}>{total}</b>
        </span>
        {total > 0 && <span className={'hp-chevron' + (expandido ? ' abierto' : '')}>▾</span>}
      </button>
      {total === 0 ? (
        <div className="hp-vacio-chico">Sin novedades de este tipo.</div>
      ) : expandido ? (
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
                      <span className="hp-novedad-nombre">{it._nombreResuelto}</span>
                      {it._empresaResuelta && <span className="hp-novedad-empresa">{nombreEmpresa(it._empresaResuelta)}</span>}
                      <span className="hp-novedad-fecha-chip">{it.fecha.slice(8, 10)}/{it.fecha.slice(5, 7)}</span>
                      <span className="hp-novedad-detalle">{render(it)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

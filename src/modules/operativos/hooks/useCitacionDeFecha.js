import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'
import { key } from '../lib/clasificacion'

// Puerto de cargarCitacionDeFecha()/guardarCitacion()/copiarUltimaCitacion()
// de docs/reference/citaciones.html. No cambia el esquema de `citaciones`
// ni `citacion_detalle` — escribe las mismas columnas que ya usa el HTML.
export function useCitacionDeFecha(fecha, empleados) {
  const [seleccion, setSeleccion] = useState({})
  const [citacionId, setCitacionId] = useState(null)
  const [estadoTexto, setEstadoTexto] = useState('')

  useEffect(() => {
    let cancelled = false

    async function cargar() {
      if (!fecha || !empleados.length) return
      setSeleccion({})
      setCitacionId(null)
      try {
        const { data: cits } = await supabase
          .from('citaciones')
          .select('id,estado')
          .eq('fecha', fecha)
        if (cancelled) return

        if (cits && cits.length) {
          const id = cits[0].id
          const { data: det } = await supabase
            .from('citacion_detalle')
            .select('*')
            .eq('citacion_id', id)
          if (cancelled) return

          const nueva = {}
          ;(det || []).forEach((d) => {
            nueva[d.legajo + '|' + d.empresa] = {
              manana: d.turno_manana,
              tarde: d.turno_tarde,
              ot: d.ot || '',
              trabajo: d.trabajo || '',
            }
          })
          setCitacionId(id)
          setSeleccion(nueva)
          setEstadoTexto('Citación existente (' + (det || []).length + ' personas) — editando')
        } else {
          setEstadoTexto('Nueva citación')
        }
      } catch {
        // silencioso, igual que el HTML original
      }
    }

    cargar()
    return () => {
      cancelled = true
    }
  }, [fecha, empleados])

  async function guardar(tipo, dia) {
    const sels = Object.keys(seleccion)
    if (!sels.length) throw new Error('No hay nadie citado')

    let citId = citacionId

    if (citId) {
      await supabase.from('citacion_detalle').delete().eq('citacion_id', citId)
      const { error } = await supabase
        .from('citaciones')
        .update({ tipo, dia_semana: dia })
        .eq('id', citId)
      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from('citaciones')
        .insert({ fecha, tipo, dia_semana: dia, estado: 'abierta' })
        .select()
      if (error) throw error
      citId = data[0].id
      setCitacionId(citId)
    }

    const detalle = sels.map((k) => {
      const e = empleados.find((x) => key(x) === k)
      const s = seleccion[k]
      return {
        citacion_id: citId,
        legajo: e.legajo,
        empresa: e.empresa,
        apellido_y_nombre: e.apellido_y_nombre,
        desc_puesto: e.desc_puesto,
        turno_manana: !!s.manana,
        turno_tarde: !!s.tarde,
        ot: s.ot || null,
        trabajo: s.trabajo || null,
        situacion: 'Convocado',
      }
    })

    const { error: detError } = await supabase.from('citacion_detalle').insert(detalle)
    if (detError) throw detError

    setEstadoTexto('Citación guardada (' + detalle.length + ' personas)')
    return detalle.length
  }

  async function copiarUltima(fechaActual) {
    const { data: cits } = await supabase
      .from('citaciones')
      .select('id,fecha,tipo')
      .order('fecha', { ascending: false })
      .limit(5)

    const anterior = (cits || []).find((c) => c.fecha !== fechaActual)
    if (!anterior) throw new Error('No hay citaciones anteriores guardadas')

    const { data: det } = await supabase
      .from('citacion_detalle')
      .select('legajo,empresa,turno_manana,turno_tarde')
      .eq('citacion_id', anterior.id)

    if (!det || !det.length) throw new Error('Esa citación no tiene personas guardadas')

    const nueva = {}
    let cargados = 0
    det.forEach((d) => {
      const k = d.legajo + '|' + d.empresa
      if (empleados.find((e) => key(e) === k)) {
        nueva[k] = { manana: d.turno_manana, tarde: d.turno_tarde, ot: '', trabajo: '' }
        cargados++
      }
    })

    setSeleccion(nueva)
    setEstadoTexto('Copiada de ' + anterior.fecha + ' — sin guardar')
    return { anterior, cargados, omitidos: det.length - cargados }
  }

  function limpiar() {
    setSeleccion({})
  }

  function toggleCitar(k) {
    setSeleccion((prev) => {
      const next = { ...prev }
      if (next[k]) delete next[k]
      else next[k] = { manana: true, tarde: false, ot: '', trabajo: '' }
      return next
    })
  }

  function setTurno(k, turno, val) {
    setSeleccion((prev) => (prev[k] ? { ...prev, [k]: { ...prev[k], [turno]: val } } : prev))
  }

  function setCampo(k, campo, val) {
    setSeleccion((prev) => (prev[k] ? { ...prev, [k]: { ...prev[k], [campo]: val } } : prev))
  }

  return {
    seleccion,
    estadoTexto,
    guardar,
    copiarUltima,
    limpiar,
    toggleCitar,
    setTurno,
    setCampo,
  }
}

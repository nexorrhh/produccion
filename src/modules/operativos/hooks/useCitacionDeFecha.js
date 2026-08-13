import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'
import { key } from '../lib/clasificacion'

const VALIDACION_VACIA = {
  estado: null,
  creadoPor: null,
  creadoPorNombre: null,
  validadoPor: null,
  validadoPorNombre: null,
  validadoEn: null,
  rechazadoPor: null,
  rechazadoEn: null,
  comentarioRechazo: null,
}

// Puerto de cargarCitacionDeFecha()/guardarCitacion()/copiarUltimaCitacion()
// de docs/reference/citaciones.html, más el flujo de validación (Carlos
// carga → Javier/Valentín aprueba o rechaza). No cambia el esquema base de
// `citaciones`/`citacion_detalle` — solo usa las columnas nuevas de
// 0007_operativos_flujo_validacion.sql para el estado de validación.
export function useCitacionDeFecha(fecha, empleados) {
  const [seleccion, setSeleccion] = useState({})
  const [citacionId, setCitacionId] = useState(null)
  const [estadoTexto, setEstadoTexto] = useState('')
  const [validacion, setValidacion] = useState(VALIDACION_VACIA)

  useEffect(() => {
    let cancelled = false

    async function cargar() {
      if (!fecha || !empleados.length) return
      setSeleccion({})
      setCitacionId(null)
      setValidacion(VALIDACION_VACIA)
      try {
        const { data: cits } = await supabase
          .from('citaciones')
          .select(
            'id,estado,creado_por,creado_por_nombre,validado_por,validado_por_nombre,validado_en,rechazado_por,rechazado_en,comentario_rechazo'
          )
          .eq('fecha', fecha)
        if (cancelled) return

        if (cits && cits.length) {
          const cit = cits[0]
          const { data: det } = await supabase
            .from('citacion_detalle')
            .select('*')
            .eq('citacion_id', cit.id)
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
          setCitacionId(cit.id)
          setSeleccion(nueva)
          setValidacion({
            estado: cit.estado,
            creadoPor: cit.creado_por,
            creadoPorNombre: cit.creado_por_nombre,
            validadoPor: cit.validado_por,
            validadoPorNombre: cit.validado_por_nombre,
            validadoEn: cit.validado_en,
            rechazadoPor: cit.rechazado_por,
            rechazadoEn: cit.rechazado_en,
            comentarioRechazo: cit.comentario_rechazo,
          })
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

  async function guardar(tipo, dia, usuario) {
    const sels = Object.keys(seleccion)
    if (!sels.length) throw new Error('No hay nadie citado')

    let citId = citacionId

    // Cualquier guardado (alta o edición) vuelve a dejar la citación
    // pendiente de validación — si ya estaba aprobada o rechazada, un
    // cambio de contenido pide una revisión nueva.
    if (citId) {
      await supabase.from('citacion_detalle').delete().eq('citacion_id', citId)
      const { error } = await supabase
        .from('citaciones')
        .update({
          tipo,
          dia_semana: dia,
          estado: 'pendiente_validacion',
          validado_por: null,
          validado_en: null,
          rechazado_por: null,
          rechazado_en: null,
          comentario_rechazo: null,
        })
        .eq('id', citId)
      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from('citaciones')
        .insert({
          fecha,
          tipo,
          dia_semana: dia,
          estado: 'pendiente_validacion',
          creado_por: usuario.id,
          creado_por_nombre: usuario.nombre_apellido,
        })
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

    setValidacion((prev) => ({
      ...prev,
      estado: 'pendiente_validacion',
      creadoPor: prev.creadoPor || usuario.id,
      creadoPorNombre: prev.creadoPorNombre || usuario.nombre_apellido,
      validadoPor: null,
      validadoEn: null,
      rechazadoPor: null,
      rechazadoEn: null,
      comentarioRechazo: null,
    }))
    setEstadoTexto('Citación guardada (' + detalle.length + ' personas)')
    return { citacionId: citId, detalle }
  }

  async function aprobar(usuario) {
    if (!citacionId) throw new Error('No hay citación guardada para aprobar')
    const validadoEn = new Date().toISOString()
    const { error } = await supabase
      .from('citaciones')
      .update({
        estado: 'validada',
        validado_por: usuario.id,
        validado_por_nombre: usuario.nombre_apellido,
        validado_en: validadoEn,
      })
      .eq('id', citacionId)
    if (error) throw error
    setValidacion((prev) => ({
      ...prev,
      estado: 'validada',
      validadoPor: usuario.id,
      validadoPorNombre: usuario.nombre_apellido,
      validadoEn,
    }))
  }

  async function rechazar(usuarioId, comentario) {
    if (!citacionId) throw new Error('No hay citación guardada para rechazar')
    const rechazadoEn = new Date().toISOString()
    const { error } = await supabase
      .from('citaciones')
      .update({
        estado: 'rechazada',
        rechazado_por: usuarioId,
        rechazado_en: rechazadoEn,
        comentario_rechazo: comentario,
      })
      .eq('id', citacionId)
    if (error) throw error
    setValidacion((prev) => ({
      ...prev,
      estado: 'rechazada',
      rechazadoPor: usuarioId,
      rechazadoEn,
      comentarioRechazo: comentario,
    }))
  }

  // Corrige la fecha de LA MISMA citación cargada (update), en vez de que
  // el picker de fecha la trate como "otra citación" y termine creando un
  // operativo duplicado mientras el original queda huérfano en
  // Validación. Después de llamar a esto hay que actualizar el estado
  // `fecha` del componente padre para que vuelva a cargar — como el valor
  // en la base ya cambió, va a encontrar esta misma citación, no crear otra.
  async function moverFecha(nuevaFecha) {
    if (!citacionId) throw new Error('No hay citación guardada para corregir')

    const { data: existente } = await supabase
      .from('citaciones')
      .select('id')
      .eq('fecha', nuevaFecha)
      .neq('id', citacionId)
    if (existente && existente.length) {
      throw new Error('Ya hay una citación guardada para esa fecha')
    }

    const { error } = await supabase.from('citaciones').update({ fecha: nuevaFecha }).eq('id', citacionId)
    if (error) throw error
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
    citacionId,
    estadoTexto,
    validacion,
    guardar,
    aprobar,
    rechazar,
    moverFecha,
    copiarUltima,
    limpiar,
    toggleCitar,
    setTurno,
    setCampo,
  }
}

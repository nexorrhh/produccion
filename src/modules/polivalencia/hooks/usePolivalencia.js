import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'
import { useAuth } from '../../../app/auth/useAuth'
import { stampCreate, stampUpdate } from '../../../app/lib/audit'

function key(legajo, empresa) {
  return legajo + '|' + empresa
}

export function usePolivalencia() {
  const { user } = useAuth()
  const [personas, setPersonas] = useState([])
  const [detalle, setDetalle] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const { data: personasData, error: pErr } = await supabase
        .from('produccion_polivalencia_persona')
        .select('*')
      if (pErr) throw pErr

      const { data: detalleData, error: dErr } = await supabase
        .from('produccion_polivalencia_detalle')
        .select('*')
      if (dErr) throw dErr

      setPersonas(personasData || [])
      setDetalle(detalleData || [])
    } catch (e) {
      setError('No se pudo cargar la polivalencia: ' + e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const personaPorLegajo = useMemo(() => {
    const m = new Map()
    personas.forEach((p) => m.set(key(p.legajo, p.empresa), p))
    return m
  }, [personas])

  const detallePorPersonaId = useMemo(() => {
    const m = new Map()
    detalle.forEach((d) => {
      const arr = m.get(d.persona_id) || []
      arr.push(d)
      m.set(d.persona_id, arr)
    })
    return m
  }, [detalle])

  async function registrarHistorial(persona, accion, puestoId, nivelId) {
    await supabase.from('produccion_polivalencia_historial').insert({
      persona_id: persona.id,
      legajo: persona.legajo,
      empresa: persona.empresa,
      puesto_id: puestoId || null,
      nivel_id: nivelId || null,
      accion,
      registrado_por: user.id,
    })
  }

  async function asegurarPersona(legajo, empresa) {
    const existente = personaPorLegajo.get(key(legajo, empresa))
    if (existente) return existente

    const { data, error } = await supabase
      .from('produccion_polivalencia_persona')
      .insert({
        legajo,
        empresa,
        definido_por: user.id,
        ...stampCreate(user),
      })
      .select()
      .single()
    if (error) throw error

    setPersonas((prev) => [...prev, data])
    return data
  }

  async function agregarPuesto(legajo, empresa, puestoId, nivelId) {
    const persona = await asegurarPersona(legajo, empresa)

    const { data, error } = await supabase
      .from('produccion_polivalencia_detalle')
      .insert({ persona_id: persona.id, puesto_id: puestoId, nivel_id: nivelId, ...stampCreate(user) })
      .select()
      .single()
    if (error) throw error

    setDetalle((prev) => [...prev, data])
    await registrarHistorial(persona, 'definicion', puestoId, nivelId)
    return data
  }

  async function cambiarNivel(detalleId, nivelId) {
    const { data, error } = await supabase
      .from('produccion_polivalencia_detalle')
      .update({ nivel_id: nivelId, ...stampUpdate(user) })
      .eq('id', detalleId)
      .select()
      .single()
    if (error) throw error

    setDetalle((prev) => prev.map((d) => (d.id === detalleId ? data : d)))
    const persona = personas.find((p) => p.id === data.persona_id)
    if (persona) await registrarHistorial(persona, 'cambio_nivel', data.puesto_id, nivelId)
  }

  async function quitarPuesto(detalleId) {
    const fila = detalle.find((d) => d.id === detalleId)
    const { error } = await supabase.from('produccion_polivalencia_detalle').delete().eq('id', detalleId)
    if (error) throw error

    setDetalle((prev) => prev.filter((d) => d.id !== detalleId))
    const persona = fila && personas.find((p) => p.id === fila.persona_id)
    if (persona) await registrarHistorial(persona, 'baja_puesto', fila.puesto_id, fila.nivel_id)
  }

  // Revalida TODOS los puestos/tareas de la persona de una sola vez (no
  // puesto por puesto) — así lo pidió el dueño del proyecto.
  async function confirmarVigencia(legajo, empresa) {
    const persona = await asegurarPersona(legajo, empresa)

    const { data, error } = await supabase
      .from('produccion_polivalencia_persona')
      .update({ fecha_confirmacion: new Date().toISOString(), confirmado_por: user.id, ...stampUpdate(user) })
      .eq('id', persona.id)
      .select()
      .single()
    if (error) throw error

    setPersonas((prev) => prev.map((p) => (p.id === persona.id ? data : p)))
    await registrarHistorial(data, 'confirmacion', null, null)
    return data
  }

  return {
    personaPorLegajo,
    detallePorPersonaId,
    cargando,
    error,
    agregarPuesto,
    cambiarNivel,
    quitarPuesto,
    confirmarVigencia,
    refrescar: cargar,
  }
}

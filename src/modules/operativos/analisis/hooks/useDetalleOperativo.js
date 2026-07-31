import { useEffect, useState } from 'react'
import { supabase } from '../../../../app/supabaseClient'

// Detalle de UN operativo puntual (persona por persona), para el
// emergente que se abre al hacer click en una fila de "Por operativo".
// citacion_detalle ya existe (la usa Operativos > Citar y la marca la
// herramienta externa de asistencia) — acá solo se lee.
export function useDetalleOperativo(fecha) {
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!fecha) {
      setDetalle(null)
      setError('')
      return
    }
    let cancelled = false

    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const { data, error: err } = await supabase
          .from('citaciones')
          .select(
            'id,fecha,tipo,dia_semana,citacion_detalle(legajo,empresa,apellido_y_nombre,desc_puesto,turno_manana,turno_tarde,ot,trabajo,situacion)'
          )
          .eq('fecha', fecha)
          .maybeSingle()
        if (err) throw err
        if (!cancelled) setDetalle(data)
      } catch (e) {
        if (!cancelled) setError('No se pudo cargar el detalle: ' + e.message)
      } finally {
        if (!cancelled) setCargando(false)
      }
    }

    cargar()
    return () => {
      cancelled = true
    }
  }, [fecha])

  return { detalle, cargando, error }
}

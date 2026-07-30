import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Personal dado de baja, para poder indicar a quién reemplaza una
// solicitud (motivo "Baja / renuncia"). No hay fecha de baja en
// `empleados` (se revisó el esquema real), así que se ordena alfabético.
export function usePersonalInactivo() {
  const [personal, setPersonal] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const { data, error: err } = await supabase
          .from('empleados')
          .select('legajo,empresa,apellido_y_nombre')
          .eq('activo', false)
          .order('apellido_y_nombre', { ascending: true })
        if (err) throw err
        if (!cancelled) setPersonal(data || [])
      } catch (e) {
        if (!cancelled) setError('No se pudo cargar el personal de baja: ' + e.message)
      } finally {
        if (!cancelled) setCargando(false)
      }
    }

    cargar()
    return () => {
      cancelled = true
    }
  }, [])

  return { personal, cargando, error }
}

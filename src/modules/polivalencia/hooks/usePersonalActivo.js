import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Personal activo con fecha_ingreso (para la regla de "persona nueva, 30
// días"). Consulta `empleados` de forma independiente — no reutiliza el
// hook de Operativos (sección 6 de CLAUDE.md: cada módulo accede a la
// tabla compartida por su cuenta).
export function usePersonalActivo() {
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
          .select('legajo,empresa,apellido_y_nombre,desc_puesto,fecha_ingreso')
          .eq('activo', true)
          .order('apellido_y_nombre', { ascending: true })
        if (err) throw err
        if (!cancelled) setPersonal(data || [])
      } catch (e) {
        if (!cancelled) setError('No se pudo cargar el personal activo: ' + e.message)
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

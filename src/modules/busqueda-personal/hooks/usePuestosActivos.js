import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Puestos vigentes hoy entre el personal activo — no se puede solicitar un
// puesto que no exista actualmente entre la gente (sección 5.2 de
// CLAUDE.md). Consulta `empleados` de forma independiente (no reutiliza el
// hook de Operativos) para no acoplar un módulo a otro.
export function usePuestosActivos() {
  const [puestos, setPuestos] = useState([])
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
          .select('desc_puesto')
          .eq('activo', true)
        if (err) throw err
        if (cancelled) return

        const unicos = [...new Set((data || []).map((e) => e.desc_puesto).filter(Boolean))].sort()
        setPuestos(unicos)
      } catch (e) {
        if (!cancelled) setError('No se pudieron cargar los puestos: ' + e.message)
      } finally {
        if (!cancelled) setCargando(false)
      }
    }

    cargar()
    return () => {
      cancelled = true
    }
  }, [])

  return { puestos, cargando, error }
}

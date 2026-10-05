import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Copia independiente del mismo patrón que useEmpleadosPlantel — cada
// módulo lee `empleados` por su cuenta (CLAUDE.md, sección 6). Se usa acá
// solo para resolver nombre/puesto de un legajo en Horas y Presentismo.
export function useEmpleadosHP() {
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setCargando(true)
      try {
        const { data } = await supabase
          .from('empleados')
          .select('legajo,apellido_y_nombre,empresa,desc_puesto')
          .eq('activo', true)
          .limit(2000)
        if (cancelled) return
        setEmpleados(data || [])
      } finally {
        if (!cancelled) setCargando(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { empleados, cargando }
}

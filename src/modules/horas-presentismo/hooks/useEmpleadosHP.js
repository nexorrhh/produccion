import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Copia independiente del mismo patrón que useEmpleadosPlantel — cada
// módulo lee `empleados` por su cuenta (CLAUDE.md, sección 6).
//
// A diferencia de Plantel (que solo le importa el personal activo HOY),
// acá se trae TODO el padrón, activo e inactivo: Horas y Presentismo
// muestra datos de períodos pasados, y alguien que ya no trabaja en la
// empresa puede perfectamente aparecer en una falta/tardanza/hora extra
// de un mes en el que todavía estaba activo. Filtrar por activo=true
// hacía que esas personas se resolvieran como "Legajo NNN / Sin
// clasificar" en vez de con su nombre y puesto real.
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
          .select('legajo,apellido_y_nombre,empresa,desc_puesto,activo')
          .limit(5000)
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

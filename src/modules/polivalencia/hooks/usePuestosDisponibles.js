import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Todos los puestos reales que existen hoy entre el personal activo
// (distinct desc_puesto de `empleados`), sin repetir — para que el
// selector de "Puesto/tarea" en Polivalencia no dependa de que alguien lo
// haya tipeado antes a mano. Consulta `empleados` de forma independiente
// (no reutiliza el hook de Búsqueda de Personal ni el de Operativos).
export function usePuestosDisponibles() {
  const [puestosEmpleados, setPuestosEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const { data, error: err } = await supabase.from('empleados').select('desc_puesto').eq('activo', true)
        if (err) throw err
        if (cancelled) return
        const unicos = [...new Set((data || []).map((e) => e.desc_puesto).filter(Boolean))].sort()
        setPuestosEmpleados(unicos)
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

  // Combina los puestos reales con lo que ya está en el catálogo de
  // Polivalencia (que puede tener "tareas" que no son un puesto formal).
  // Devuelve una lista sin duplicados: { nombre, id } — id es null cuando
  // todavía no existe como fila en produccion_puestos_polivalencia (se crea
  // recién cuando se asigna por primera vez).
  function combinarConCatalogo(catalogo) {
    const porNombre = new Map(catalogo.map((p) => [p.nombre, p]))
    const nombres = new Set([...puestosEmpleados, ...catalogo.map((p) => p.nombre)])
    return [...nombres]
      .sort((a, b) => a.localeCompare(b))
      .map((nombre) => ({ nombre, id: porNombre.get(nombre)?.id || null }))
  }

  return { puestosEmpleados, cargando, error, combinarConCatalogo }
}

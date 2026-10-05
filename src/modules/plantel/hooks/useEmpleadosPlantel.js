import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Independiente del hook de Operativos (useOperativosData): cada módulo
// accede a la tabla compartida `empleados` por su cuenta, sin pasar por el
// código de otro módulo (ver CLAUDE.md, sección 6). Solo lectura.
export function useEmpleadosPlantel() {
  const [empleados, setEmpleados] = useState([])
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [statusText, setStatusText] = useState('Cargando…')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      setStatusText('Cargando…')
      try {
        const { data, error } = await supabase
          .from('empleados')
          .select('legajo,apellido_y_nombre,empresa,desc_puesto,fecha_nacimiento,fecha_ingreso')
          .eq('activo', true)
          .order('apellido_y_nombre', { ascending: true })
          .limit(2000)
        if (error) throw error
        if (cancelled) return
        setEmpleados(data || [])
        setStatus('ok')
        setStatusText('Conectado · ' + (data || []).length + ' activos')
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setStatusText('Error: ' + err.message)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { empleados, status, statusText }
}

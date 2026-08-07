import { useEffect, useState } from 'react'
import { supabase } from '../../../../app/supabaseClient'

// Cola de citaciones pendientes de validación o rechazadas — mismo acceso
// directo a `citaciones`/`citacion_detalle` que ya usa useCitacionDeFecha
// (esta tabla no tiene RLS por RPC, a diferencia de las produccion_*).
// Quién cargó se lee directo de creado_por_nombre (columna de texto plano
// en citaciones, ver 0007). Quién rechazó no tiene esa copia todavía, así
// que se resuelve con produccion_listar_usuarios() (0001_produccion_usuarios.sql).
export function useValidacionOperativos() {
  const [pendientes, setPendientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const { data: citas, error: citErr } = await supabase
        .from('citaciones')
        .select('id,fecha,tipo,dia_semana,estado,creado_por_nombre,rechazado_por,comentario_rechazo')
        .in('estado', ['pendiente_validacion', 'rechazada'])
        .order('fecha', { ascending: false })
      if (citErr) throw citErr

      const ids = (citas || []).map((c) => c.id)
      let conteos = {}
      if (ids.length) {
        const { data: det, error: detErr } = await supabase
          .from('citacion_detalle')
          .select('citacion_id')
          .in('citacion_id', ids)
        if (detErr) throw detErr
        conteos = (det || []).reduce((acc, d) => {
          acc[d.citacion_id] = (acc[d.citacion_id] || 0) + 1
          return acc
        }, {})
      }

      const { data: usuarios } = await supabase.rpc('produccion_listar_usuarios')
      const nombrePor = new Map((usuarios || []).map((u) => [u.id, u.nombre_apellido]))

      setPendientes(
        (citas || []).map((c) => ({
          ...c,
          cantidad: conteos[c.id] || 0,
          creadoPorNombre: c.creado_por_nombre || '—',
          rechazadoPorNombre: c.rechazado_por ? nombrePor.get(c.rechazado_por) || '—' : null,
        }))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return { pendientes, cargando, error, recargar: cargar }
}

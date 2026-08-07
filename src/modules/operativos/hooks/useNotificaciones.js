import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Destinatarios del mail con el listado de convocados (config del módulo,
// no de una fecha puntual). Mismo patrón RPC que AuthContext.jsx.
export function useNotificaciones() {
  const [destinatarios, setDestinatarios] = useState([])
  const [cargando, setCargando] = useState(true)

  async function cargar() {
    setCargando(true)
    try {
      const { data, error } = await supabase.rpc('produccion_listar_notificaciones_operativos')
      if (error) throw error
      setDestinatarios(data || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function agregar(email, nombre, usuarioId) {
    const { data, error } = await supabase.rpc('produccion_agregar_notificacion_operativo', {
      p_email: email,
      p_nombre: nombre,
      p_usuario_id: usuarioId,
    })
    if (error) throw new Error(error.message)
    await cargar()
    return data?.[0]
  }

  async function actualizar(id, cambios, usuarioId) {
    const actual = destinatarios.find((d) => d.id === id)
    const { data, error } = await supabase.rpc('produccion_actualizar_notificacion_operativo', {
      p_id: id,
      p_email: cambios.email ?? actual?.email,
      p_nombre: cambios.nombre ?? actual?.nombre,
      p_activo: cambios.activo ?? actual?.activo,
      p_usuario_id: usuarioId,
    })
    if (error) throw new Error(error.message)
    await cargar()
    return data?.[0]
  }

  return { destinatarios, cargando, agregar, actualizar, recargar: cargar }
}

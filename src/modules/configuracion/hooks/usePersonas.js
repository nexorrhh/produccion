import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

export function usePersonas() {
  const [personas, setPersonas] = useState([])
  const [cargando, setCargando] = useState(true)

  const recargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase.rpc('produccion_listar_personas')
    if (!error) setPersonas(data || [])
    setCargando(false)
    return error
  }, [])

  useEffect(() => {
    recargar()
  }, [recargar])

  async function crear({ nombreApellido, rol, perfilId }, usuario) {
    const { error } = await supabase.rpc('produccion_crear_persona', {
      p_nombre_apellido: nombreApellido,
      p_rol: rol,
      p_perfil_id: perfilId || null,
      p_usuario_id: usuario.id,
    })
    if (error) throw new Error(error.message)
    await recargar()
  }

  async function actualizar(id, { rol, perfilId, activo }, usuario) {
    const { error } = await supabase.rpc('produccion_actualizar_persona', {
      p_id: id,
      p_rol: rol,
      p_perfil_id: perfilId || null,
      p_activo: activo,
      p_usuario_id: usuario.id,
    })
    if (error) throw new Error(error.message)
    await recargar()
  }

  async function eliminar(id) {
    const { error } = await supabase.rpc('produccion_eliminar_persona', { p_id: id })
    if (error) throw new Error(error.message)
    await recargar()
  }

  return { personas, cargando, recargar, crear, actualizar, eliminar }
}

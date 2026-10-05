import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

export function usePerfiles() {
  const [perfiles, setPerfiles] = useState([])
  const [cargando, setCargando] = useState(true)

  const recargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase.rpc('produccion_listar_perfiles')
    if (!error) setPerfiles(data || [])
    setCargando(false)
    return error
  }, [])

  useEffect(() => {
    recargar()
  }, [recargar])

  async function guardar({ id, nombre, descripcion, modulos }, usuario) {
    const { error } = await supabase.rpc('produccion_guardar_perfil', {
      p_id: id || null,
      p_nombre: nombre,
      p_descripcion: descripcion || null,
      p_modulos: modulos,
      p_usuario_id: usuario.id,
    })
    if (error) throw new Error(error.message)
    await recargar()
  }

  async function borrar(id) {
    const { error } = await supabase.rpc('produccion_borrar_perfil', { p_id: id })
    if (error) throw new Error(error.message)
    await recargar()
  }

  return { perfiles, cargando, recargar, guardar, borrar }
}

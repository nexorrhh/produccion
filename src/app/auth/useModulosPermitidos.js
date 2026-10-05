import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { moduleRegistry } from '../moduleRegistry'
import { useAuth } from './useAuth'

// Qué módulos (keys de moduleRegistry) ve el usuario logueado. Dos
// caminos posibles:
//   - Si tiene perfil_id asignado (módulo Configuración, desde 0016):
//     la lista de módulos sale de produccion_perfil_modulos.
//   - Si no (retrocompatibilidad con cualquier persona a la que todavía
//     no se le asignó un perfil): se sigue filtrando por `rol` contra los
//     arrays roles:[...] de moduleRegistry.jsx, exactamente como antes.
//
// "configuracion" NUNCA sale de acá — es exclusivo de rol==='superadmin',
// chequeado aparte (ver Sidebar.jsx/App.jsx), para que no se pueda
// otorgar por perfil.
export function useModulosPermitidos() {
  const { user } = useAuth()
  const [modulos, setModulos] = useState(null) // null = todavía cargando

  useEffect(() => {
    let cancelled = false

    async function cargar() {
      if (!user) {
        setModulos([])
        return
      }
      if (!user.perfil_id) {
        setModulos(moduleRegistry.filter((m) => !m.roles || m.roles.includes(user.rol)).map((m) => m.key))
        return
      }
      const { data, error } = await supabase.rpc('produccion_listar_perfiles')
      if (cancelled) return
      if (error) {
        // Si falla la consulta de perfiles, mejor no dejar a nadie sin
        // menú: se cae al chequeo por rol de siempre.
        setModulos(moduleRegistry.filter((m) => !m.roles || m.roles.includes(user.rol)).map((m) => m.key))
        return
      }
      const perfil = (data || []).find((p) => p.id === user.perfil_id)
      setModulos(perfil ? perfil.modulos : [])
    }

    cargar()
    return () => {
      cancelled = true
    }
  }, [user])

  return modulos
}

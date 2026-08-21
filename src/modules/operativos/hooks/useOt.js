import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Catálogo de Nº OT para el desplegable de Citar (config del módulo, no de
// una fecha puntual). Mismo patrón RPC que useNotificaciones.js.
export function useOt() {
  const [ots, setOts] = useState([])
  const [cargando, setCargando] = useState(true)

  async function cargar() {
    setCargando(true)
    try {
      const { data, error } = await supabase.rpc('produccion_listar_ot')
      if (error) throw error
      setOts(data || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function agregar(numero, cliente, usuarioId) {
    const { data, error } = await supabase.rpc('produccion_agregar_ot', {
      p_numero: numero,
      p_cliente: cliente,
      p_usuario_id: usuarioId,
    })
    if (error) throw new Error(error.message)
    await cargar()
    return data?.[0]
  }

  async function actualizar(id, cambios, usuarioId) {
    const actual = ots.find((o) => o.id === id)
    const { data, error } = await supabase.rpc('produccion_actualizar_ot', {
      p_id: id,
      p_numero: cambios.numero ?? actual?.numero,
      p_cliente: cambios.cliente ?? actual?.cliente,
      p_activo: cambios.activo ?? actual?.activo,
      p_usuario_id: usuarioId,
    })
    if (error) throw new Error(error.message)
    await cargar()
    return data?.[0]
  }

  return { ots, cargando, agregar, actualizar, recargar: cargar }
}

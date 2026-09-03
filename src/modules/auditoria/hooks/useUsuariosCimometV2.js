import { useEffect, useState } from 'react'
import { cimometV2 } from '../../../app/cimometV2Client'

// Solo lectura, solo id/nombre/rol — nunca password_hash aunque esté
// hasheado, no hace falta para auditoría y es un dato sensible.
export function useUsuariosCimometV2() {
  const [usuarios, setUsuarios] = useState(new Map())
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      if (!cimometV2) {
        setCargando(false)
        return
      }
      try {
        const { data, error } = await cimometV2.from('usuarios').select('id, nombre, rol')
        if (error) throw error
        if (cancelado) return
        setUsuarios(new Map((data || []).map((u) => [u.id, { nombre: u.nombre, rol: u.rol }])))
      } catch {
        // los eventos de esa fuente van a quedar "sin identificar" en vez de
        // romper toda la pantalla
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  return { usuarios, cargando }
}

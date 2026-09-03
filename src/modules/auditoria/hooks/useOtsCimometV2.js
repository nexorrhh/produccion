import { useEffect, useState } from 'react'
import { cimometV2 } from '../../../app/cimometV2Client'

// Trae TODAS las OT (activas y archivadas) — a diferencia de
// src/modules/operativos/hooks/useOt.js (que solo trae las activas, para el
// desplegable de Citar), acá hace falta poder etiquetar también eventos
// viejos de OT ya archivadas.
export function useOtsCimometV2() {
  const [ots, setOts] = useState(new Map())
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      if (!cimometV2) {
        setCargando(false)
        return
      }
      try {
        const { data, error } = await cimometV2
          .from('ots')
          .select('id, numero, archivada, proyecto:proyectos(nombre, cliente:clientes(nombre))')
        if (error) throw error
        if (cancelado) return
        setOts(
          new Map(
            (data || []).map((o) => [
              o.id,
              { numero: o.numero, cliente: o.proyecto?.cliente?.nombre || null, archivada: o.archivada },
            ])
          )
        )
      } catch {
        // los eventos quedan sin poder resolver OT ("—") en vez de romper
        // toda la pantalla
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  return { ots, cargando }
}

import { useEffect, useState } from 'react'
import { fetchTodasLasFilas } from '../lib/fetchPaginado'

const COLUMNAS =
  'legajo,fecha,periodo,tipo_hora,descripcion_tipo_hora,hs_esperadas,hs_reales,hs_trabajadas,' +
  'hs_justificadas,hs_no_justificadas'

// Solo lectura. Detalle diario de horas (una fila por persona, día y tipo
// de hora) — lo usan Novedades, Por persona y Ficha para el detalle
// día a día. Tabla grande: paginada completa (ver lib/fetchPaginado.js).
export function useHorasDetalle() {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setCargando(true)
      try {
        const data = await fetchTodasLasFilas('rrhh_horas_detalle', COLUMNAS, 'fecha')
        if (cancelled) return
        setFilas(data)
      } catch {
        // se reporta via el status general de useHorasOtDetalle
      } finally {
        if (!cancelled) setCargando(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { filas, cargando }
}

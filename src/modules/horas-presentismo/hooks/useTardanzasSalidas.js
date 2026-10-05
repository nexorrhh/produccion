import { useEffect, useState } from 'react'
import { fetchTodasLasFilas } from '../lib/fetchPaginado'

const COLUMNAS =
  'legajo,empresa,periodo,fecha,tipo,minutos,codigo_justificacion,descripcion_justificacion,genera_horas,compensable'

// Solo lectura. Tardanzas, salidas anticipadas y ausencias (tipo:
// 'tarde' | 'temprano' | 'ausente'). Lo usan Indicadores, Novedades, Por
// persona y Ficha.
export function useTardanzasSalidas() {
  const [filas, setFilas] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchTodasLasFilas('rrhh_tardanzas_salidas', COLUMNAS, 'fecha')
        if (cancelled) return
        setFilas(data)
      } catch {
        // se reporta via el status general de useHorasOtDetalle
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { filas }
}

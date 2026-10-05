import { useEffect, useState } from 'react'
import { fetchTodasLasFilas } from '../lib/fetchPaginado'

// Solo lectura: la carga del Excel de Tango sigue siendo responsabilidad
// exclusiva de Tablero_RRHH. Este módulo únicamente consulta
// rrhh_horas_mensual ya cargada (paginada completa), para cruzarla contra
// horas_ot_detalle.
export function useHorasMensual() {
  const [filas, setFilas] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchTodasLasFilas(
          'rrhh_horas_mensual',
          'legajo,empresa,periodo,hs_normales,hs_extra50,hs_extra100,hs_vac_trabajadas',
          'periodo'
        )
        if (cancelled) return
        setFilas(data)
      } catch {
        // Cruce de Horas simplemente queda vacío de este lado si falla;
        // el banner de estado ya lo reporta useHorasOtDetalle.
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { filas }
}

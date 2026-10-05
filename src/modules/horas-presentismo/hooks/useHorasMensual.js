import { useEffect, useState } from 'react'
import { fetchTodasLasFilas } from '../lib/fetchPaginado'

const COLUMNAS =
  'legajo,apellido,nombre,condicion,departamento,empresa,periodo,hs_esperadas,hs_normales,hs_extra50,' +
  'hs_extra100,hs_justificadas,hs_no_justificadas,hs_ausencias,hs_vac_esperadas,hs_vac_trabajadas,' +
  'dias_laborables,dias_presentes,dias_ausentes_nojust,presentismo_pct,cumplimiento_hs_pct'

// Solo lectura: la carga del Excel de Tango sigue siendo responsabilidad
// exclusiva de Tablero_RRHH. Este módulo únicamente consulta
// rrhh_horas_mensual ya cargada (paginada completa) — la usan Cruce de
// Horas, Indicadores, Por persona, Novedades y Ficha.
export function useHorasMensual() {
  const [filas, setFilas] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchTodasLasFilas('rrhh_horas_mensual', COLUMNAS, 'periodo')
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

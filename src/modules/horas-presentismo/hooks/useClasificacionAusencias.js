import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Solo lectura: la clasificación de códigos de justificación de Tango en
// las 5 categorías de ausentismo se administra desde Tablero_RRHH
// (Parametrización). Acá solo se consulta para mostrar la categoría.
export function useClasificacionAusencias() {
  const [mapaCategoria, setMapaCategoria] = useState(new Map())
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setCargando(true)
      try {
        const { data } = await supabase.from('rrhh_justificacion_config').select('codigo_justificacion,categoria')
        if (cancelled) return
        const mapa = new Map()
        ;(data || []).forEach((f) => mapa.set(f.codigo_justificacion, f.categoria))
        setMapaCategoria(mapa)
      } finally {
        if (!cancelled) setCargando(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { mapaCategoria, cargando }
}

export function categoriaAusencia(codigo, mapaCategoria) {
  return mapaCategoria.get(codigo) || 'sin_clasificar'
}

export const CATEGORIAS_AUSENCIA = [
  { key: 'enfermedad', label: 'Enfermedad' },
  { key: 'accidente', label: 'Accidente' },
  { key: 'licencia', label: 'Licencia' },
  { key: 'aviso', label: 'Aviso' },
  { key: 'sin_aviso', label: 'Sin aviso' },
  { key: 'sin_clasificar', label: 'Sin clasificar' },
]

import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'
import { normPuesto } from '../lib/clasificacionPuesto'

// Solo lectura: la clasificación de puestos se administra desde
// Tablero_RRHH, este módulo únicamente la consulta.
export function useClasificacionPuestosPlantel() {
  const [mapaClasif, setMapaClasif] = useState(new Map())

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase.from('rrhh_puestos_config').select('desc_puesto,tipo')
      if (cancelled) return
      const mapa = new Map()
      ;(data || []).forEach((f) => mapa.set(normPuesto(f.desc_puesto), f.tipo))
      setMapaClasif(mapa)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return mapaClasif
}

import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'

// Solo lectura. v_ausentismo_tipo es una vista propia de Supabase (no
// definida en este repo) con el ausentismo agregado por período y tipo de
// novedad.
export function useAusentismoTipo() {
  const [filas, setFilas] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase.from('v_ausentismo_tipo').select('periodo,tipo,hs_total')
      if (cancelled) return
      setFilas(data || [])
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { filas }
}

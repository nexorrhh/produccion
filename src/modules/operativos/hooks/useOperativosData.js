import { useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'
import { esGerencia } from '../lib/clasificacion'

// Mismo comportamiento que init() en docs/reference/citaciones.html:
// personal activo (sin gerencia), cumplimiento histórico y clasificación
// mensual/quincenal de puestos.
export function useOperativosData() {
  const [empleados, setEmpleados] = useState([])
  const [cumplimiento, setCumplimiento] = useState({})
  const [mapaClasif, setMapaClasif] = useState(new Map())
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [statusText, setStatusText] = useState('Conectando…')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      setStatusText('Cargando…')
      try {
        const { data: empleadosData, error: eErr } = await supabase
          .from('empleados')
          .select('legajo,empresa,apellido_y_nombre,desc_puesto')
          .eq('activo', true)
          .order('apellido_y_nombre', { ascending: true })
          .limit(2000)
        if (eErr) throw eErr

        const filtrados = (empleadosData || []).filter((e) => !esGerencia(e.desc_puesto))

        const { data: cumplData } = await supabase.from('v_cumplimiento_persona').select('*')
        const cumplMap = {}
        ;(cumplData || []).forEach((c) => {
          cumplMap[c.legajo + '|' + c.empresa] = c
        })

        const { data: clasifData } = await supabase
          .from('rrhh_puestos_config')
          .select('desc_puesto,tipo')
        const clasifMap = new Map()
        ;(clasifData || []).forEach((f) => clasifMap.set(f.desc_puesto, f.tipo))

        if (cancelled) return
        setEmpleados(filtrados)
        setCumplimiento(cumplMap)
        setMapaClasif(clasifMap)
        setStatus('ok')
        setStatusText('Conectado · ' + filtrados.length + ' activos')
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setStatusText('Error: ' + err.message)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { empleados, cumplimiento, mapaClasif, status, statusText }
}

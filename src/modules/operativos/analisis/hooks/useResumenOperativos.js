import { useEffect, useState } from 'react'
import { supabase } from '../../../../app/supabaseClient'

const CAMPOS_NUM_FECHA = ['convocados', 'presentes', 'ausentes', 'no_convocados', 'pct_cumplimiento']
const CAMPOS_NUM_PERSONA = ['convocado', 'presente', 'ausente', 'no_convocado', 'pct_cumplimiento']

function normalizar(filas, campos) {
  return (filas || []).map((f) => {
    const copia = { ...f }
    campos.forEach((c) => {
      copia[c] = Number(copia[c]) || 0
    })
    return copia
  })
}

// v_resumen_fecha y v_cumplimiento_persona ya existen en Supabase (las usa
// hoy Tablero_RRHH) — acá solo se leen, de solo lectura. `situacion` en
// citacion_detalle la marca esa otra herramienta; este módulo no escribe
// asistencia.
export function useResumenOperativos() {
  const [porFecha, setPorFecha] = useState([])
  const [porPersona, setPorPersona] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const [
          { data: fechaData, error: fechaErr },
          { data: personaData, error: personaErr },
          { data: empleadosData },
        ] = await Promise.all([
          supabase.from('v_resumen_fecha').select('*'),
          supabase.from('v_cumplimiento_persona').select('*'),
          // Solo para poder filtrar "por persona" por puesto actual — la
          // vista de cumplimiento no trae desc_puesto.
          supabase.from('empleados').select('legajo,empresa,desc_puesto').eq('activo', true),
        ])
        if (fechaErr) throw fechaErr
        if (personaErr) throw personaErr
        if (cancelled) return

        const puestoPorPersona = new Map(
          (empleadosData || []).map((e) => [e.legajo + '|' + e.empresa, e.desc_puesto])
        )
        const personaConPuesto = (personaData || []).map((p) => ({
          ...p,
          desc_puesto: puestoPorPersona.get(p.legajo + '|' + p.empresa) || '',
        }))

        setPorFecha(normalizar(fechaData, CAMPOS_NUM_FECHA))
        setPorPersona(normalizar(personaConPuesto, CAMPOS_NUM_PERSONA))
      } catch (e) {
        if (!cancelled) setError('No se pudo cargar el resumen de operativos: ' + e.message)
      } finally {
        if (!cancelled) setCargando(false)
      }
    }

    cargar()
    return () => {
      cancelled = true
    }
  }, [])

  return { porFecha, porPersona, cargando, error }
}

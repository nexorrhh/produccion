import { useEffect, useState } from 'react'
import { fetchTodasLasFilas } from '../lib/fetchPaginado'

// Solo lectura: la carga del Excel "Capataz" sigue siendo responsabilidad
// exclusiva de Tablero_RRHH. Este módulo únicamente consulta
// horas_ot_detalle ya cargada en Supabase (paginada completa, ver
// lib/fetchPaginado.js).
export function useHorasOtDetalle() {
  const [filas, setFilas] = useState([])
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [statusText, setStatusText] = useState('Cargando…')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      setStatusText('Cargando…')
      try {
        const data = await fetchTodasLasFilas(
          'horas_ot_detalle',
          'periodo,fecha,empresa,legajo,nombre,operacion,proyecto_num,proyecto_nombre,cliente,ot,horas,anomalo',
          'periodo'
        )
        if (cancelled) return
        setFilas(data)
        setStatus('ok')
        setStatusText('Conectado · ' + data.length + ' registros')
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

  return { filas, status, statusText }
}

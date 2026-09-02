import { useEffect, useState } from 'react'
import { cimometV2 } from '../../../app/cimometV2Client'

// Catálogo de OT activas para el desplegable de Citar — se lee en vivo de
// la base de cimomet-v2 (proyecto de Supabase distinto al de este panel),
// solo SELECT, nunca se escribe ahí. Con la suscripción a
// postgres_changes, si en cimomet-v2 dan de alta o archivan una OT se
// refleja acá sin recargar la página.
export function useOt() {
  const [ots, setOts] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  async function cargar() {
    if (!cimometV2) {
      setCargando(false)
      return
    }
    setCargando(true)
    setError('')
    try {
      const { data, error: err } = await cimometV2
        .from('ots')
        .select('id, numero, proyecto:proyectos(nombre, cliente:clientes(nombre))')
        .eq('archivada', false)
        .order('numero')
      if (err) throw err
      setOts(
        (data || []).map((o) => ({
          id: o.id,
          numero: o.numero,
          cliente: o.proyecto?.cliente?.nombre || '—',
        }))
      )
    } catch (e) {
      setError('No se pudieron cargar las OT de cimomet-v2: ' + e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    if (!cimometV2) return

    const canal = cimometV2
      .channel('panel-produccion-ots')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ots' }, () => cargar())
      .subscribe()

    return () => {
      cimometV2.removeChannel(canal)
    }
  }, [])

  return { ots, cargando, error }
}

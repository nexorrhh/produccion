import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../app/supabaseClient'
import { useAuth } from '../../../app/auth/useAuth'
import { stampCreate } from '../../../app/lib/audit'

// Catálogos propios de Polivalencia (no se reutilizan
// habilidades_catalogo/puestos_catalogo — tienen otra información).
export function useCatalogosPolivalencia() {
  const { user } = useAuth()
  const [niveles, setNiveles] = useState([])
  const [puestos, setPuestos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [{ data: nivelesData, error: nivelesErr }, { data: puestosData, error: puestosErr }] =
        await Promise.all([
          supabase
            .from('produccion_niveles_polivalencia')
            .select('id,nombre,orden')
            .eq('activo', true)
            .order('orden', { ascending: true }),
          supabase
            .from('produccion_puestos_polivalencia')
            .select('id,nombre')
            .eq('activo', true)
            .order('nombre', { ascending: true }),
        ])
      if (nivelesErr) throw nivelesErr
      if (puestosErr) throw puestosErr
      setNiveles(nivelesData || [])
      setPuestos(puestosData || [])
    } catch (e) {
      setError('No se pudieron cargar los catálogos: ' + e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Crea un puesto/tarea nuevo en el catálogo (arranca vacío, se carga
  // desde la app a medida que hace falta).
  async function crearPuesto(nombre) {
    const { data, error } = await supabase
      .from('produccion_puestos_polivalencia')
      .insert({ nombre: nombre.trim(), ...stampCreate(user) })
      .select()
      .single()
    if (error) throw error
    setPuestos((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return data
  }

  return { niveles, puestos, cargando, error, crearPuesto, refrescar: cargar }
}

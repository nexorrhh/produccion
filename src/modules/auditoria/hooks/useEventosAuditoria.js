import { useCallback, useEffect, useState } from 'react'
import { cimometV2 } from '../../../app/cimometV2Client'
import { FUENTES, FUENTES_SOLO_CONTEO } from '../lib/fuentesAuditoria'
import { useUsuariosCimometV2 } from './useUsuariosCimometV2'
import { useOtsCimometV2 } from './useOtsCimometV2'

function diasAtrasISO(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// Pide cada fuente de fuentesAuditoria.js POR SEPARADO, con su propio
// try/catch — si una tabla/columna no existe con ese nombre, esa fuente
// puntual queda registrada en erroresPorFuente y el resto de la pantalla
// sigue funcionando. Nunca escribe nada: todas las consultas acá son
// select-only (ver plan del módulo).
export function useEventosAuditoria({ diasRango = 30 } = {}) {
  const { usuarios } = useUsuariosCimometV2()
  const { ots } = useOtsCimometV2()
  const [eventos, setEventos] = useState([])
  const [conteos, setConteos] = useState([])
  const [erroresPorFuente, setErroresPorFuente] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    if (!cimometV2) {
      setCargando(false)
      return
    }
    setCargando(true)
    const desde = diasAtrasISO(diasRango)
    const errores = []
    const todos = []

    for (const fuente of FUENTES) {
      try {
        const { data, error } = await cimometV2
          .from(fuente.tabla)
          .select(fuente.columnas)
          .gte(fuente.columnaFecha, desde)
          .order(fuente.columnaFecha, { ascending: false })
          .limit(500)
        if (error) throw error

        ;(data || []).forEach((row) => {
          const fecha = row[fuente.columnaFecha] || (fuente.columnaFechaAlt ? row[fuente.columnaFechaAlt] : null)
          if (!fecha) return

          let autorNombre = null
          let autorRol = null
          if (fuente.autorTipo === 'fk') {
            const idAutor = row[fuente.columnaAutor] ?? (fuente.columnaAutorAlt ? row[fuente.columnaAutorAlt] : null)
            const u = idAutor ? usuarios.get(idAutor) : null
            autorNombre = u?.nombre || null
            autorRol = u?.rol || null
          } else if (fuente.autorTipo === 'texto') {
            autorNombre = row[fuente.columnaAutor] || null
          }

          const otId = fuente.columnaOt ? row[fuente.columnaOt] : null
          const ot = otId ? ots.get(otId) || null : null

          todos.push({
            id: fuente.tabla + '-' + row.id,
            tabla: fuente.tabla,
            sector: fuente.sector,
            fecha,
            autorNombre,
            autorRol,
            ot,
            descripcion: fuente.descripcion(row),
          })
        })
      } catch (err) {
        errores.push({
          tabla: fuente.tabla,
          sector: fuente.sector,
          mensaje: err.message,
          incierta: !!fuente.notaColumnaIncierta,
        })
      }
    }

    todos.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))

    const conteosResultado = []
    for (const fc of FUENTES_SOLO_CONTEO) {
      try {
        const { count, error } = await cimometV2.from(fc.tabla).select('*', { count: 'exact', head: true })
        if (error) throw error
        conteosResultado.push({ tabla: fc.tabla, sector: fc.sector, descripcion: fc.descripcion, cantidad: count })
      } catch (err) {
        errores.push({ tabla: fc.tabla, sector: fc.sector, mensaje: err.message })
      }
    }

    setEventos(todos)
    setConteos(conteosResultado)
    setErroresPorFuente(errores)
    setCargando(false)
  }, [diasRango, usuarios, ots])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { eventos, conteos, erroresPorFuente, cargando, recargar: cargar }
}

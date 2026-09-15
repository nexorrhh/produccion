import { useCallback, useEffect, useState } from 'react'
import { cimometV2 } from '../../../app/cimometV2Client'
import { FUENTES } from '../lib/fuentesAuditoria'
import { useUsuariosCimometV2 } from './useUsuariosCimometV2'
import { useOtsCimometV2 } from './useOtsCimometV2'

// Rango [00:00, 24:00) del día pedido, en hora local del navegador.
function rangoDelDia(fechaISO) {
  const desde = new Date(fechaISO + 'T00:00:00')
  const hasta = new Date(fechaISO + 'T00:00:00')
  hasta.setDate(hasta.getDate() + 1)
  return { desde: desde.toISOString(), hasta: hasta.toISOString() }
}

// Pide cada fuente de fuentesAuditoria.js POR SEPARADO, con su propio
// try/catch, acotado a UN SOLO DÍA — si una tabla/columna no existe con ese
// nombre, esa fuente puntual queda registrada en erroresPorFuente y el resto
// de la pantalla sigue funcionando. Nunca escribe nada: todas las consultas
// acá son select-only (ver plan del módulo).
export function useEventosAuditoria({ fecha }) {
  const { usuarios } = useUsuariosCimometV2()
  const { ots } = useOtsCimometV2()
  const [eventos, setEventos] = useState([])
  const [erroresPorFuente, setErroresPorFuente] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    if (!cimometV2) {
      setCargando(false)
      return
    }
    setCargando(true)
    const { desde, hasta } = rangoDelDia(fecha)
    const errores = []
    const todos = []

    for (const fuente of FUENTES) {
      try {
        const { data, error } = await cimometV2
          .from(fuente.tabla)
          .select(fuente.columnas)
          .gte(fuente.columnaFecha, desde)
          .lt(fuente.columnaFecha, hasta)
          .order(fuente.columnaFecha, { ascending: false })
          .limit(300)
        if (error) throw error

        ;(data || []).forEach((row) => {
          const filaFecha = row[fuente.columnaFecha] || (fuente.columnaFechaAlt ? row[fuente.columnaFechaAlt] : null)
          if (!filaFecha) return

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
            fecha: filaFecha,
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

    setEventos(todos)
    setErroresPorFuente(errores)
    setCargando(false)
  }, [fecha, usuarios, ots])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { eventos, erroresPorFuente, cargando, recargar: cargar }
}

import { supabase } from '../../../app/supabaseClient'

const TAMANO_PAGINA = 1000

// Supabase/PostgREST tiene un límite por defecto de filas por request
// (db-max-rows, normalmente 1000) que corta el resultado EN SILENCIO sin
// avisar error, aunque se pida .limit(N) con N más grande. Para una
// herramienta de control (cruce de horas) esto es crítico: si se pierden
// períodos viejos sin avisar, el cruce queda incompleto sin que se note.
// Se pagina con .range() hasta que una página vuelve incompleta.
export async function fetchTodasLasFilas(tabla, columnas, columnaOrden) {
  let desde = 0
  let todas = []
  for (;;) {
    const { data, error } = await supabase
      .from(tabla)
      .select(columnas)
      .order(columnaOrden, { ascending: false })
      .range(desde, desde + TAMANO_PAGINA - 1)
    if (error) throw error
    todas = todas.concat(data || [])
    if (!data || data.length < TAMANO_PAGINA) break
    desde += TAMANO_PAGINA
  }
  return todas
}

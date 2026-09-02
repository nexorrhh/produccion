import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_CIMOMETV2_SUPABASE_URL
const anonKey = import.meta.env.VITE_CIMOMETV2_SUPABASE_ANON_KEY

// A diferencia de supabaseClient.js, esta conexión es opcional: es a un
// proyecto de Supabase externo (cimomet-v2, no "Legajos Cimomet/Comoing")
// para leer en modo solo-lectura el catálogo de OT. Si faltan las
// variables no rompe el resto de la app — el desplegable de OT
// simplemente queda vacío (ver useOt.js).
export const cimometV2 = url && anonKey ? createClient(url, anonKey) : null

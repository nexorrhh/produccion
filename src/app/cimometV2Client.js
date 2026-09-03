import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_CIMOMETV2_SUPABASE_URL
const anonKey = import.meta.env.VITE_CIMOMETV2_SUPABASE_ANON_KEY

// A diferencia de supabaseClient.js, esta conexión es opcional: es a un
// proyecto de Supabase externo (cimomet-v2, no "Legajos Cimomet/Comoing"),
// en modo SOLO LECTURA — lo usan el desplegable de OT (useOt.js) y el
// módulo de Auditoría (src/modules/auditoria). Si faltan las variables no
// rompe el resto de la app, cada consumidor degrada solo (desplegable
// vacío / pantalla de auditoría avisando que falta la config).
export const cimometV2 = url && anonKey ? createClient(url, anonKey) : null

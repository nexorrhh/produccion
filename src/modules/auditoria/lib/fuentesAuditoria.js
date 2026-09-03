// Registro de fuentes para el Panel de Auditoría — solo lectura contra la
// base de cimomet-v2 (ver src/app/cimometV2Client.js). Cada entrada describe
// una tabla: de dónde sacar fecha/autor/OT/descripción de cada fila.
//
// Los campos marcados con `notaColumnaIncierta: true` son mi mejor estimación
// a partir de columnas hermanas que sí confirma el documento de traspaso, NO
// una certeza — se van a corregir contra los errores reales que tire Supabase
// (ver ErroresFuentes.jsx), mismo criterio iterativo que usamos para la Edge
// Function del mail de Operativos.
//
// autorTipo:
//   'fk'     -> la columna es un id que hay que resolver contra `usuarios`
//   'texto'  -> la columna ya es el nombre/rol en texto plano
//   'ninguno'-> no hay autor identificable en esta fuente

export const SECTORES = [
  { key: 'fabricacion', label: 'Fabricación' },
  { key: 'calidad', label: 'Calidad' },
  { key: 'pintura', label: 'Pintura' },
  { key: 'ingenieria', label: 'Ingeniería' },
  { key: 'talleres', label: 'Talleres externos' },
  { key: 'despacho', label: 'Despacho' },
  { key: 'horas', label: 'Horas' },
]

export const FUENTES = [
  {
    tabla: 'inspeccion_eventos',
    sector: 'calidad',
    columnas: 'id, fecha, inspector_id, ot_id, tipo, accion, texto',
    columnaFecha: 'fecha',
    autorTipo: 'fk',
    columnaAutor: 'inspector_id',
    columnaOt: 'ot_id',
    descripcion: (r) => r.tipo || r.accion || r.texto || 'Evento de inspección',
  },
  {
    tabla: 'historial_inspecciones_end',
    sector: 'calidad',
    columnas: 'id, fecha, inspector_id, ot_id, accion, estado_anterior, estado_nuevo, texto',
    columnaFecha: 'fecha',
    autorTipo: 'fk',
    columnaAutor: 'inspector_id',
    columnaOt: 'ot_id',
    descripcion: (r) => {
      const cambio = r.estado_anterior || r.estado_nuevo ? `${r.estado_anterior ?? '?'} → ${r.estado_nuevo ?? '?'}` : ''
      return [r.accion, cambio, r.texto].filter(Boolean).join(' · ') || 'Evento de END'
    },
  },
  {
    tabla: 'lote_eventos',
    sector: 'pintura',
    columnas: 'id, fecha, levantada_at, inspector_id, levantada_por, ot_id, tipo',
    columnaFecha: 'fecha',
    columnaFechaAlt: 'levantada_at',
    autorTipo: 'fk',
    columnaAutor: 'inspector_id',
    columnaAutorAlt: 'levantada_por',
    columnaOt: 'ot_id',
    descripcion: (r) => r.tipo || 'Evento de lote de pintura',
  },
  {
    tabla: 'historial_documento',
    sector: 'ingenieria',
    columnas: 'id, fecha, creado_por, ot_id, accion, tipo, texto',
    columnaFecha: 'fecha',
    autorTipo: 'texto',
    columnaAutor: 'creado_por',
    columnaOt: 'ot_id',
    descripcion: (r) => r.accion || r.tipo || r.texto || 'Evento de documento',
    notaColumnaIncierta: true,
  },
  {
    tabla: 'packing_list_historial',
    sector: 'ingenieria',
    columnas: 'id, fecha, usuario, ot_id, tipo, accion',
    columnaFecha: 'fecha',
    autorTipo: 'texto',
    columnaAutor: 'usuario',
    columnaOt: 'ot_id',
    descripcion: (r) => r.tipo || r.accion || 'Carga de packing list',
  },
  {
    tabla: 'horas_ultima_carga',
    sector: 'horas',
    columnas: 'id, fecha_carga, cargado_por',
    columnaFecha: 'fecha_carga',
    autorTipo: 'texto',
    columnaAutor: 'cargado_por',
    descripcion: () => 'Carga de horas (Excel del capataz)',
  },
  {
    tabla: 'revisiones_documento',
    sector: 'ingenieria',
    columnas: 'id, fecha_emision, creado_por, ot_id, estado, tipo',
    columnaFecha: 'fecha_emision',
    autorTipo: 'texto',
    columnaAutor: 'creado_por',
    columnaOt: 'ot_id',
    descripcion: (r) => r.estado || r.tipo || 'Revisión de documento',
  },
  {
    tabla: 'avances_produccion',
    sector: 'fabricacion',
    columnas: 'id, fecha_inicio, actualizado_por, ot_id, porcentaje, proceso',
    columnaFecha: 'fecha_inicio',
    autorTipo: 'fk',
    columnaAutor: 'actualizado_por',
    columnaOt: 'ot_id',
    descripcion: (r) =>
      [r.proceso, r.porcentaje != null ? `${r.porcentaje}%` : null].filter(Boolean).join(' · ') ||
      'Avance de producción',
  },
  {
    tabla: 'despachos',
    sector: 'despacho',
    columnas: 'id, fecha, creado_por, ot_id',
    columnaFecha: 'fecha',
    autorTipo: 'fk',
    columnaAutor: 'creado_por',
    columnaOt: 'ot_id',
    descripcion: () => 'Despacho',
    notaColumnaIncierta: true,
  },
  {
    tabla: 'talleres_paquetes',
    sector: 'talleres',
    columnas: 'id, cerrado_en, cerrado_por, ot_id',
    columnaFecha: 'cerrado_en',
    autorTipo: 'texto',
    columnaAutor: 'cerrado_por',
    columnaOt: 'ot_id',
    descripcion: () => 'Cierre de paquete de taller externo',
    notaColumnaIncierta: true,
  },
  {
    tabla: 'horas_ingenieria',
    sector: 'ingenieria',
    columnas: 'id, fecha, creado_por, colaborador_id, horas',
    columnaFecha: 'fecha',
    autorTipo: 'texto',
    columnaAutor: 'creado_por',
    descripcion: (r) => (r.horas != null ? `${r.horas} hs cargadas` : 'Horas de ingeniería'),
    notaColumnaIncierta: true,
  },
  {
    tabla: 'lotes',
    sector: 'pintura',
    columnas: 'id, fecha, inspector_id, ot_id',
    columnaFecha: 'fecha',
    autorTipo: 'fk',
    columnaAutor: 'inspector_id',
    columnaOt: 'ot_id',
    descripcion: () => 'Alta de lote de pintura',
    notaColumnaIncierta: true,
  },
  {
    tabla: 'lote_capas',
    sector: 'pintura',
    columnas: 'id, fecha, inspector_id, ot_id',
    columnaFecha: 'fecha',
    autorTipo: 'fk',
    columnaAutor: 'inspector_id',
    columnaOt: 'ot_id',
    descripcion: () => 'Capa de pintura registrada',
    notaColumnaIncierta: true,
  },
]

// Sin autor ni fecha por fila (se borra e inserta en bloque en cada carga de
// Excel, según el documento) — no encajan como "evento con fecha", se cuentan
// en vez de listarse fila por fila.
export const FUENTES_SOLO_CONTEO = [
  {
    tabla: 'horas_realizadas',
    sector: 'horas',
    descripcion: 'Registros de horas cargados (sin autor/fecha por fila — ver Horas Última Carga)',
  },
]

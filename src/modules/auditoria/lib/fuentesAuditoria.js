// Registro de fuentes para el Panel de Auditoría — solo lectura contra la
// base de cimomet-v2 (ver src/app/cimometV2Client.js).
//
// Todas las columnas de acá fueron VERIFICADAS contra el schema real vía la
// API REST de Supabase (select * limit 1, de solo lectura) y contra el
// código fuente de cimomet-v2 — no son suposiciones. Quedan comentarios
// puntuales donde algo relevante salió de esa verificación.
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
    // Confirmado (id, inspeccion_id, fecha, accion, texto, inspector_id,
    // lote_id) — no existen "tipo" ni "ot_id" en esta tabla.
    tabla: 'inspeccion_eventos',
    sector: 'calidad',
    columnas: 'id, fecha, inspector_id, accion, texto',
    columnaFecha: 'fecha',
    autorTipo: 'fk',
    columnaAutor: 'inspector_id',
    descripcion: (r) => r.accion || r.texto || 'Evento de inspección',
  },
  {
    // Confirmado (id, inspeccion_end_id, fecha, inspector_id, accion,
    // estado_anterior, estado_nuevo, texto).
    tabla: 'historial_inspecciones_end',
    sector: 'calidad',
    columnas: 'id, fecha, inspector_id, accion, estado_anterior, estado_nuevo, texto',
    columnaFecha: 'fecha',
    autorTipo: 'fk',
    columnaAutor: 'inspector_id',
    descripcion: (r) => {
      const cambio = r.estado_anterior || r.estado_nuevo ? `${r.estado_anterior ?? '?'} → ${r.estado_nuevo ?? '?'}` : ''
      return [r.accion, cambio, r.texto].filter(Boolean).join(' · ') || 'Evento de END'
    },
  },
  {
    // Confirmado (id, lote_id, fecha, tipo, texto, inspector_id,
    // levantada_at, levantada_por) — no existe "ot_id" (la OT se resuelve
    // vía lote_id → lotes.ot_id, fuera de alcance de esta vuelta).
    tabla: 'lote_eventos',
    sector: 'pintura',
    columnas: 'id, fecha, levantada_at, inspector_id, levantada_por, tipo',
    columnaFecha: 'fecha',
    columnaFechaAlt: 'levantada_at',
    autorTipo: 'fk',
    columnaAutor: 'inspector_id',
    columnaAutorAlt: 'levantada_por',
    descripcion: (r) => r.tipo || 'Evento de lote de pintura',
  },
  {
    // Verificado en el código fuente de cimomet-v2: NINGÚN componente
    // inserta en esta tabla hoy (solo hay un SELECT filtrando por
    // documento_id, en ModalRevisionesDocumento.js) y está vacía en
    // Supabase. No hay columna de autor confirmada en ningún lado del
    // código — se deja al mínimo verificado (id/fecha/documento_id) en vez
    // de inventar un nombre de columna.
    tabla: 'historial_documento',
    sector: 'ingenieria',
    columnas: 'id, fecha, documento_id',
    columnaFecha: 'fecha',
    autorTipo: 'ninguno',
    descripcion: () => 'Evento de documento (sin autor identificable — tabla sin escritura activa en el código actual)',
  },
  {
    // Confirmado vía el insert real en components/VistaIngenieria.js:
    // ot_id, usuario, listas_corte_nuevas, listas_corte_revisadas,
    // cant_creadas, cant_actualizadas, cant_eliminadas, detalle.
    // No existen "tipo" ni "accion".
    tabla: 'packing_list_historial',
    sector: 'ingenieria',
    columnas: 'id, fecha, usuario, ot_id, cant_creadas, cant_actualizadas, cant_eliminadas',
    columnaFecha: 'fecha',
    autorTipo: 'texto',
    columnaAutor: 'usuario',
    columnaOt: 'ot_id',
    descripcion: (r) =>
      [
        r.cant_creadas ? `${r.cant_creadas} creadas` : null,
        r.cant_actualizadas ? `${r.cant_actualizadas} actualizadas` : null,
        r.cant_eliminadas ? `${r.cant_eliminadas} eliminadas` : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'Carga de packing list',
  },
  {
    // Confirmado (id, nombre_archivo, fecha_carga, cargado_por,
    // total_registros, total_ots_detectadas).
    tabla: 'horas_ultima_carga',
    sector: 'horas',
    columnas: 'id, fecha_carga, cargado_por, nombre_archivo, total_registros, total_ots_detectadas',
    columnaFecha: 'fecha_carga',
    autorTipo: 'texto',
    columnaAutor: 'cargado_por',
    descripcion: (r) =>
      `Carga de horas: ${r.total_registros ?? '?'} registros, ${r.total_ots_detectadas ?? '?'} OTs (${r.nombre_archivo || 'archivo'})`,
  },
  {
    // Confirmado vía insert real en ModalRevisionesDocumento.js: documento_id,
    // numero, fecha_emision, estado, creado_por, observaciones. No existe "tipo".
    tabla: 'revisiones_documento',
    sector: 'ingenieria',
    columnas: 'id, fecha_emision, creado_por, estado, numero',
    columnaFecha: 'fecha_emision',
    autorTipo: 'texto',
    columnaAutor: 'creado_por',
    descripcion: (r) => `Revisión ${r.numero ?? '?'}: ${r.estado || 'sin estado'}`,
  },
  {
    // Confirmado (id, pieza_id, subpieza_id, proceso_id, porcentaje,
    // fecha_inicio, actualizado_por, actualizado_en, version). Se usa
    // actualizado_en (no fecha_inicio) como fecha del evento: fecha_inicio
    // es una fecha de negocio que puede quedar fija, actualizado_en es
    // cuándo se tocó la fila de verdad. proceso_id se resuelve con un join
    // a procesos (no existe una columna "proceso" plana).
    tabla: 'avances_produccion',
    sector: 'fabricacion',
    columnas: 'id, actualizado_en, actualizado_por, porcentaje, proceso:procesos(nombre)',
    columnaFecha: 'actualizado_en',
    autorTipo: 'fk',
    columnaAutor: 'actualizado_por',
    descripcion: (r) =>
      [r.proceso?.nombre, r.porcentaje != null ? `${r.porcentaje}%` : null].filter(Boolean).join(' · ') ||
      'Avance de producción',
  },
  {
    // Confirmado (id, ot_id, fecha, creado_por, observaciones, activo).
    tabla: 'despachos',
    sector: 'despacho',
    columnas: 'id, fecha, creado_por, ot_id, observaciones, activo',
    columnaFecha: 'fecha',
    autorTipo: 'fk',
    columnaAutor: 'creado_por',
    columnaOt: 'ot_id',
    descripcion: (r) => (r.activo === false ? 'Despacho (anulado)' : r.observaciones || 'Despacho'),
  },
  {
    // Confirmado (id, ot_id, fabricante_id, nombre, cerrado, cerrado_en,
    // cerrado_por, reabierto_en, reabierto_por, notas, creado_en).
    // Nota: si un paquete se reabre después de cerrado, esa reapertura
    // (reabierto_en/reabierto_por) no se modela como evento separado en
    // esta primera vuelta — solo se audita el cierre.
    tabla: 'talleres_paquetes',
    sector: 'talleres',
    columnas: 'id, cerrado_en, cerrado_por, ot_id, nombre',
    columnaFecha: 'cerrado_en',
    autorTipo: 'texto',
    columnaAutor: 'cerrado_por',
    columnaOt: 'ot_id',
    descripcion: (r) => 'Cierre de paquete de taller' + (r.nombre ? `: ${r.nombre}` : ''),
  },
  {
    // Confirmado (id, ot_id, colaborador_id, actividad_id, fecha, horas,
    // descripcion, creado_en, creado_por). Se usa creado_en (cuándo se
    // tipeó) en vez de fecha (a qué día corresponden las horas, puede
    // cargarse días después) como fecha del evento de auditoría.
    tabla: 'horas_ingenieria',
    sector: 'ingenieria',
    columnas: 'id, creado_en, creado_por, ot_id, horas, descripcion',
    columnaFecha: 'creado_en',
    autorTipo: 'texto',
    columnaAutor: 'creado_por',
    columnaOt: 'ot_id',
    descripcion: (r) => (r.horas != null ? `${r.horas} hs — ${r.descripcion || 'sin descripción'}` : 'Horas de ingeniería'),
  },
  {
    // Confirmado (id, ot_id, nombre, fecha, min_val, max_val, promedio,
    // estado, inspector_id, observaciones, tipo, observacion).
    tabla: 'lotes',
    sector: 'pintura',
    columnas: 'id, fecha, inspector_id, ot_id, nombre, tipo, estado',
    columnaFecha: 'fecha',
    autorTipo: 'fk',
    columnaAutor: 'inspector_id',
    columnaOt: 'ot_id',
    descripcion: (r) => `Lote ${r.nombre ?? ''} (${r.tipo || '—'}) — ${r.estado || 'sin estado'}`,
  },
  {
    // Confirmado (id, lote_id, nombre, fecha, min_val, max_val, promedio,
    // observacion, inspector_id) — no existe "ot_id" acá (se resolvería
    // vía lote_id → lotes.ot_id, fuera de alcance de esta vuelta).
    tabla: 'lote_capas',
    sector: 'pintura',
    columnas: 'id, fecha, inspector_id, nombre',
    columnaFecha: 'fecha',
    autorTipo: 'fk',
    columnaAutor: 'inspector_id',
    descripcion: (r) => 'Capa de pintura' + (r.nombre ? `: ${r.nombre}` : ''),
  },
]

// Sin autor por fila (confirmado: columnas reales id, ot_id,
// nombre_operacion, hs_acumuladas, ultima_actualizacion — ninguna de autor).
// Redundante como "evento" con horas_ultima_carga (misma carga masiva), así
// que se cuenta en vez de listarse fila por fila.
export const FUENTES_SOLO_CONTEO = [
  {
    tabla: 'horas_realizadas',
    sector: 'horas',
    descripcion: 'Registros de horas cargados (sin autor por fila — ver Horas Última Carga)',
  },
]

// PENDIENTE DE MIGRACIÓN, NO SE CONSULTA TODAVÍA: avances_produccion_historial
// (Armado/Soldadura por evento, sección 7 del documento de traspaso). Se
// verificó contra la API real de Supabase (07/09) y la tabla NO EXISTE
// todavía — devuelve PGRST205 "Could not find the table". Falta correr
// fix_historial_avances_produccion.sql en el proyecto de cimomet-v2 antes
// de poder sumar esta fuente. No se mockean datos de Armado/Soldadura en
// su lugar.

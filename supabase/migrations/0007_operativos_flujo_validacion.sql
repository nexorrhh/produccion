-- Operativos — flujo de validación (el supervisor de planta carga, Javier/
-- Valentín valida y recién ahí se dispara el mail oficial con el listado).
-- Correr manualmente en el SQL Editor de Supabase (proyecto "Legajos Cimomet/Comoing").
-- El alta de los supervisores va en 0008_usuarios_supervisores_planta.sql.

-- citaciones ya existe y la usa también docs/reference/citaciones.html —
-- se agregan columnas nullable para el flujo de validación, sin tocar
-- filas existentes ni romper ningún select * externo (mismo criterio
-- no-breaking que 0005_solicitudes_personal_reemplazo.sql).
-- creado_por_nombre es una copia de texto plano del nombre de quien cargó
-- la citación (además de creado_por, el uuid) — produccion_usuarios tiene
-- RLS cerrada (solo se lee vía RPC), así que sin esta copia un lector
-- externo (ej. el tablero de RRHH) vería un uuid pelado en vez de un
-- nombre. Se completa al guardar, no requiere join para consultarla.
alter table citaciones
  add column if not exists creado_por uuid references produccion_usuarios (id),
  add column if not exists creado_por_nombre text,
  add column if not exists validado_por uuid references produccion_usuarios (id),
  add column if not exists validado_en timestamptz,
  add column if not exists rechazado_por uuid references produccion_usuarios (id),
  add column if not exists rechazado_en timestamptz,
  add column if not exists comentario_rechazo text;

-- Valores de "estado" a partir de ahora: 'pendiente_validacion' (recién
-- guardada por quien la cargó), 'validada' (Javier o Valentín aprobó y se
-- envió el mail oficial), 'rechazada' (devuelta a quien la cargó, con
-- comentario en comentario_rechazo). El valor histórico 'abierta' queda
-- tal cual en las filas viejas — no se pisa nada retroactivamente, y
-- ningún consumidor existente depende de ese valor (verificado: el HTML
-- de referencia nunca lo lee, solo lo escribe siempre en 'abierta').

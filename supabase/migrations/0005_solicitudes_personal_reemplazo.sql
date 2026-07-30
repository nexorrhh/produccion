-- Búsqueda de Personal — reemplazo de baja
-- Correr manualmente en el SQL Editor de Supabase (proyecto "Legajos Cimomet/Comoing").
-- Solo agrega columnas nullable a la tabla existente solicitudes_personal —
-- no toca RLS ni datos existentes, no rompe ningún `select *` que ya
-- exista en el tablero de Directorio / Tablero_RRHH.

alter table solicitudes_personal
  add column if not exists reemplazo_legajo integer,
  add column if not exists reemplazo_empresa text,
  add column if not exists reemplazo_nombre text;

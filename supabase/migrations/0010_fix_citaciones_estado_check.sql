-- Fix: citaciones ya tenía un check constraint (citaciones_estado_check)
-- que solo permitía estado = 'abierta' (el único valor que escribía el
-- sistema viejo). No se detectó antes de sumar los estados nuevos del
-- flujo de validación en 0007_operativos_flujo_validacion.sql, así que
-- Supabase rechazaba cualquier guardado con 'pendiente_validacion'.
-- Se reemplaza por uno que admite los 4 valores en uso (el histórico
-- 'abierta' + los 3 nuevos) — es seguro correr esto, no toca filas
-- existentes, solo la regla de validación de la columna.

alter table citaciones drop constraint if exists citaciones_estado_check;

alter table citaciones
  add constraint citaciones_estado_check
  check (estado in ('abierta', 'pendiente_validacion', 'validada', 'rechazada'));

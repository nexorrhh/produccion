-- Suma borrado real de un destinatario del listado (0006 solo dejaba
-- activar/desactivar). Hace falta para poder sacar un email cargado mal
-- (typo), no solo desactivarlo.
-- Correr manualmente en el SQL Editor de Supabase.

create or replace function produccion_eliminar_notificacion_operativo(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from produccion_config_notificaciones_operativos where id = p_id;
$$;

grant execute on function produccion_eliminar_notificacion_operativo(uuid) to anon;

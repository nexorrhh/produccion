-- Panel de Producción — Eliminar una persona de produccion_usuarios
-- Correr manualmente en el SQL Editor de Supabase, después de 0016.
--
-- Hasta ahora Configuración → Personas solo permitía desactivar (activo =
-- false), no borrar de verdad. Un borrado real puede chocar con el rastro
-- de auditoría que esa persona dejó en otras tablas (citaciones.creado_por,
-- produccion_perfiles.creado_por, etc. — todas referencian
-- produccion_usuarios.id). En vez de intentar enumerar cada tabla que
-- podría referenciarla, se deja que Postgres avise solo con una violación
-- de llave foránea, y se la traduce a un mensaje entendible.
create or replace function produccion_eliminar_persona(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from produccion_usuarios where id = p_id;
exception
  when foreign_key_violation then
    raise exception 'No se puede borrar: esta persona ya generó actividad en el sistema (citaciones, aprobaciones, perfiles creados, etc.). Desactivala en vez de borrarla.';
end;
$$;

grant execute on function produccion_eliminar_persona(uuid) to anon;

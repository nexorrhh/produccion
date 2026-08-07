-- Corrige "column reference is ambiguous" al agregar/actualizar un
-- destinatario del listado (0006_produccion_notificaciones_operativos.sql).
-- El RETURNING sin alias chocaba con los nombres de columna declarados en
-- RETURNS TABLE (id, email, nombre, activo) — mismo problema que ya se
-- había evitado correctamente en produccion_crear_pin (0001), que sí usa
-- alias. Acá se aplica el mismo criterio.
-- Es seguro volver a correr esto — reemplaza las funciones existentes.

create or replace function produccion_agregar_notificacion_operativo(
  p_email text,
  p_nombre text,
  p_usuario_id uuid
)
returns table (id uuid, email text, nombre text, activo boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'El email no tiene un formato válido';
  end if;

  return query
    insert into produccion_config_notificaciones_operativos as t (email, nombre, creado_por)
    values (lower(trim(p_email)), nullif(trim(p_nombre), ''), p_usuario_id)
    returning t.id, t.email, t.nombre, t.activo;
end;
$$;

create or replace function produccion_actualizar_notificacion_operativo(
  p_id uuid,
  p_email text,
  p_nombre text,
  p_activo boolean,
  p_usuario_id uuid
)
returns table (id uuid, email text, nombre text, activo boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'El email no tiene un formato válido';
  end if;

  return query
    update produccion_config_notificaciones_operativos as t
    set email = lower(trim(p_email)),
        nombre = nullif(trim(p_nombre), ''),
        activo = p_activo,
        modificado_por = p_usuario_id,
        modificado_en = now()
    where t.id = p_id
    returning t.id, t.email, t.nombre, t.activo;
end;
$$;

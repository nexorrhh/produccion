-- Operativos — destinatarios del mail con el listado de convocados
-- Correr manualmente en el SQL Editor de Supabase (proyecto "Legajos Cimomet/Comoing").
-- No toca ninguna tabla existente de otros sistemas.

create table if not exists produccion_config_notificaciones_operativos (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text,                           -- opcional, ej. "RRHH" — para identificar a quién corresponde
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  creado_por uuid references produccion_usuarios (id),
  modificado_en timestamptz,
  modificado_por uuid references produccion_usuarios (id)
);

-- RLS cerrado: el cliente solo entra por las funciones RPC de abajo. La
-- Edge Function que manda el mail lee esta tabla directo con la service
-- role key (bypassea RLS), no pasa por estas funciones.
alter table produccion_config_notificaciones_operativos enable row level security;

-- Trae todas (activas e inactivas) para la pantalla de configuración —
-- hace falta ver las inactivas para poder reactivarlas.
create or replace function produccion_listar_notificaciones_operativos()
returns table (id uuid, email text, nombre text, activo boolean)
language sql
security definer
set search_path = public
as $$
  select id, email, nombre, activo
  from produccion_config_notificaciones_operativos
  order by activo desc, coalesce(nombre, email);
$$;

grant execute on function produccion_listar_notificaciones_operativos() to anon;

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
    insert into produccion_config_notificaciones_operativos (email, nombre, creado_por)
    values (lower(trim(p_email)), nullif(trim(p_nombre), ''), p_usuario_id)
    returning id, email, nombre, activo;
end;
$$;

grant execute on function produccion_agregar_notificacion_operativo(text, text, uuid) to anon;

-- Cubre editar, activar y desactivar. No hay borrado físico para no perder
-- el rastro de auditoría (quién y cuándo lo dio de baja).
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
    update produccion_config_notificaciones_operativos
    set email = lower(trim(p_email)),
        nombre = nullif(trim(p_nombre), ''),
        activo = p_activo,
        modificado_por = p_usuario_id,
        modificado_en = now()
    where id = p_id
    returning id, email, nombre, activo;
end;
$$;

grant execute on function produccion_actualizar_notificacion_operativo(uuid, text, text, boolean, uuid) to anon;

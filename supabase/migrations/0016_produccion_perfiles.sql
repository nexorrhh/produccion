-- Panel de Producción — Perfiles de permisos (módulo Configuración)
-- Correr manualmente en el SQL Editor de Supabase, después de 0015.
--
-- Separación deliberada entre dos cosas distintas que hasta ahora vivían
-- mezcladas en `rol`:
--   - `rol` sigue gobernando permisos de NEGOCIO dentro de cada módulo
--     (quién puede aprobar una citación en Operativos, etc. — ver
--     lib/permisos.js de cada módulo). No se toca su significado.
--   - `perfil_id` (nuevo) gobierna, de forma configurable desde el
--     módulo Configuración, QUÉ MÓDULOS aparecen en el menú para cada
--     persona. Reemplaza los arrays `roles: [...]` hardcodeados en
--     moduleRegistry.jsx por algo que un superadmin puede crear/editar
--     sin tocar código.
--
-- Retrocompatible a propósito: si a alguien no se le asignó perfil
-- todavía (perfil_id null), el frontend sigue filtrando por `rol` como
-- hacía hasta ahora (ver useModulosPermitidos.js).

create table if not exists produccion_perfiles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text,
  creado_en timestamptz not null default now(),
  creado_por uuid references produccion_usuarios (id),
  modificado_en timestamptz,
  modificado_por uuid references produccion_usuarios (id)
);

create table if not exists produccion_perfil_modulos (
  perfil_id uuid not null references produccion_perfiles (id) on delete cascade,
  modulo_key text not null,
  primary key (perfil_id, modulo_key)
);

alter table produccion_perfiles enable row level security;
alter table produccion_perfil_modulos enable row level security;

alter table produccion_usuarios
  add column if not exists perfil_id uuid references produccion_perfiles (id);

-- El módulo "configuracion" en sí NUNCA se asigna vía perfil — es
-- exclusivo de rol = 'superadmin' (chequeo hardcodeado en el frontend),
-- para que un superadmin no pueda sin querer regalarle a otro perfil la
-- capacidad de administrar permisos.

-- 1) Listar perfiles con sus módulos — lo usan tanto la pantalla
--    Configuración como el frontend para resolver qué ve cada usuario
--    logueado.
create or replace function produccion_listar_perfiles()
returns table (id uuid, nombre text, descripcion text, modulos text[])
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.nombre,
    p.descripcion,
    coalesce(array_agg(pm.modulo_key) filter (where pm.modulo_key is not null), '{}')
  from produccion_perfiles p
  left join produccion_perfil_modulos pm on pm.perfil_id = p.id
  group by p.id, p.nombre, p.descripcion
  order by p.nombre;
$$;

grant execute on function produccion_listar_perfiles() to anon;

-- 2) Crear (p_id null) o editar (p_id con valor) un perfil, reemplazando
--    su lista de módulos por completo.
create or replace function produccion_guardar_perfil(
  p_id uuid,
  p_nombre text,
  p_descripcion text,
  p_modulos text[],
  p_usuario_id uuid
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El perfil necesita un nombre';
  end if;

  if p_id is null then
    insert into produccion_perfiles (nombre, descripcion, creado_por)
    values (btrim(p_nombre), p_descripcion, p_usuario_id)
    returning produccion_perfiles.id into v_id;
  else
    update produccion_perfiles as pf
    set nombre = btrim(p_nombre),
        descripcion = p_descripcion,
        modificado_por = p_usuario_id,
        modificado_en = now()
    where pf.id = p_id
    returning pf.id into v_id;

    if v_id is null then
      raise exception 'Ese perfil no existe';
    end if;
  end if;

  delete from produccion_perfil_modulos where perfil_id = v_id;
  insert into produccion_perfil_modulos (perfil_id, modulo_key)
  select v_id, m from unnest(coalesce(p_modulos, '{}')) as m;

  return query select v_id;
end;
$$;

grant execute on function produccion_guardar_perfil(uuid, text, text, text[], uuid) to anon;

-- 3) Borrar un perfil — bloqueado si hay personas usándolo, para no
--    dejar a nadie sin menú de un día para el otro por accidente.
create or replace function produccion_borrar_perfil(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from produccion_usuarios where perfil_id = p_id) then
    raise exception 'Hay personas con este perfil asignado — reasignalas antes de borrarlo';
  end if;
  delete from produccion_perfiles where id = p_id;
end;
$$;

grant execute on function produccion_borrar_perfil(uuid) to anon;

-- 4) Listar personas para la pantalla Configuración → Personas (incluye
--    inactivas, para poder reactivarlas).
create or replace function produccion_listar_personas()
returns table (
  id uuid,
  nombre_apellido text,
  rol text,
  activo boolean,
  tiene_pin boolean,
  perfil_id uuid,
  perfil_nombre text
)
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    u.nombre_apellido,
    u.rol,
    u.activo,
    (u.pin is not null) as tiene_pin,
    u.perfil_id,
    pf.nombre
  from produccion_usuarios u
  left join produccion_perfiles pf on pf.id = u.perfil_id
  order by u.nombre_apellido;
$$;

grant execute on function produccion_listar_personas() to anon;

-- 5) Dar de alta una persona nueva, sin PIN (lo define ella sola la
--    primera vez que entra, como ya pasa hoy).
create or replace function produccion_crear_persona(
  p_nombre_apellido text,
  p_rol text,
  p_perfil_id uuid,
  p_usuario_id uuid
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_nombre_apellido is null or btrim(p_nombre_apellido) = '' then
    raise exception 'Hace falta un nombre y apellido';
  end if;

  insert into produccion_usuarios (nombre_apellido, rol, perfil_id, creado_por)
  values (btrim(p_nombre_apellido), coalesce(p_rol, 'gerente_produccion'), p_perfil_id, p_usuario_id)
  returning produccion_usuarios.id into v_id;

  return query select v_id;
end;
$$;

grant execute on function produccion_crear_persona(text, text, uuid, uuid) to anon;

-- 6) Editar rol / perfil / activo de una persona existente.
create or replace function produccion_actualizar_persona(
  p_id uuid,
  p_rol text,
  p_perfil_id uuid,
  p_activo boolean,
  p_usuario_id uuid
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  update produccion_usuarios as u
  set rol = coalesce(p_rol, u.rol),
      perfil_id = p_perfil_id,
      activo = coalesce(p_activo, u.activo),
      modificado_por = p_usuario_id,
      modificado_en = now()
  where u.id = p_id;

  if not found then
    raise exception 'Esa persona no existe';
  end if;

  return query select p_id;
end;
$$;

grant execute on function produccion_actualizar_persona(uuid, text, uuid, boolean, uuid) to anon;

-- Login: produccion_verificar_pin y produccion_crear_pin ahora también
-- devuelven perfil_id, para que el frontend sepa qué menú armar apenas
-- se loguea (antes solo devolvían id/nombre_apellido/rol). Postgres no
-- deja cambiar las columnas de un RETURNS TABLE con CREATE OR REPLACE —
-- hay que borrar la función vieja primero.
drop function if exists produccion_verificar_pin(uuid, text);
drop function if exists produccion_crear_pin(uuid, text);

create function produccion_verificar_pin(p_id uuid, p_pin text)
returns table (id uuid, nombre_apellido text, rol text, perfil_id uuid)
language sql
security definer
set search_path = public
as $$
  select id, nombre_apellido, rol, perfil_id
  from produccion_usuarios
  where id = p_id and pin = p_pin and activo = true;
$$;

grant execute on function produccion_verificar_pin(uuid, text) to anon;

create function produccion_crear_pin(p_id uuid, p_pin text)
returns table (id uuid, nombre_apellido text, rol text, perfil_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'El PIN debe ser de 4 dígitos';
  end if;

  return query
    update produccion_usuarios u
    set pin = p_pin, modificado_en = now()
    where u.id = p_id and u.pin is null and u.activo = true
    returning u.id, u.nombre_apellido, u.rol, u.perfil_id;

  if not found then
    raise exception 'Ese perfil ya tiene un PIN definido o no existe';
  end if;
end;
$$;

grant execute on function produccion_crear_pin(uuid, text) to anon;

-- Perfiles iniciales, calcados de lo que cada rol ve HOY vía los arrays
-- `roles: [...]` de moduleRegistry.jsx, para que migrar a este sistema no
-- le cambie el menú a nadie de entrada.
insert into produccion_perfiles (nombre, descripcion)
values
  ('Gerencia', 'Acceso completo a todos los módulos del panel.'),
  ('Supervisor de planta', 'Solo Gestión de Operativos (Citar).')
on conflict (nombre) do nothing;

insert into produccion_perfil_modulos (perfil_id, modulo_key)
select p.id, m.key
from produccion_perfiles p
cross join (values
  ('operativos'), ('busqueda-personal'), ('polivalencia'), ('plantel'), ('horas-presentismo'), ('auditoria')
) as m(key)
where p.nombre = 'Gerencia'
on conflict do nothing;

insert into produccion_perfil_modulos (perfil_id, modulo_key)
select p.id, 'operativos'
from produccion_perfiles p
where p.nombre = 'Supervisor de planta'
on conflict do nothing;

update produccion_usuarios
set perfil_id = (select id from produccion_perfiles where nombre = 'Gerencia')
where nombre_apellido in ('Hernández, Javier Andrés', 'Angulo, Valentín Eduardo');

update produccion_usuarios
set perfil_id = (select id from produccion_perfiles where nombre = 'Supervisor de planta')
where nombre_apellido in ('Puzzangara, Miguel Carlos', 'Lallana, Leonardo Ariel');

-- Angulo, Valentín pasa a superadmin: conserva el perfil "Gerencia" (ve
-- todo lo mismo que hoy) y además desbloquea el módulo Configuración,
-- que es exclusivo de este rol (no se asigna por perfil).
update produccion_usuarios
set rol = 'superadmin'
where nombre_apellido = 'Angulo, Valentín Eduardo';

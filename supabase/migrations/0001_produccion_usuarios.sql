-- Panel de Producción — módulo de autenticación por PIN
-- Correr manualmente en el SQL Editor de Supabase (proyecto "Legajos Cimomet/Comoing").
-- No toca ninguna tabla existente de otros sistemas.

create table if not exists produccion_usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre_apellido text not null unique,
  pin text,                              -- null hasta que la persona lo define
  rol text not null default 'gerente_produccion',
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  creado_por uuid references produccion_usuarios (id),
  modificado_en timestamptz,
  modificado_por uuid references produccion_usuarios (id)
);

-- RLS cerrado: nadie puede hacer SELECT/INSERT/UPDATE/DELETE directo con la
-- anon key. Todo el acceso pasa por las funciones RPC de abajo, ninguna de
-- las cuales expone el pin de nadie.
alter table produccion_usuarios enable row level security;

-- Perfiles activos que todavía NO definieron su PIN. La app usa esto para
-- ofrecer "Crear mi PIN" — solo expone nombre, nunca si el pin existe con
-- qué valor.
create or replace function produccion_usuarios_sin_pin()
returns table (id uuid, nombre_apellido text)
language sql
security definer
set search_path = public
as $$
  select id, nombre_apellido
  from produccion_usuarios
  where pin is null and activo = true
  order by nombre_apellido;
$$;

grant execute on function produccion_usuarios_sin_pin() to anon;

-- Define el PIN por primera vez. Solo funciona si ese perfil todavía no
-- tiene uno (pin is null) — así cada persona elige el suyo una sola vez,
-- de forma anónima: ni el dueño del proyecto ni nadie más lo define ni lo
-- ve. Si el perfil ya tiene PIN, no actualiza nada (para cambiarlo hace
-- falta un flujo aparte, todavía no definido).
create or replace function produccion_crear_pin(p_id uuid, p_pin text)
returns table (id uuid, nombre_apellido text, rol text)
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
    returning u.id, u.nombre_apellido, u.rol;

  if not found then
    raise exception 'Ese perfil ya tiene un PIN definido o no existe';
  end if;
end;
$$;

grant execute on function produccion_crear_pin(uuid, text) to anon;

-- Verifica el PIN en el login normal y devuelve el usuario (sin el pin) si
-- matchea y está activo. SECURITY DEFINER: corre con permisos del dueño de
-- la función, no con los del rol anon, por eso puede leer la tabla aunque
-- RLS la tenga cerrada para todo lo demás.
create or replace function produccion_verificar_pin(p_pin text)
returns table (id uuid, nombre_apellido text, rol text)
language sql
security definer
set search_path = public
as $$
  select id, nombre_apellido, rol
  from produccion_usuarios
  where pin = p_pin and activo = true;
$$;

grant execute on function produccion_verificar_pin(text) to anon;

-- Perfiles iniciales (sección 4 de CLAUDE.md), sin PIN — cada uno lo
-- define la primera vez que entra, desde "Crear mi PIN".
insert into produccion_usuarios (nombre_apellido, pin, rol)
values
  ('Hernández, Javier', null, 'gerente_produccion'),
  ('Angulo, Valentín Eduardo', null, 'admin_sistema')
on conflict (nombre_apellido) do nothing;

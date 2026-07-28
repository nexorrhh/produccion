-- Panel de Producción — módulo de autenticación por PIN
-- Correr manualmente en el SQL Editor de Supabase (proyecto "Legajos Cimomet/Comoing").
-- No toca ninguna tabla existente de otros sistemas.

create table if not exists produccion_usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre_apellido text not null,
  pin text not null,
  rol text not null default 'gerente_produccion',
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  creado_por uuid references produccion_usuarios (id),
  modificado_en timestamptz,
  modificado_por uuid references produccion_usuarios (id)
);

-- RLS cerrado: nadie puede hacer SELECT/INSERT/UPDATE/DELETE directo con la
-- anon key. El único acceso permitido es a través de la función RPC de abajo.
alter table produccion_usuarios enable row level security;

-- Verifica un PIN de 4 dígitos y devuelve el usuario (sin el pin) si matchea
-- y está activo. SECURITY DEFINER: corre con permisos del dueño de la
-- función, no con los del rol anon, por eso puede leer la tabla aunque RLS
-- la tenga cerrada para todo lo demás.
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

-- Usuarios iniciales (sección 4 de CLAUDE.md). PIN placeholder '0000' —
-- IMPORTANTE: actualizar con el PIN real de cada persona antes de usar el
-- login en serio, por ejemplo:
--   update produccion_usuarios set pin = '1234' where nombre_apellido = 'Hernández, Javier';
insert into produccion_usuarios (nombre_apellido, pin, rol)
values
  ('Hernández, Javier', '0000', 'gerente_produccion'),
  ('Angulo, Valentín Eduardo', '0000', 'admin_sistema')
on conflict do nothing;

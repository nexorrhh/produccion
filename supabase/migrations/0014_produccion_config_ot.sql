-- Catálogo de Nº OT para el desplegable de Operativos → Citar. No se
-- hardcodea en el código (sección 8 de CLAUDE.md) para poder agregar/sacar
-- una OT sin tocar el frontend — se administra desde una pantalla nueva
-- ("OT disponibles"), mismo patrón que
-- 0006_produccion_notificaciones_operativos.sql.
-- Correr manualmente en el SQL Editor de Supabase.

create table if not exists produccion_config_ot (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique,
  cliente text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  creado_por uuid references produccion_usuarios (id),
  modificado_en timestamptz,
  modificado_por uuid references produccion_usuarios (id)
);

alter table produccion_config_ot enable row level security;

create or replace function produccion_listar_ot()
returns table (id uuid, numero integer, cliente text, activo boolean)
language sql
security definer
set search_path = public
as $$
  select id, numero, cliente, activo
  from produccion_config_ot
  order by activo desc, numero;
$$;

grant execute on function produccion_listar_ot() to anon;

create or replace function produccion_agregar_ot(
  p_numero integer,
  p_cliente text,
  p_usuario_id uuid
)
returns table (id uuid, numero integer, cliente text, activo boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    insert into produccion_config_ot as t (numero, cliente, creado_por)
    values (p_numero, trim(p_cliente), p_usuario_id)
    returning t.id, t.numero, t.cliente, t.activo;
end;
$$;

grant execute on function produccion_agregar_ot(integer, text, uuid) to anon;

-- Cubre editar y activar/desactivar. Sin borrado físico, para no perder el
-- rastro de auditoría (mismo criterio que produccion_actualizar_notificacion_operativo).
create or replace function produccion_actualizar_ot(
  p_id uuid,
  p_numero integer,
  p_cliente text,
  p_activo boolean,
  p_usuario_id uuid
)
returns table (id uuid, numero integer, cliente text, activo boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    update produccion_config_ot as t
    set numero = p_numero,
        cliente = trim(p_cliente),
        activo = p_activo,
        modificado_por = p_usuario_id,
        modificado_en = now()
    where t.id = p_id
    returning t.id, t.numero, t.cliente, t.activo;
end;
$$;

grant execute on function produccion_actualizar_ot(uuid, integer, text, boolean, uuid) to anon;

insert into produccion_config_ot (numero, cliente) values
  (546, 'Techint'),
  (550, 'YPF'),
  (551, 'YPF'),
  (582, 'SACDE'),
  (583, 'MMIT'),
  (584, 'PECOM'),
  (592, 'SACDE'),
  (595, 'AESA'),
  (596, 'AESA'),
  (597, 'YPF'),
  (598, 'SACDE'),
  (563, 'Supercemento (ex 435)')
on conflict (numero) do nothing;

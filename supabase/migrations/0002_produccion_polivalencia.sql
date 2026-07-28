-- Panel de Producción — módulo Polivalencia
-- Correr manualmente en el SQL Editor de Supabase (proyecto "Legajos Cimomet/Comoing").
-- No toca ninguna tabla existente de otros sistemas. No reutiliza
-- habilidades_catalogo/puestos_catalogo (tienen otra información) — son
-- catálogos nuevos con prefijo produccion_.
--
-- A diferencia de produccion_usuarios, estas tablas no guardan credenciales
-- sino información de negocio (como citaciones), así que quedan con el
-- mismo criterio abierto que el resto del sistema: sin RLS habilitado.

-- ── Catálogos ────────────────────────────────────────────────────────────

create table if not exists produccion_niveles_polivalencia (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null,
  activo boolean not null default true,
  creado_por uuid references produccion_usuarios (id),
  creado_en timestamptz not null default now(),
  modificado_por uuid references produccion_usuarios (id),
  modificado_en timestamptz
);

-- Escala de autonomía para cubrir OTRO puesto (no el propio): de menor a
-- mayor independencia respecto de la supervisión.
insert into produccion_niveles_polivalencia (nombre, orden)
values
  ('Iniciando', 1),
  ('Con apoyo', 2),
  ('Autónomo', 3)
on conflict (nombre) do nothing;

-- Puestos/tareas asignables en la matriz. Arranca vacío — se carga desde
-- la propia app a medida que hace falta (no se precarga en esta migración).
create table if not exists produccion_puestos_polivalencia (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  creado_por uuid references produccion_usuarios (id),
  creado_en timestamptz not null default now(),
  modificado_por uuid references produccion_usuarios (id),
  modificado_en timestamptz
);

-- ── Vigencia por persona ───────────────────────────────────────────────

-- Una fila por persona (legajo+empresa). fecha_confirmacion se actualiza
-- cada vez que se confirma vigencia; confirmar revalida TODOS los puestos
-- asignados a esa persona de una sola vez, no puesto por puesto.
create table if not exists produccion_polivalencia_persona (
  id uuid primary key default gen_random_uuid(),
  legajo integer not null,
  empresa text not null,
  fecha_definicion timestamptz not null default now(),
  fecha_confirmacion timestamptz,
  definido_por uuid references produccion_usuarios (id),
  confirmado_por uuid references produccion_usuarios (id),
  creado_por uuid references produccion_usuarios (id),
  creado_en timestamptz not null default now(),
  modificado_por uuid references produccion_usuarios (id),
  modificado_en timestamptz,
  unique (legajo, empresa)
);

-- ── La matriz en sí ──────────────────────────────────────────────────────

create table if not exists produccion_polivalencia_detalle (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references produccion_polivalencia_persona (id) on delete cascade,
  puesto_id uuid not null references produccion_puestos_polivalencia (id),
  nivel_id uuid not null references produccion_niveles_polivalencia (id),
  creado_por uuid references produccion_usuarios (id),
  creado_en timestamptz not null default now(),
  modificado_por uuid references produccion_usuarios (id),
  modificado_en timestamptz,
  unique (persona_id, puesto_id)
);

-- ── Historial de cambios ─────────────────────────────────────────────────

create table if not exists produccion_polivalencia_historial (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references produccion_polivalencia_persona (id) on delete set null,
  legajo integer not null,
  empresa text not null,
  puesto_id uuid references produccion_puestos_polivalencia (id),
  nivel_id uuid references produccion_niveles_polivalencia (id),
  accion text not null check (accion in ('definicion', 'confirmacion', 'cambio_nivel', 'baja_puesto')),
  registrado_por uuid references produccion_usuarios (id),
  registrado_en timestamptz not null default now()
);

-- Corrige un RLS activado por error en las tablas de Polivalencia.
-- Por diseño (ver 0002_produccion_polivalencia.sql) estas tablas quedan
-- con el mismo criterio abierto que el resto del sistema (sin RLS) — no
-- guardan credenciales como produccion_usuarios, que sí lo tiene cerrado
-- a propósito.
-- Es seguro correr esto aunque alguna de estas tablas nunca haya tenido
-- RLS habilitado: disable no falla si ya estaba deshabilitado.

alter table produccion_niveles_polivalencia disable row level security;
alter table produccion_puestos_polivalencia disable row level security;
alter table produccion_polivalencia_persona disable row level security;
alter table produccion_polivalencia_detalle disable row level security;
alter table produccion_polivalencia_historial disable row level security;

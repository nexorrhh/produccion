-- Renombra la escala de niveles de Polivalencia de Básico/Intermedio/Experto
-- a Iniciando/Con apoyo/Autónomo, para dejar más claro que es sobre la
-- autonomía para cubrir OTRO puesto (no el propio), no sobre reemplazar el
-- puesto habitual de la persona.
--
-- Seguro de correr tanto si ya habías aplicado 0002_produccion_polivalencia.sql
-- con los nombres viejos (los actualiza) como si todavía no lo corriste (no
-- hace nada, porque esas filas no existen — la migración 0002 ya quedó
-- actualizada con los nombres nuevos para cuando la corras).

update produccion_niveles_polivalencia set nombre = 'Iniciando'  where nombre = 'Básico';
update produccion_niveles_polivalencia set nombre = 'Con apoyo'  where nombre = 'Intermedio';
update produccion_niveles_polivalencia set nombre = 'Autónomo'   where nombre = 'Experto';

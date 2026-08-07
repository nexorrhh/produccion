-- Fix (segunda vuelta): 0010 intentó reemplazar citaciones_estado_check
-- por una lista de 4 valores, pero falló porque ya hay filas viejas en
-- citaciones con algún otro valor de estado que no está documentado en
-- ningún lado de este proyecto (la tabla es anterior y age posiblemente
-- la toca algún otro proceso además del HTML de referencia).
-- En vez de seguir adivinando la lista completa de valores históricos, se
-- saca el constraint sin reponerlo: no borra ni modifica ninguna fila, y
-- el control de qué valores son válidos para "estado" ya lo maneja el
-- código de la app (ver useCitacionDeFecha.js), no hace falta duplicarlo
-- como regla de base de datos.

alter table citaciones drop constraint if exists citaciones_estado_check;

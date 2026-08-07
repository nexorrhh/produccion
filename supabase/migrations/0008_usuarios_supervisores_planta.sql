-- Corrige el nombre completo de Javier y da de alta a los dos supervisores
-- de planta que van a generar los operativos de los sábados desde Citar
-- (vista Supervisor — sin acceso a Análisis/Validación/Destinatarios del
-- listado ni a Búsqueda de Personal, eso lo sigue manejando Javier).
-- Correr manualmente en el SQL Editor de Supabase, después de 0007.

update produccion_usuarios
set nombre_apellido = 'Hernández, Javier Andrés'
where nombre_apellido = 'Hernández, Javier';

insert into produccion_usuarios (nombre_apellido, pin, rol)
values
  ('Puzzangara, Miguel Carlos', null, 'supervisor_planta'),
  ('Lallana, Leonardo Ariel', null, 'supervisor_planta')
on conflict (nombre_apellido) do nothing;

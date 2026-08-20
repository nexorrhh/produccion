-- Blanquea el PIN de Leonardo y Carlos para que puedan volver a definirlo
-- desde "Crear mi PIN" en el login (produccion_crear_pin solo funciona si
-- pin is null).
-- Correr manualmente en el SQL Editor de Supabase.

update produccion_usuarios
set pin = null
where nombre_apellido in ('Lallana, Leonardo Ariel', 'Puzzangara, Miguel Carlos');

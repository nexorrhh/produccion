-- Igual que creado_por_nombre (0007): RRHH necesita saber quién validó el
-- operativo (Javier o Valentín) para poder mostrarlo en su propio tablero,
-- sin depender de un join contra produccion_usuarios (RLS cerrada, solo
-- accesible vía RPC).

alter table citaciones
  add column if not exists validado_por_nombre text;

-- Agrega el campo de logo (SVG como texto) a la tabla de clientes.
-- Correr esto en el SQL Editor de Supabase antes de desplegar el código nuevo.

alter table clients add column if not exists "logoSvg" text;

-- Necesaria para que renombrar un cliente base (de los 8 originales) no
-- deje un duplicado con los valores viejos al recargar — sin esto, el
-- mecanismo de reconciliación empareja por nombre, y el nombre es
-- justo lo que cambia en un renombre.
alter table clients add column if not exists "baseKey" text;

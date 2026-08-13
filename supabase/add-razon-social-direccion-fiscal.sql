-- Campos nuevos para el "Dirigido a" de las facturas — razón social y
-- dirección fiscal, distintos del nombre corto que ya usa el resto de la
-- app. Correr en el SQL Editor de Supabase.

alter table clients add column if not exists "razonSocial" text;
alter table clients add column if not exists "direccionFiscal" text;

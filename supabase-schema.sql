-- Tabla de contactos/leads que llegan por WhatsApp.
-- Ejecutar en Supabase → SQL Editor → New query.

create table whatsapp_leads (
  id uuid default gen_random_uuid() primary key,
  fecha timestamptz default now(),
  nombre text,
  telefono text,
  mensaje text,
  categoria text,
  estado text default 'Nuevo',
  monto numeric,
  fuente text default 'WhatsApp Bot'
);

-- Seguridad: nadie puede leer/escribir desde el navegador directamente.
-- Solo el backend (con la service_role key, nunca expuesta) puede tocar esta tabla.
alter table whatsapp_leads enable row level security;

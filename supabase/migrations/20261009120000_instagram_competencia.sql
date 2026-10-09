-- Instagram de la competencia (09-oct-2026). APLICADA el 09-oct-2026 con la herramienta de Supabase.
-- Datos públicos leídos por la vía oficial de Meta (Business Discovery) con la Edge Function
-- instagram-competencia. Las 4 tablas tienen RLS activo y NINGUNA política: el navegador
-- (anon/authenticated) no puede leerlas ni escribirlas (comprobado con la llave pública: [] y 42501).

create table if not exists public.ig_competencia_cuentas (
  username     text primary key check (username ~ '^[a-z0-9._]{1,30}$'),
  nombre       text,
  nota         text,
  activo       boolean not null default true,
  agregado_en  timestamptz not null default now(),
  ultima_sync  timestamptz,
  ultimo_error text
);

create table if not exists public.ig_competencia_perfiles (
  username      text not null references public.ig_competencia_cuentas(username) on delete cascade,
  fecha         date not null default ((now() at time zone 'America/Santo_Domingo')::date),
  ig_id         text,
  nombre        text,
  biografia     text,
  web           text,
  seguidores    integer,
  seguidos      integer,
  publicaciones integer,
  capturado_en  timestamptz not null default now(),
  primary key (username, fecha)
);

create table if not exists public.ig_competencia_posts (
  id             text primary key,
  username       text not null references public.ig_competencia_cuentas(username) on delete cascade,
  publicado_en   timestamptz,
  tipo           text,
  producto       text,
  permalink      text,
  texto          text,
  likes          integer,
  comentarios    integer,
  vistas         integer,
  primera_vez    timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists ig_competencia_posts_user_fecha on public.ig_competencia_posts (username, publicado_en desc);

create table if not exists public.ig_competencia_corridas (
  id      bigserial primary key,
  inicio  timestamptz not null default now(),
  fin     timestamptz,
  origen  text,
  resumen jsonb
);

alter table public.ig_competencia_cuentas   enable row level security;
alter table public.ig_competencia_perfiles  enable row level security;
alter table public.ig_competencia_posts     enable row level security;
alter table public.ig_competencia_corridas  enable row level security;

comment on table public.ig_competencia_cuentas is 'Cuentas de Instagram que se vigilan (competencia + la propia). RLS sin políticas: solo servidor.';
comment on table public.ig_competencia_posts   is 'Publicaciones públicas de la competencia (Meta Business Discovery). Se actualizan likes/comentarios/vistas en cada lectura.';

insert into public.ig_competencia_cuentas (username, nombre, nota) values
  ('bayolcell',      'BAYOL CELL',        'Cuenta propia, para comparar'),
  ('deorocell',      'De Oro Cell',       'Competencia principal en pantallas y equipos'),
  ('orocelloficial', 'Oro Cell Oficial',  'Segunda cuenta del mismo negocio que De Oro Cell'),
  ('dukeiphone',     'Duke iPhone',       'Santiago. Usuario tomado de TikTok: confirmar que es el mismo en Instagram'),
  ('amauricell_',    'Amauricell',        'Santiago. Usuario tomado de TikTok: confirmar que es el mismo en Instagram')
on conflict (username) do nothing;

-- Tarea diaria (creada aparte por SQL, job «ig-competencia-diario», 10:15 UTC = 6:15 a. m. RD):
-- select cron.schedule('ig-competencia-diario', '15 10 * * *', $job$ select net.http_post(
--   url := 'https://vkhwdvjtowrhkhqavnvk.supabase.co/functions/v1/instagram-competencia',
--   headers := '{"Content-Type":"application/json"}'::jsonb, body := '{"origen":"cron"}'::jsonb,
--   timeout_milliseconds := 120000) $job$);

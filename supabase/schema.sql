-- ============================================================
-- SCHEMA: Sistema de seguimiento de flota
-- Pegar completo en el SQL Editor de Supabase
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============ ENUMS ============
create type public.rol_usuario as enum ('superadmin', 'admin', 'conductor');
create type public.tipo_documento as enum ('permiso_circulacion', 'revision_tecnica', 'seguro', 'otro');

-- ============ TABLAS ============

create table public.empresas (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  created_at timestamptz not null default now()
);

-- profiles extiende auth.users con el rol y empresa de cada usuario
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid references public.empresas(id) on delete set null,
  rol public.rol_usuario not null default 'conductor',
  nombre text,
  telegram_chat_id text,
  created_at timestamptz not null default now()
);

create table public.flotas (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

create table public.vehiculos (
  id uuid primary key default uuid_generate_v4(),
  flota_id uuid not null references public.flotas(id) on delete cascade,
  conductor_id uuid references public.profiles(id) on delete set null,
  patente text not null unique,
  marca text,
  modelo text,
  anio int,
  km_actual int not null default 0,
  km_ultima_mantencion int not null default 0,
  intervalo_mantencion_km int not null default 10000,
  created_at timestamptz not null default now()
);

create table public.documentos (
  id uuid primary key default uuid_generate_v4(),
  vehiculo_id uuid not null references public.vehiculos(id) on delete cascade,
  tipo public.tipo_documento not null,
  archivo_url text not null,
  fecha_vencimiento date,
  fecha_subida timestamptz not null default now(),
  subido_por uuid references public.profiles(id)
);

create table public.km_historial (
  id uuid primary key default uuid_generate_v4(),
  vehiculo_id uuid not null references public.vehiculos(id) on delete cascade,
  km int not null,
  fecha timestamptz not null default now(),
  usuario_id uuid references public.profiles(id)
);

create table public.notificaciones_log (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null, -- 'documento_vencimiento' | 'mantencion_km'
  vehiculo_id uuid references public.vehiculos(id) on delete cascade,
  referencia_id uuid, -- id del documento, si aplica
  enviado_at timestamptz not null default now()
);

-- ============ TRIGGER: crear profile automático al registrarse ============
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nombre)
  values (new.id, new.raw_user_meta_data->>'nombre');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RLS ============
alter table public.empresas enable row level security;
alter table public.profiles enable row level security;
alter table public.flotas enable row level security;
alter table public.vehiculos enable row level security;
alter table public.documentos enable row level security;
alter table public.km_historial enable row level security;
alter table public.notificaciones_log enable row level security;

-- Helpers
create or replace function public.my_rol()
returns public.rol_usuario as $$
  select rol from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function public.my_empresa()
returns uuid as $$
  select empresa_id from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- PROFILES
create policy "ver propio perfil" on public.profiles
  for select using (id = auth.uid());

create policy "admin ve perfiles de su empresa" on public.profiles
  for select using (public.my_rol() in ('admin','superadmin') and (empresa_id = public.my_empresa() or public.my_rol() = 'superadmin'));

create policy "admin edita perfiles de su empresa" on public.profiles
  for update using (public.my_rol() in ('admin','superadmin') and (empresa_id = public.my_empresa() or public.my_rol() = 'superadmin'));

-- EMPRESAS
create policy "superadmin ve todas las empresas" on public.empresas
  for select using (public.my_rol() = 'superadmin');

create policy "admin ve su empresa" on public.empresas
  for select using (id = public.my_empresa());

-- FLOTAS
create policy "ver flotas de mi empresa" on public.flotas
  for select using (public.my_rol() = 'superadmin' or empresa_id = public.my_empresa());

create policy "admin gestiona flotas de su empresa" on public.flotas
  for all using (public.my_rol() in ('admin','superadmin') and (empresa_id = public.my_empresa() or public.my_rol() = 'superadmin'));

-- VEHICULOS
create policy "conductor ve su vehiculo" on public.vehiculos
  for select using (conductor_id = auth.uid());

create policy "admin ve vehiculos de su empresa" on public.vehiculos
  for select using (
    public.my_rol() in ('admin','superadmin') and
    exists (select 1 from public.flotas f where f.id = flota_id and (f.empresa_id = public.my_empresa() or public.my_rol() = 'superadmin'))
  );

create policy "admin gestiona vehiculos de su empresa" on public.vehiculos
  for all using (
    public.my_rol() in ('admin','superadmin') and
    exists (select 1 from public.flotas f where f.id = flota_id and (f.empresa_id = public.my_empresa() or public.my_rol() = 'superadmin'))
  );

create policy "conductor actualiza km de su vehiculo" on public.vehiculos
  for update using (conductor_id = auth.uid())
  with check (conductor_id = auth.uid());

-- DOCUMENTOS
create policy "ver documentos segun acceso al vehiculo" on public.documentos
  for select using (
    exists (
      select 1 from public.vehiculos v
      where v.id = vehiculo_id
      and (v.conductor_id = auth.uid()
        or (public.my_rol() in ('admin','superadmin') and exists (
          select 1 from public.flotas f where f.id = v.flota_id and (f.empresa_id = public.my_empresa() or public.my_rol() = 'superadmin')
        )))
    )
  );

create policy "admin gestiona documentos" on public.documentos
  for all using (
    public.my_rol() in ('admin','superadmin') and
    exists (
      select 1 from public.vehiculos v
      join public.flotas f on f.id = v.flota_id
      where v.id = vehiculo_id and (f.empresa_id = public.my_empresa() or public.my_rol() = 'superadmin')
    )
  );

-- KM_HISTORIAL
create policy "ver historial segun acceso al vehiculo" on public.km_historial
  for select using (
    exists (
      select 1 from public.vehiculos v
      where v.id = vehiculo_id
      and (v.conductor_id = auth.uid()
        or (public.my_rol() in ('admin','superadmin') and exists (
          select 1 from public.flotas f where f.id = v.flota_id and (f.empresa_id = public.my_empresa() or public.my_rol() = 'superadmin')
        )))
    )
  );

create policy "conductor registra km de su vehiculo" on public.km_historial
  for insert with check (
    exists (select 1 from public.vehiculos v where v.id = vehiculo_id and v.conductor_id = auth.uid())
  );

create policy "admin registra km" on public.km_historial
  for insert with check (
    public.my_rol() in ('admin','superadmin') and
    exists (
      select 1 from public.vehiculos v join public.flotas f on f.id = v.flota_id
      where v.id = vehiculo_id and (f.empresa_id = public.my_empresa() or public.my_rol() = 'superadmin')
    )
  );

-- NOTIFICACIONES_LOG (el cron escribe con service role, que se salta RLS)
create policy "admin ve notificaciones de su empresa" on public.notificaciones_log
  for select using (
    public.my_rol() in ('admin','superadmin') and
    exists (
      select 1 from public.vehiculos v join public.flotas f on f.id = v.flota_id
      where v.id = vehiculo_id and (f.empresa_id = public.my_empresa() or public.my_rol() = 'superadmin')
    )
  );

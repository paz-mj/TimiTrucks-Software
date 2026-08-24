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
  fecha_vencimiento date not null,
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
  for update using (public.my_rol() in ('admin','superadmin') and (empresa_id = public.my_empresa() or public.my_rol() = 'superadmin'))
  with check (public.my_rol() = 'superadmin' or (public.my_rol() = 'admin' and empresa_id = public.my_empresa() and rol <> 'superadmin'));

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

-- Nota: el conductor NO tiene policy de update directo sobre vehiculos.
-- La actualizacion de km se hace exclusivamente via la funcion actualizar_km()
-- (mas abajo), que es security definer y valida todo server-side. Asi evitamos
-- que el conductor pueda editar patente, intervalo_mantencion_km, etc.

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

-- Nota: no hay policy de insert para conductor. El registro de km (y su
-- historial) se hace exclusivamente via la funcion actualizar_km() (mas abajo),
-- que valida todo server-side y evita historiales desincronizados con
-- vehiculos.km_actual.
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

-- ============ RPC: actualizar_km ============
-- Unico camino permitido para actualizar el kilometraje de un vehiculo.
-- security definer: corre con permisos de postgres y hace su propia
-- verificacion de autorizacion, por eso no depende de policies de RLS
-- sobre vehiculos/km_historial para este flujo.
create or replace function public.actualizar_km(p_vehiculo_id uuid, p_km int)
returns void as $$
declare
  v_conductor_id uuid;
  v_km_actual int;
  v_autorizado boolean;
begin
  select conductor_id, km_actual into v_conductor_id, v_km_actual
  from public.vehiculos where id = p_vehiculo_id;

  if not found then
    raise exception 'vehiculo no encontrado';
  end if;

  v_autorizado := (v_conductor_id = auth.uid())
    or (
      public.my_rol() in ('admin', 'superadmin')
      and exists (
        select 1 from public.vehiculos v join public.flotas f on f.id = v.flota_id
        where v.id = p_vehiculo_id and (f.empresa_id = public.my_empresa() or public.my_rol() = 'superadmin')
      )
    );

  if not v_autorizado then
    raise exception 'no autorizado';
  end if;

  if p_km < v_km_actual then
    raise exception 'el km ingresado (%) no puede ser menor al actual (%)', p_km, v_km_actual;
  end if;

  update public.vehiculos set km_actual = p_km where id = p_vehiculo_id;

  insert into public.km_historial (vehiculo_id, km, usuario_id)
  values (p_vehiculo_id, p_km, auth.uid());
end;
$$ language plpgsql security definer;

revoke execute on function public.actualizar_km(uuid, int) from public, anon;
grant execute on function public.actualizar_km(uuid, int) to authenticated;

-- ============ STORAGE: bucket 'documentos' ============
-- Convencion de path del objeto: {empresa_id}/{vehiculo_id}/{nombre_archivo}
-- storage.foldername(name) devuelve las carpetas del path como un array de
-- texto, por eso (storage.foldername(name))[1] es el empresa_id del objeto.
-- Solo admin/superadmin de la empresa dueña de ese primer segmento puede
-- leer/subir/eliminar. El bucket 'documentos' ya existe y es privado (se
-- crea manualmente desde el dashboard de Supabase, no por SQL).

create policy "admin lee documentos de su empresa" on storage.objects
  for select using (
    bucket_id = 'documentos'
    and public.my_rol() in ('admin', 'superadmin')
    and (
      public.my_rol() = 'superadmin'
      or (storage.foldername(name))[1] = public.my_empresa()::text
    )
  );

create policy "admin sube documentos de su empresa" on storage.objects
  for insert with check (
    bucket_id = 'documentos'
    and public.my_rol() in ('admin', 'superadmin')
    and (
      public.my_rol() = 'superadmin'
      or (storage.foldername(name))[1] = public.my_empresa()::text
    )
  );

create policy "admin elimina documentos de su empresa" on storage.objects
  for delete using (
    bucket_id = 'documentos'
    and public.my_rol() in ('admin', 'superadmin')
    and (
      public.my_rol() = 'superadmin'
      or (storage.foldername(name))[1] = public.my_empresa()::text
    )
  );

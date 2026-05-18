
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);

-- Farms
create table public.farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  license text,
  species text not null default 'Atlantic Salmon (Salmo salar)',
  latitude double precision not null,
  longitude double precision not null,
  cage_count int not null default 6,
  fish_per_cage int not null default 30000,
  created_at timestamptz not null default now()
);
alter table public.farms enable row level security;
create policy "farms owner all" on public.farms for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cages
create table public.cages (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  position int not null,
  fish_count int not null default 30000,
  baseline_do double precision not null default 9.4,
  baseline_temp double precision not null default 10.5,
  baseline_ph double precision not null default 8.0,
  created_at timestamptz not null default now(),
  unique (farm_id, position)
);
alter table public.cages enable row level security;
create policy "cages owner read" on public.cages for select using (
  exists (select 1 from public.farms f where f.id = farm_id and f.user_id = auth.uid())
);
create policy "cages owner write" on public.cages for all using (
  exists (select 1 from public.farms f where f.id = farm_id and f.user_id = auth.uid())
) with check (
  exists (select 1 from public.farms f where f.id = farm_id and f.user_id = auth.uid())
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

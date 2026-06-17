-- ============================================================
-- Ruleta Tracker — schema.sql para Supabase (Postgres)
-- Sin autenticación: RLS activado con políticas permisivas para "anon"
-- Sin migración: se parte de tablas vacías
-- ============================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- Casinos
-- ----------------------------------------------------------------
create table casinos (
  id uuid primary key default gen_random_uuid(),
  city text not null check (city in ('Zaragoza', 'Madrid', 'Barcelona')),
  name text not null,
  created_at timestamptz not null default now()
);

create index idx_casinos_city on casinos (city);

-- ----------------------------------------------------------------
-- Tiradas (antes "entries" en Firestore)
-- El color se calcula una sola vez aquí; ya no se duplica en el cliente
-- en dos componentes distintos como pasaba en la v1.
-- ----------------------------------------------------------------
create table spins (
  id uuid primary key default gen_random_uuid(),
  casino_id uuid not null references casinos(id) on delete cascade,
  number smallint not null check (number between 0 and 36),
  color text generated always as (
    case
      when number = 0 then 'V'
      when number in (1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36) then 'R'
      else 'N'
    end
  ) stored,
  created_at timestamptz not null default now()
);

create index idx_spins_casino_created on spins (casino_id, created_at);
create index idx_spins_casino_number on spins (casino_id, number);

-- ----------------------------------------------------------------
-- Sesiones de registro de apuestas
-- (sustituye al modal de la v1 que no guardaba nada)
-- ----------------------------------------------------------------
create table bet_sessions (
  id uuid primary key default gen_random_uuid(),
  casino_id uuid references casinos(id) on delete set null,
  session_date date not null,
  losses_before_win smallint,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_bet_sessions_date on bet_sessions (session_date);

-- ----------------------------------------------------------------
-- Patrones (nuevo): globales si casino_id es NULL, o ligados a un casino
-- ----------------------------------------------------------------
create table patterns (
  id uuid primary key default gen_random_uuid(),
  casino_id uuid references casinos(id) on delete cascade,
  name text not null,
  description text,
  confidence smallint check (confidence between 1 and 5),
  created_at timestamptz not null default now()
);

create table pattern_numbers (
  pattern_id uuid not null references patterns(id) on delete cascade,
  number smallint not null check (number between 0 and 36),
  primary key (pattern_id, number)
);

create index idx_patterns_casino on patterns (casino_id);

-- ----------------------------------------------------------------
-- Sugerencias por combinación (alimentado desde Ruleta_Combinaciones.xlsx)
-- ----------------------------------------------------------------
create table number_combinations (
  prev_number smallint not null check (prev_number between 0 and 36),
  next_number smallint not null check (next_number between 0 and 36),
  suggested_bet text,
  notes text,
  confidence smallint check (confidence between 1 and 5),
  primary key (prev_number, next_number)
);

-- ============================================================
-- Row Level Security — sin login, acceso permisivo para "anon"
-- ============================================================
alter table casinos enable row level security;
alter table spins enable row level security;
alter table bet_sessions enable row level security;
alter table patterns enable row level security;
alter table pattern_numbers enable row level security;
alter table number_combinations enable row level security;

create policy "anon full access" on casinos
  for all to anon using (true) with check (true);
create policy "anon full access" on spins
  for all to anon using (true) with check (true);
create policy "anon full access" on bet_sessions
  for all to anon using (true) with check (true);
create policy "anon full access" on patterns
  for all to anon using (true) with check (true);
create policy "anon full access" on pattern_numbers
  for all to anon using (true) with check (true);
create policy "anon full access" on number_combinations
  for all to anon using (true) with check (true);

-- CloutRadar database schema. Run once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  stripe_customer_id text unique,
  subscription_id text,
  subscription_status text,          -- Stripe status: active, trialing, past_due, canceled, ...
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  handle text not null,
  input jsonb not null,
  result jsonb not null,
  score int,
  pro boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists scans_user_created on public.scans (user_id, created_at desc);
create index if not exists scans_user_handle on public.scans (user_id, handle, created_at desc);

alter table public.profiles enable row level security;
alter table public.scans enable row level security;

-- Members can read their own profile. Only the server (service role) writes billing fields.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (auth.uid() = id);

-- Members can read and delete their own scans. Scans are inserted by the server,
-- which enforces the free plan limit and computes the result.
drop policy if exists "read own scans" on public.scans;
create policy "read own scans" on public.scans for select using (auth.uid() = user_id);
drop policy if exists "delete own scans" on public.scans;
create policy "delete own scans" on public.scans for delete using (auth.uid() = user_id);

-- Create a profile row for every new sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

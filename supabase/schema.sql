create extension if not exists pgcrypto;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  french text not null,
  korean text not null,
  streak integer not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz null,
  last_result boolean null,
  last_answer text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cards_due_at_idx on public.cards (due_at);
create index if not exists cards_streak_idx on public.cards (streak);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_cards_updated_at on public.cards;
create trigger set_cards_updated_at
before update on public.cards
for each row execute function public.set_updated_at();

-- MVP: easiest path is keeping RLS disabled.
-- If you enable RLS later, add policies (and likely Supabase Auth).
alter table public.cards disable row level security;

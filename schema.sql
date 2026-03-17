-- BR Polls Schema

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null,
  status text not null default 'active' check (status in ('active', 'closed', 'draft')),
  article_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_index integer not null,
  fingerprint text,
  created_at timestamptz not null default now()
);

create index if not exists votes_poll_id_idx on public.votes(poll_id);
create index if not exists votes_fingerprint_idx on public.votes(poll_id, fingerprint);

create or replace view public.poll_results as
  select p.id as poll_id, p.question, p.options, p.status, p.article_slug,
    v.option_index, count(v.id) as vote_count
  from public.polls p
  left join public.votes v on v.poll_id = p.id
  group by p.id, p.question, p.options, p.status, p.article_slug, v.option_index;

alter table public.polls enable row level security;
alter table public.votes enable row level security;

create policy "Public can read active polls" on public.polls for select using (status = 'active');
create policy "Anyone can vote" on public.votes for insert with check (true);
create policy "Anyone can read votes" on public.votes for select using (true);

create or replace function public.handle_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

create or replace trigger polls_updated_at before update on public.polls
  for each row execute function public.handle_updated_at();

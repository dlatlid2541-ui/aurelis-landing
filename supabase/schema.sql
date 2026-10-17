-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) >= 2),
  content text not null check (char_length(content) >= 5),
  author_email text,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = user_id);

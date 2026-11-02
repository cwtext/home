-- Readers' bookmarks. Paste into the Supabase SQL editor once, after profiles.sql.
-- A bookmark marks one paragraph for one reader, so they can go straight back
-- to it. Only that reader can see or change their bookmarks.

create table public.bookmarks (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  note_slug text not null references public.notes (slug) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_slug)
);

alter table public.bookmarks enable row level security;

create policy "Readers can see their own bookmarks"
on public.bookmarks for select
to authenticated
using (user_id = auth.uid());

create policy "Readers can add their own bookmarks"
on public.bookmarks for insert
to authenticated
with check (user_id = auth.uid());

create policy "Readers can remove their own bookmarks"
on public.bookmarks for delete
to authenticated
using (user_id = auth.uid());

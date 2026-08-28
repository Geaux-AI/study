-- ============================================================
--  Geaux / SigEp Study Resources — ratings table
--  Run this once in a new Supabase project:
--  Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================

-- NOTE: this matches the table already running in production — an integer
-- id, and no timestamp column. The site sorts by id descending to get
-- newest-first, so do not change id to a uuid without also changing
-- sigep-ratings.html.
create table if not exists public.ratings (
  id         bigint generated always as identity primary key,
  professor  text     not null,
  course     text,
  rating     smallint not null check (rating between 1 and 5),
  notes      text,
  recommend  boolean  not null default false
);

-- Row Level Security. The site ships its API key in the page source (it is a
-- public/anon key, which is how Supabase is designed), so these policies are
-- the only thing standing between the internet and this table.
alter table public.ratings enable row level security;

-- Anyone may read ratings — the site is behind a shared password, not real auth.
drop policy if exists "ratings are publicly readable" on public.ratings;
create policy "ratings are publicly readable"
  on public.ratings for select
  using (true);

-- Anyone may submit a rating. Length caps keep a bad actor from filling the
-- free tier with a single enormous insert.
drop policy if exists "anyone can submit a rating" on public.ratings;
create policy "anyone can submit a rating"
  on public.ratings for insert
  with check (
    length(professor) between 1 and 120
    and (course is null or length(course) <= 60)
    and (notes is null or length(notes) <= 4000)
  );

-- Deletes are intentionally NOT allowed from the website.
-- The delete button on the ratings page will stop working; remove bad ratings
-- from the Supabase dashboard (Table Editor -> ratings -> delete row).
-- If you would rather keep the in-page delete button, uncomment this:
--
-- drop policy if exists "anyone can delete a rating" on public.ratings;
-- create policy "anyone can delete a rating"
--   on public.ratings for delete using (true);

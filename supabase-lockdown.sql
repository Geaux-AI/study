-- ============================================================
--  Lock down the ratings table
--  Run once: Supabase dashboard -> SQL Editor -> New query -> Run
--
--  WHY: the API key ships in the website's page source. That is normal for
--  Supabase (it is the public "anon" key), but it means the database policies
--  below are the only thing limiting what a visitor can do. Without them,
--  anyone who opens View Source can delete every rating in one request.
--
--  AFTER RUNNING THIS: the red "Delete Rating" button no longer works from the
--  website. Remove bad ratings here instead:
--     Dashboard -> Table Editor -> ratings -> select the row -> Delete
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add a submission date so the site can show how recent a
--    rating is, and sort newest-first. The original table had no
--    timestamp column at all.
-- ------------------------------------------------------------
alter table public.ratings
  add column if not exists created_at timestamptz not null default now();

create index if not exists ratings_created_at_idx
  on public.ratings (created_at desc);

-- ------------------------------------------------------------
-- 2. Lock the table down
-- ------------------------------------------------------------
alter table public.ratings enable row level security;

-- Anyone may read ratings. The site is behind a shared password, not real auth.
drop policy if exists "ratings are publicly readable" on public.ratings;
create policy "ratings are publicly readable"
  on public.ratings for select
  using (true);

-- Anyone may submit one. Length caps stop a single huge insert from filling
-- the free tier.
drop policy if exists "anyone can submit a rating" on public.ratings;
create policy "anyone can submit a rating"
  on public.ratings for insert
  with check (
    length(professor) between 1 and 120
    and (course is null or length(course) <= 60)
    and (notes is null or length(notes) <= 4000)
  );

-- No delete or update policy is created, so with RLS on, neither is possible
-- from the website. Clean these up in the dashboard instead.
drop policy if exists "anyone can delete a rating" on public.ratings;
drop policy if exists "anyone can update a rating" on public.ratings;

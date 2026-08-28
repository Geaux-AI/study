-- ============================================================
--  Study resource uploads
--  Run once: Supabase dashboard -> SQL Editor -> New query -> Run
--
--  Creates the storage bucket brothers upload into, and the table that
--  records what each file is for. The website merges these rows with the
--  static resources.js at page load, so uploads appear without anyone
--  editing the site or pushing to git.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Where the files live
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-files', 'study-files', true,
  26214400,   -- 25 MB per file
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read files (the site is already behind a shared password) and
-- anyone can upload. Nobody can overwrite or delete through the website —
-- same reasoning as the ratings table.
drop policy if exists "study files are publicly readable" on storage.objects;
create policy "study files are publicly readable"
  on storage.objects for select
  using (bucket_id = 'study-files');

drop policy if exists "anyone can upload a study file" on storage.objects;
create policy "anyone can upload a study file"
  on storage.objects for insert
  with check (bucket_id = 'study-files');

drop policy if exists "anyone can delete a study file" on storage.objects;
drop policy if exists "anyone can update a study file" on storage.objects;

-- ------------------------------------------------------------
-- 2. What each file is for
-- ------------------------------------------------------------
create table if not exists public.submissions (
  id           bigint generated always as identity primary key,
  course       text not null,          -- "BIOL 1201"
  professor    text not null,          -- "Crousillac"
  title        text not null,          -- shown as the link text
  kind         text,                   -- Study Guide / Notes / Practice / Exam / Other
  path         text not null,          -- storage path inside study-files
  submitted_by text,                   -- optional, free text
  created_at   timestamptz not null default now()
);

create index if not exists submissions_created_at_idx
  on public.submissions (created_at desc);

alter table public.submissions enable row level security;

drop policy if exists "submissions are publicly readable" on public.submissions;
create policy "submissions are publicly readable"
  on public.submissions for select
  using (true);

-- Length caps keep one bad actor from filling the free tier.
drop policy if exists "anyone can submit a resource" on public.submissions;
create policy "anyone can submit a resource"
  on public.submissions for insert
  with check (
    length(course) between 2 and 60
    and length(professor) between 1 and 120
    and length(title) between 1 and 200
    and length(path) between 1 and 400
    and (kind is null or length(kind) <= 40)
    and (submitted_by is null or length(submitted_by) <= 80)
  );

-- Removing a bad upload is done from the dashboard, not the website.
drop policy if exists "anyone can delete a submission" on public.submissions;
drop policy if exists "anyone can update a submission" on public.submissions;

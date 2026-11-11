-- =====================================================================
--  Snap to Screen: one-time setup
--  Supabase dashboard → (library project) → SQL Editor → New query
--  Paste this whole file, CHANGE THE PASSCODE at the bottom, then Run.
--
--  What it creates (all names start with "snap" so nothing clashes
--  with the library tables):
--    • public.snap_rooms  – one row per classroom/passcode
--    • public.snaps       – the photos (deleted automatically after 12 h)
--    • six snap_* functions the web pages call
--
--  Security model: neither table has any RLS policies, so the public
--  (anon) key cannot read or write them directly at all. The only way
--  in is through the snap_* functions, and every one of them checks
--  the passcode first.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tables ---------------------------------------------------

create table if not exists public.snap_rooms (
  id         uuid primary key default gen_random_uuid(),
  label      text not null default 'My classroom',
  code_hash  text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.snaps (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.snap_rooms (id) on delete cascade,
  created_at timestamptz not null default now(),
  width      int,
  height     int,
  data       text not null            -- JPEG, base64-encoded (~300-450 KB)
);

create index if not exists snaps_room_created_idx
  on public.snaps (room_id, created_at);

alter table public.snap_rooms enable row level security;
alter table public.snaps      enable row level security;
-- No policies on purpose: direct table access is blocked for the public key.
revoke all on table public.snap_rooms from anon, authenticated;
revoke all on table public.snaps      from anon, authenticated;

-- ---------- Internal helpers (not callable from the web) -------------

create or replace function public.snap_hash(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(lower(btrim(p_code)), 'sha256'), 'hex')
$$;

create or replace function public.snap_room(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room uuid;
begin
  select r.id into v_room
  from public.snap_rooms r
  where r.code_hash = public.snap_hash(p_code);

  if v_room is null then
    perform pg_sleep(0.5);               -- slows down passcode guessing
    raise exception 'Wrong passcode' using errcode = '28P01';
  end if;
  return v_room;
end
$$;

-- ---------- Functions the web pages call -----------------------------

-- Check a passcode; returns the room label.
create or replace function public.snap_check(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room  uuid := public.snap_room(p_code);
  v_label text;
begin
  select r.label into v_label from public.snap_rooms r where r.id = v_room;
  return v_label;
end
$$;

-- Phone: store a new photo. Returns its id.
create or replace function public.snap_post(p_code text, p_data text, p_width int, p_height int)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room  uuid := public.snap_room(p_code);
  v_id    uuid;
  v_count int;
begin
  if p_data is null or length(p_data) > 4000000 then
    raise exception 'Image too large';
  end if;
  if left(p_data, 4) <> '/9j/' then
    raise exception 'Not a JPEG image';
  end if;

  -- Safety net: anything older than 12 hours goes.
  delete from public.snaps s
  where s.room_id = v_room and s.created_at < now() - interval '12 hours';

  select count(*) into v_count from public.snaps s where s.room_id = v_room;
  if v_count >= 200 then
    raise exception 'There are already 200 snaps. Press "End lesson" on the board to clear them.';
  end if;

  insert into public.snaps (room_id, width, height, data)
  values (v_room, p_width, p_height, p_data)
  returning id into v_id;

  return v_id;
end
$$;

-- Board: list the photos in this room (no image data, so it's tiny).
create or replace function public.snap_list(p_code text)
returns table (snap_id uuid, taken_at timestamptz, w int, h int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room uuid := public.snap_room(p_code);
begin
  delete from public.snaps s
  where s.room_id = v_room and s.created_at < now() - interval '12 hours';

  return query
    select s.id, s.created_at, s.width, s.height
    from public.snaps s
    where s.room_id = v_room
    order by s.created_at;
end
$$;

-- Board: fetch one photo's image data.
create or replace function public.snap_get(p_code text, p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room uuid := public.snap_room(p_code);
  v_data text;
begin
  select s.data into v_data
  from public.snaps s
  where s.id = p_id and s.room_id = v_room;
  return v_data;
end
$$;

-- Phone or board: delete one photo.
create or replace function public.snap_delete(p_code text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room uuid := public.snap_room(p_code);
begin
  delete from public.snaps s where s.id = p_id and s.room_id = v_room;
  return found;
end
$$;

-- Board: "End lesson" – delete every photo in this room.
create or replace function public.snap_clear(p_code text)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room uuid := public.snap_room(p_code);
  v_n    int;
begin
  delete from public.snaps s where s.room_id = v_room;
  get diagnostics v_n = row_count;
  return v_n;
end
$$;

-- ---------- Permissions ----------------------------------------------

revoke execute on function public.snap_hash(text) from public, anon, authenticated;
revoke execute on function public.snap_room(text) from public, anon, authenticated;

grant execute on function public.snap_check(text)                  to anon, authenticated;
grant execute on function public.snap_post(text, text, int, int)   to anon, authenticated;
grant execute on function public.snap_list(text)                   to anon, authenticated;
grant execute on function public.snap_get(text, uuid)              to anon, authenticated;
grant execute on function public.snap_delete(text, uuid)           to anon, authenticated;
grant execute on function public.snap_clear(text)                  to anon, authenticated;

-- ---------- Your passcode --------------------------------------------
-- CHANGE BOTH VALUES BELOW before running.
-- Use three or four random words, e.g. 'violet tractor puddle'.
-- Capitals and spaces at the ends don't matter when typing it later.
-- To add another classroom later, run just this insert again with a
-- different label and passcode.

insert into public.snap_rooms (label, code_hash)
values ('My classroom', public.snap_hash('CHANGE ME to three random words'))
on conflict (code_hash) do nothing;

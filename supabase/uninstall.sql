-- =====================================================================
--  Snap to Screen: UNINSTALL
--  Removes everything Snap to Screen added to a Supabase project:
--  all photos, all passcodes/rooms, the snap_* functions and the
--  hourly clean-up job. Nothing else in the project is touched.
--
--  This cannot be undone. Save any photos you want first (Board → Save).
--  Supabase dashboard → SQL Editor → New query → paste → Run.
-- =====================================================================

-- Hourly clean-up job (ignored if it was never set up)
do $$
begin
  perform cron.unschedule('snap-cleanup');
exception when others then
  null;
end
$$;

drop function if exists public.snap_check(text);
drop function if exists public.snap_post(text, text, int, int);
drop function if exists public.snap_list(text);
drop function if exists public.snap_get(text, uuid);
drop function if exists public.snap_delete(text, uuid);
drop function if exists public.snap_clear(text);
drop function if exists public.snap_room(text);
drop function if exists public.snap_hash(text);

drop table if exists public.snaps;       -- all photos
drop table if exists public.snap_rooms;  -- all passcodes / rooms

-- If this project was created only for Snap to Screen, you can instead
-- delete the whole project: Project Settings → General → Delete project.

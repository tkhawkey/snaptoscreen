-- =====================================================================
--  Snap to Screen: OPTIONAL hourly clean-up (run after 1-setup.sql)
--
--  The app already deletes photos when you press "End lesson", and
--  deletes anything older than 12 hours whenever the phone or board
--  is used. This adds a third safety net: a scheduled job that runs
--  every hour even if nobody opens the app (e.g. over a weekend).
--
--  If the first line errors, turn on "pg_cron" in
--  Database → Extensions, then run the select statement on its own.
-- =====================================================================

create extension if not exists pg_cron;

select cron.schedule(
  'snap-cleanup',
  '0 * * * *',
  $$ delete from public.snaps where created_at < now() - interval '12 hours' $$
);

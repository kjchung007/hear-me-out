-- PROPOSAL ONLY: not applied. Requires approval for permanent deletion.
-- Run every minute; removes only expired signals and their related reactions.
create extension if not exists pg_cron;
select cron.schedule(
  'hear-me-out-expiry',
  '* * * * *',
  $$delete from public.signals where expires_at <= now()$$
);

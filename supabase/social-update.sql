-- Additive update after schema.sql. No existing rows are removed.
begin;
alter table public.signals add column if not exists display_name text check(char_length(display_name) between 1 and 30);
grant select(display_name) on public.signals to anon,authenticated;
grant insert(display_name) on public.signals to authenticated;
alter table public.reactions add column if not exists created_at timestamptz not null default now();
-- Only the signed-in recipient can retrieve their own inbox. No account IDs or emails are returned.
create or replace function private.kindness_inbox()
returns table(signal_id uuid,body text,mood text,total bigint,received_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 return query select s.id,s.body,s.mood,count(*),max(r.created_at)
 from public.signals s join public.reactions r on r.signal_id=s.id
 where s.owner_id=auth.uid() and s.expires_at>now() and r.owner_id<>auth.uid()
 group by s.id,s.body,s.mood order by max(r.created_at) desc limit 100;
end $$;
revoke all on function private.kindness_inbox() from public,anon;
grant execute on function private.kindness_inbox() to authenticated;
create or replace function public.kindness_inbox()
returns table(signal_id uuid,body text,mood text,total bigint,received_at timestamptz)
language sql stable security invoker set search_path='' as $$ select * from private.kindness_inbox() $$;
revoke all on function public.kindness_inbox() from public,anon;
grant execute on function public.kindness_inbox() to authenticated;
commit;

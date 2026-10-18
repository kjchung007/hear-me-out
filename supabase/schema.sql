begin;
create table public.signals (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 city_id text not null check (city_id in ('kuching','singapore','tokyo','seoul','sydney','london','new-york','sao-paulo','cape-town')),
 mood text not null check (mood in ('😊','😭','😴','❤️','😡','🤯')),
 body text not null default '' check (char_length(body) <= 50),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now() + interval '1 hour')
);
create index signals_expiry on public.signals(expires_at);
create index signals_owner on public.signals(owner_id);
alter table public.signals enable row level security;
revoke all on public.signals from anon, authenticated;
grant select (id,city_id,mood,body,created_at,expires_at) on public.signals to anon, authenticated;
grant insert (city_id,mood,body) on public.signals to authenticated;
create policy live_signals on public.signals for select to anon, authenticated using (expires_at > now());
create policy own_signal_insert on public.signals for insert to authenticated with check (owner_id = (select auth.uid()) and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false));
create table public.reactions (
 signal_id uuid not null references public.signals(id) on delete cascade,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 primary key (signal_id,owner_id)
);
create index reactions_owner on public.reactions(owner_id);
alter table public.reactions enable row level security;
revoke all on public.reactions from anon, authenticated;
grant select (signal_id) on public.reactions to anon, authenticated;
grant insert (signal_id), delete on public.reactions to authenticated;
create policy live_reactions on public.reactions for select to anon, authenticated using (exists(select 1 from public.signals s where s.id=signal_id));
create policy own_reaction_insert on public.reactions for insert to authenticated with check (owner_id=(select auth.uid()) and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false) and exists(select 1 from public.signals s where s.id=signal_id));
create policy own_reaction_delete on public.reactions for delete to authenticated using (owner_id=(select auth.uid()));
create function public.reaction_counts() returns table(signal_id uuid,total bigint) language sql stable security invoker set search_path='' as $$ select r.signal_id,count(*) from public.reactions r group by r.signal_id $$;
revoke all on function public.reaction_counts() from public;
grant execute on function public.reaction_counts() to anon,authenticated;
-- Only this internal lookup can read account ownership; public rows never expose it.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create function private.my_reactions() returns table(signal_id uuid) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 return query select r.signal_id from public.reactions r join public.signals s on s.id=r.signal_id where r.owner_id=auth.uid() and s.expires_at>now();
end $$;
revoke all on function private.my_reactions() from public;
grant execute on function private.my_reactions() to authenticated;
create function public.my_reactions() returns table(signal_id uuid) language sql stable security invoker set search_path='' as $$ select * from private.my_reactions() $$;
revoke all on function public.my_reactions() from public;
grant execute on function public.my_reactions() to authenticated;
commit;

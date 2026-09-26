-- Brings an existing Michibiki database up to date with the current app.
-- Safe to run more than once. Fresh databases should run hackathon.sql instead.
begin;

-- No sign-in: user_id stores an installation UUID, so drop the old auth.users links.
alter table public.device_bindings drop constraint if exists device_bindings_user_id_fkey;
alter table public.emergency_alerts drop constraint if exists emergency_alerts_user_id_fkey;
alter table public.messages drop constraint if exists messages_user_id_fkey;
alter table public.device_bindings alter column user_id drop default;
alter table public.emergency_alerts alter column user_id drop default;
alter table public.messages alter column user_id drop default;

-- Device roles, chosen on the Connect screen.
alter table public.nodes add column if not exists role text not null default 'Hiker';
alter table public.nodes drop constraint if exists nodes_role_check;
alter table public.nodes add constraint nodes_role_check check (role in ('Hiker', 'Relay', 'Base Station'));

-- Channel membership. A channel with no members is open to every device.
create table if not exists public.channel_members (
  channel_id text not null references public.channels(id) on delete cascade,
  node_id text not null references public.nodes(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (channel_id, node_id)
);

-- API permissions used by the app.
revoke all on public.channel_members from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.nodes, public.tracking_logs, public.channels, public.channel_members, public.messages to anon, authenticated;
grant select, insert, update, delete on public.device_bindings to anon, authenticated;
grant select, insert on public.emergency_alerts to anon, authenticated;
grant update (status) on public.emergency_alerts to anon, authenticated;
grant insert on public.tracking_logs, public.messages, public.channels, public.channel_members to anon, authenticated;
grant update (lat, lng, battery, signal, hops, last_seen, role) on public.nodes to anon, authenticated;

commit;

-- Realtime: new messages and emergency alerts reach other phones instantly.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'emergency_alerts') then
    alter publication supabase_realtime add table public.emergency_alerts;
  end if;
end $$;

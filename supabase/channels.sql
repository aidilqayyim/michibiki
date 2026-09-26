-- Run once if you already ran hackathon.sql before channel creation existed.
-- Adds channel membership and lets the app create channels.
begin;
create table if not exists public.channel_members (
  channel_id text not null references public.channels(id) on delete cascade,
  node_id text not null references public.nodes(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (channel_id, node_id)
);
revoke all on public.channel_members from anon, authenticated;
grant select on public.channel_members to anon, authenticated;
grant insert on public.channels, public.channel_members to anon, authenticated;
commit;

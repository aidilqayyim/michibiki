-- Michibiki hackathon schema and existing demo data.
-- Run this entire file in the Supabase SQL Editor.
-- No sign-in required. user_id stores a browser-generated UUID.
-- Nodes, tracking history and chat are shared within this demo project.
-- No row-level ownership restrictions are enforced without RLS.
-- Rerunning preserves existing rows. This is not a migration for incompatible tables.

begin;

-- 1. Latest known state of each LoRa device.
create table if not exists public.nodes (
  id text primary key,
  name text not null,
  role text not null default 'Hiker' check (role in ('Hiker', 'Relay', 'Base Station')),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  battery smallint not null default 100 check (battery between 0 and 100),
  signal text not null default 'Good' check (signal in ('Strong', 'Good', 'Weak', 'Offline')),
  hops smallint not null default 0 check (hops >= 0),
  color text not null default '#4ade80' check (color ~ '^#[0-9a-fA-F]{6}$'),
  locked boolean not null default true,
  bindable boolean not null default true,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2. Past GPS readings. Group recorded_at by Asia/Tokyo in the current Logs UI.
create table if not exists public.tracking_logs (
  id text primary key default gen_random_uuid()::text,
  node_id text not null references public.nodes(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  recorded_at timestamptz not null default now(),
  rssi smallint not null check (rssi between -200 and 0),
  created_at timestamptz not null default now(),
  unique (node_id, recorded_at)
);
create index if not exists tracking_logs_recorded_at_idx
  on public.tracking_logs (recorded_at desc);

-- 3. One active device per browser, one browser per device.
-- Switching = update node_id; disconnecting = delete the user's row.
create table if not exists public.device_bindings (
  user_id uuid primary key ,
  node_id text not null unique references public.nodes(id) on delete cascade,
  bound_at timestamptz not null default now()
);

-- 4. App alerts only: inserting a row does not transmit a LoRa warning.
create table if not exists public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null ,
  node_id text references public.nodes(id) on delete set null,
  message text not null default 'Emergency assistance requested.' check (char_length(message) between 1 and 1000),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  status text not null default 'active' check (status in ('active', 'resolved', 'cancelled')),
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  check ((lat is null) = (lng is null))
);
create index if not exists emergency_alerts_user_idx
  on public.emergency_alerts (user_id, created_at desc);

-- 5. Group chat channels.
create table if not exists public.channels (
  id text primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- 5b. Devices added to a channel. A channel with no members is open to every device.
create table if not exists public.channel_members (
  channel_id text not null references public.channels(id) on delete cascade,
  node_id text not null references public.nodes(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (channel_id, node_id)
);

-- 6. A message goes to either a channel or a node, never both.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid ,
  sender_node_id text not null references public.nodes(id),
  channel_id text references public.channels(id),
  recipient_node_id text references public.nodes(id),
  body text not null check (char_length(body) between 1 and 1000),
  sent_at timestamptz not null default now(),
  check ((channel_id is not null) <> (recipient_node_id is not null))
);
create index if not exists messages_channel_time_idx on public.messages (channel_id, sent_at desc);
create index if not exists messages_recipient_time_idx on public.messages (recipient_node_id, sent_at desc);
create index if not exists messages_sender_idx on public.messages (sender_node_id);

-- Explicit API permissions. RLS is not enabled by this script.
revoke all on public.nodes, public.tracking_logs, public.device_bindings,
  public.emergency_alerts, public.channels, public.channel_members, public.messages from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.nodes, public.tracking_logs, public.channels, public.channel_members, public.messages to anon, authenticated;
grant select, insert, update, delete on public.device_bindings to anon, authenticated;
grant select, insert on public.emergency_alerts to anon, authenticated;
grant update (status) on public.emergency_alerts to anon, authenticated;
grant insert on public.tracking_logs, public.messages, public.channels, public.channel_members to anon, authenticated;
grant update (lat, lng, battery, signal, hops, last_seen, role) on public.nodes to anon, authenticated;

-- Existing node cards and map coordinates.
insert into public.nodes (id, name, role, lat, lng, battery, signal, hops, color, locked, bindable, last_seen)
values
  ('A07', 'Michibiki A07', 'Hiker', 33.89121299334856, 130.84012837275336, 88, 'Strong', 1, '#4ade80', true, true, now()),
  ('B12', 'Michibiki B12', 'Hiker', 33.8894, 130.8375, 74, 'Good', 1, '#7dd3fc', true, true, now() - interval '1 minute'),
  ('C03', 'Michibiki C03', 'Hiker', 33.8935, 130.8455, 91, 'Good', 2, '#fb7185', true, true, now()),
  ('R03', 'Relay R03', 'Relay', 33.8992, 130.8361, 57, 'Weak', 3, '#fbbf24', false, false, now() - interval '12 minutes')
on conflict (id) do nothing;

-- Exact 48 examples from src/data/trackingLogs.js:
-- 4 nodes x 3 dates x 4 readings (09:15, 10:15, 11:15, 12:15 JST).
with seed_nodes (id, lat, lng, node_index) as (
  values
    ('A07', 33.891213::double precision, 130.840128::double precision, 0),
    ('B12', 33.8894, 130.8375, 1),
    ('C03', 33.8935, 130.8455, 2),
    ('R03', 33.8992, 130.8361, 3)
), seed_days (day, day_index) as (
  values (date '2026-09-26', 0), (date '2026-09-25', 1), (date '2026-09-24', 2)
)
insert into public.tracking_logs (id, node_id, lat, lng, recorded_at, rssi)
select
  d.day::text || '-' || n.id || '-' || p.point::text,
  n.id,
  n.lat - (3 - p.point) * 0.0007 - d.day_index * 0.0003,
  n.lng - (3 - p.point) * 0.0009 + d.day_index * 0.0002,
  (d.day + make_time(9 + p.point, 15, 0)) at time zone 'Asia/Tokyo',
  -72 - n.node_index * 9 - p.point * 2
from seed_nodes n cross join seed_days d cross join generate_series(0, 3) as p(point)
on conflict do nothing;

insert into public.channels (id, name, description)
values ('expedition-alpha', 'Expedition Alpha', 'Group communication across the LoRa mesh')
on conflict (id) do nothing;

-- Seeded messages have no app user; their sender is the demo node.
insert into public.messages (id, user_id, sender_node_id, channel_id, body, sent_at)
values ('00000000-0000-4000-8000-000000000001', null, 'A07', 'expedition-alpha',
  'I reached checkpoint 2.', '2026-09-26 12:15:00+09')
on conflict (id) do nothing;

-- Bindings and alerts intentionally start empty: create them through user actions.
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

-- Verify seeded data in the SQL Editor.
select 'nodes' as table_name, count(*) as row_count from public.nodes
union all select 'tracking_logs', count(*) from public.tracking_logs
union all select 'channels', count(*) from public.channels
union all select 'messages', count(*) from public.messages;

-- Example query used by Logs / Show on Map (uncomment to run):
-- select * from public.tracking_logs
-- where node_id = 'A07'
--   and recorded_at >= timestamptz '2026-09-26 00:00:00+09'
--   and recorded_at <  timestamptz '2026-09-27 00:00:00+09'
-- order by recorded_at;

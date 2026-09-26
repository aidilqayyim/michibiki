-- Clears every existing node (and the demo data tied to it) and seeds the
-- Mount Takao (高尾山) demo mesh: one base station plus a 3-relay chain up
-- Trail 1 (表参道) to the summit.
-- Run this in the Supabase SQL Editor — the app's publishable key has no
-- INSERT/DELETE grant on public.nodes, only UPDATE on specific columns.
--
-- Relay planning assumption (Heltec WiFi LoRa 32 V4 / SX1262, forested slopes):
-- ~500 m-1.5 km per hop is a conservative design range, not the theoretical
-- max — real RSSI/SNR should be measured on-site once relays are placed.
-- Trail 1 is roughly 3.8 km base-to-summit with heavy switchbacks, so relays
-- below are placed at real trail landmarks (a ridge clearing, a trail
-- junction, existing infrastructure) rather than by height alone, per the
-- guidance that placement beats "just mount it high." Straight-line spacing
-- between hops below is ~400-720 m, comfortably inside the conservative
-- range and leaving margin since LoRa range is governed by line-of-sight
-- distance, not the longer walked trail distance.

begin;

-- Delete order respects foreign keys: messages restricts on sender_node_id,
-- so it must go before nodes; tracking_logs/device_bindings/channel_members
-- cascade automatically but are cleared explicitly for a fully clean slate.
delete from public.messages;
delete from public.tracking_logs;
delete from public.device_bindings;
delete from public.channel_members;
delete from public.emergency_alerts;
delete from public.nodes;

-- Takaosanguchi Station (高尾山口駅): the town at the mountain's base, where the
-- trailhead and cable car start and cell reception is reliable — the natural
-- spot for the base station, as opposed to anywhere higher on the mountain.
insert into public.nodes (id, name, role, lat, lng, battery, signal, hops, color, locked, bindable, last_seen)
values (
  'B01',
  'Takao Base Station',
  'Base Station',
  35.6253,
  139.2609,
  100,
  'Strong',
  0,
  '#38bdf8',
  false,
  false,
  now()
);

-- Relay 1 · Takaosan Station (高尾山駅) — the cable car's upper station: an
-- existing elevated clearing with structures and partial line-of-sight back
-- down the switchback road to the base. ~720 m from B01.
insert into public.nodes (id, name, role, lat, lng, battery, signal, hops, color, locked, bindable, last_seen)
values (
  'R01',
  'Takaosan Station Relay',
  'Relay',
  35.6285,
  139.2540,
  95,
  'Strong',
  1,
  '#fbbf24',
  false,
  false,
  now()
);

-- Relay 2 · Yakuoin Temple (薬王院) precinct — an open ridge clearing around
-- the temple grounds, ~425 m further along the trail from R01.
insert into public.nodes (id, name, role, lat, lng, battery, signal, hops, color, locked, bindable, last_seen)
values (
  'R02',
  'Yakuoin Relay',
  'Relay',
  35.6296,
  139.2495,
  90,
  'Good',
  2,
  '#f59e0b',
  false,
  false,
  now()
);

-- Relay 3 · summit-approach ridge junction — the open rest clearing where
-- Trail 1 meets the final ridge path before the summit stairs, ~465 m
-- further along from R02. Furthest hop, so treated as the least certain
-- link until measured on-site.
insert into public.nodes (id, name, role, lat, lng, battery, signal, hops, color, locked, bindable, last_seen)
values (
  'R03',
  'Summit Ridge Relay',
  'Relay',
  35.6270,
  139.2455,
  85,
  'Weak',
  3,
  '#d97706',
  false,
  false,
  now()
);

-- Hiker H01 · near the summit, past R03 — deep in the trail, closest to the
-- end of the mesh chain.
insert into public.nodes (id, name, role, lat, lng, battery, signal, hops, color, locked, bindable, last_seen)
values (
  'H01',
  'Michibiki H01',
  'Hiker',
  35.6258,
  139.2440,
  82,
  'Good',
  4,
  '#4ade80',
  true,
  true,
  now()
);

-- Hiker H02 · between R01 and R02, on the switchback ascent — also deep in
-- the trail, a couple hops from the base.
insert into public.nodes (id, name, role, lat, lng, battery, signal, hops, color, locked, bindable, last_seen)
values (
  'H02',
  'Michibiki H02',
  'Hiker',
  35.6290,
  139.2515,
  76,
  'Good',
  3,
  '#7dd3fc',
  true,
  true,
  now()
);

-- Hiker H03 · just past the trailhead, close to the base station.
insert into public.nodes (id, name, role, lat, lng, battery, signal, hops, color, locked, bindable, last_seen)
values (
  'H03',
  'Michibiki H03',
  'Hiker',
  35.6258,
  139.2600,
  95,
  'Strong',
  1,
  '#fb7185',
  true,
  true,
  now()
);

commit;

-- Verify the reset in the SQL Editor.
select 'nodes' as table_name, count(*) as row_count from public.nodes
union all select 'tracking_logs', count(*) from public.tracking_logs
union all select 'messages', count(*) from public.messages
union all select 'emergency_alerts', count(*) from public.emergency_alerts;

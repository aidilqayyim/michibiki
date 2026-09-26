-- Run once if you already ran the earlier hackathon.sql.
-- No sign-in or RLS policies. user_id now stores a browser-generated UUID.
-- This browser ID is a convenience identifier, not authentication.
begin;
alter table public.device_bindings drop constraint if exists device_bindings_user_id_fkey;
alter table public.emergency_alerts drop constraint if exists emergency_alerts_user_id_fkey;
alter table public.messages drop constraint if exists messages_user_id_fkey;
alter table public.device_bindings alter column user_id drop default;
alter table public.emergency_alerts alter column user_id drop default;
alter table public.messages alter column user_id drop default;

grant usage on schema public to anon;
grant select on public.nodes, public.tracking_logs, public.channels, public.messages to anon;
grant select, insert, update, delete on public.device_bindings to anon;
grant select, insert on public.emergency_alerts to anon;
grant update (status) on public.emergency_alerts to anon;
grant insert on public.tracking_logs, public.messages to anon;
grant update (lat, lng, battery, signal, hops, last_seen) on public.nodes to anon;
commit;

-- Run once if you already ran hackathon.sql before the Base Station role existed.
-- Adds the Base Station role and lets the Connect screen set a device's role.
begin;
alter table public.nodes drop constraint if exists nodes_role_check;
alter table public.nodes add constraint nodes_role_check check (role in ('Hiker', 'Relay', 'Base Station'));
grant update (role) on public.nodes to anon, authenticated;
commit;

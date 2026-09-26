-- Run once so the app receives new messages and emergency alerts instantly.
-- Adds both tables to Supabase Realtime; safe to rerun.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'emergency_alerts') then
    alter publication supabase_realtime add table public.emergency_alerts;
  end if;
end $$;

# Michibiki Supabase data

The app reads Supabase through explicit `.from(...).select(...)` queries in `src/data/MeshQueries.jsx`. `MeshProvider.jsx` shares the results across the JSX pages and refreshes every 15 seconds while the app is active. Failed requests show a retry state, not hardcoded fallback records.

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `EXPO_PUBLIC_SUPABASE_ANON_KEY`) in `.env`, then restart the development server. No Supabase sign-in is used. An installation UUID in AsyncStorage identifies bindings and alerts; it is not authentication.

For a fresh database, run `hackathon.sql`. For an existing database, run `upgrade.sql`: it removes the old sign-in links, adds device roles and channel membership, applies the API grants the app needs, and turns on Realtime for messages and emergency alerts. It is safe to rerun. SELECT calls still require database permissions; frontend code cannot grant these. Neither script is run by the app. No RLS policies are created.

Nodes, tracking logs, channels, and messages come from the database. Bindings, messages, and confirmed alerts are saved to Supabase. Tracking history reads existing database readings; no RSSI values are invented. Dates are grouped in Asia/Tokyo to match the seeded history.

Supabase stores app data only. Bluetooth pairing, LoRa transmission, and contacting emergency services are not implemented.

With RLS disabled, the installation UUID filters are a demo convenience, not access control. Data is accessible according to the table grants.

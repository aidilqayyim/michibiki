# Michibiki Supabase data

The app reads Supabase through explicit `.from(...).select(...)` queries in `src/data/MeshQueries.jsx`. `MeshProvider.jsx` shares the results across the JSX pages and refreshes every 15 seconds while visible. Failed requests show a retry state, not hardcoded fallback records.

Set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_PUBLISHABLE_KEY` (or `REACT_APP_SUPABASE_ANON_KEY`) in `.env`, then restart the development server. No Supabase sign-in is used. A browser-generated UUID in local storage identifies bindings and alerts; it is not authentication.

For a fresh database, run `hackathon.sql`. If you previously ran the authenticated version, `no-auth.sql` supplies anonymous API grants and removes the auth.users foreign keys. SELECT calls still require database permissions; frontend code cannot grant these. Neither script is executed by the app. No RLS policies are created.

Nodes, tracking logs, channels, and messages come from the database. Bindings, messages, and confirmed demo alerts are saved to Supabase. Phone GPS updates the bound node's latest position. It does not create tracking logs with invented RSSI; tracking history reads existing database readings. Dates are grouped in Asia/Tokyo to match the seeded history.

Supabase stores app data only. Bluetooth pairing, LoRa transmission, and contacting emergency services are not implemented.

With RLS disabled, the browser UUID filters are a demo convenience, not access control. Data is accessible according to the table grants.

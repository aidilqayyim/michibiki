# Michibiki — Expo Go

React Native companion for the Michibiki LoRa hackathon. Runs on Android phones, iPhones, and tablets with Expo SDK 57.

## Run

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` if needed, and fill in your Supabase URL and publishable key. Existing project keys have been renamed to Expo's `EXPO_PUBLIC_` format.
3. Run `npm start`, then scan the QR code with Expo Go (Android) or Camera (iPhone). Use an Expo Go version supporting SDK 57 and put the computer and phone on the same network.
4. If the network blocks LAN discovery, use `npx expo start --tunnel` (may request installation of Expo's tunnel helper).

Use `npm run android` for an installed Android emulator. An iOS simulator needs macOS; a physical iPhone works with Expo Go from Windows.

## Features

- Supabase-backed nodes, binding, channels, direct messages, tracking history, and emergency alerts.
- Native map with labeled nodes, a purple bound-device marker, inner-dot recenter animation, and signal rings every three seconds.
- Tracking logs grouped by day; Show on Map displays that day's points and paths.
- Floating animated bubble tabs, dark native screens, keyboard-aware messaging, and tablet layouts.
- Your bound device's messages appear green on the left with the label **You**.

The app uses React Navigation instead of React Router, native StyleSheet styles instead of Tailwind/CSS, and react-native-maps instead of browser MapLibre. Maps use Apple Maps on iOS and Google Maps on Android. Their labels follow platform/provider localization; the former MapLibre English-label override does not apply.

## Data and hardware

The existing SQL schema is unchanged. See [Supabase setup](supabase/README.md). No sign-in or RLS policy was added. The install UUID is kept in AsyncStorage; a native installation gets a different identity from the old browser app. Disconnect a previously bound device from its old installation before binding it here if the database reports a conflict.

Messages and alerts are saved to Supabase. Bluetooth pairing, physical LoRa transmission, and emergency-service delivery remain unimplemented. Expo Go cannot load arbitrary custom radio native modules; hardware integration may require a development build later.

Tracking history uses recorded database entries only; no RSSI readings or tracking records are invented. History continues to use recorded database entries and Japan time, matching the existing seed data. Public Expo environment variables are included in the app bundle; use only Supabase publishable/anon keys.

## Safety controls

Keep Expo Go open, bind your device in Connect, and open Map. In a **separate terminal** (not the Metro terminal), run:

```sh
npm run controls -- --node A07
```

Replace `A07` with your own connected device ID. Omitting `--node` prompts for it. The terminal uses Supabase Broadcast to target that device's app; it prints confirmation only when the app acknowledges the command. The Map's **Safety** button also provides touch controls and displays keyboard connection status.

- **Shift+M:** after 3 seconds, your connected device fails to emit its signal. Its last known map position turns red, with a blinking warning and `Retrying... x1` through `x5`, at 3-second intervals. After the fifth interval, publish an emergency for other nodes.
- **Shift+B:** after 3 seconds, show **Are you okay?** for your bound device, with a real 5-minute countdown. Both **I'm okay** and **I need help** publish a notification, recording the chosen response accurately. On success, a confirmation dialog appears; **Continue** shows a dismissible notice above the navbar stating that rangers, the base station, or nearby users may contact you.
- **Shift+V:** while that prompt is active, rapidly count the displayed numbers down to five seconds over 1.5 seconds, then count the final five seconds normally. The timer stays in place. Repeated presses neither restart nor extend the countdown. Either response button remains available during the fast countdown.
- **Shift+R:** reset the simulation. An alert already published remains in Warning Logs. Reset does not recall a request already being sent.

One simulation runs at a time. Switching devices cancels pending simulation timers. An unpublished failure offers Retry using the same alert ID, preventing duplicate records. Simulation state and marker changes are local to the controlling app; real node readings and positions are never overwritten. Alerts are saved to `emergency_alerts` with the existing internal `is_demo` flag retained for manually triggered events; displayed messages have no prefix. Other app users receive them through the existing Realtime/polling emergency feed; unconnected radio hardware receives nothing, and actual delivery to every user is not guaranteed.

Keep the app in the foreground for the presentation. Deadlines are checked again on returning to the app, but Expo Go does not run a guaranteed background inactivity monitor. Reloading the app cancels unfinished simulations.

## Checks

`npm test` runs native component and data tests.
`npm run build` exports Android and iOS JavaScript bundles; this is not an APK/IPA build.
`npx expo install --check --npm` checks SDK package compatibility.

A native build for distribution will need app signing and Google Maps configuration on Android. Expo Go uses its own native configuration.


# Michibiki — Expo Go

React Native companion for the Michibiki LoRa hackathon. Runs on Android phones, iPhones, and tablets with Expo SDK 57.

## Run

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` if needed, and fill in your Supabase URL and publishable key. Existing project keys have been renamed to Expo's `EXPO_PUBLIC_` format.
3. Run `npm start`, then scan the QR code with Expo Go (Android) or Camera (iPhone). Use an Expo Go version supporting SDK 57 and put the computer and phone on the same network.
4. If the network blocks LAN discovery, use `npx expo start --tunnel` (may request installation of Expo's tunnel helper).

Use `npm run android` for an installed Android emulator. An iOS simulator needs macOS; a physical iPhone works with Expo Go from Windows.

## Features

- Supabase-backed nodes, binding, channels, direct messages, tracking history, and confirmed demo emergency alerts.
- Native map with labeled nodes, a purple bound-device marker, inner-dot recenter animation, and signal rings every three seconds.
- Optional foreground phone location updates the bound device after permission is granted.
- Tracking logs grouped by day; Show on Map displays that day's points and paths.
- Floating animated bubble tabs, dark native screens, keyboard-aware messaging, and tablet layouts.
- Your bound device's messages appear green on the left with the label **You**.

The app uses React Navigation instead of React Router, native StyleSheet styles instead of Tailwind/CSS, and react-native-maps instead of browser MapLibre. Maps use Apple Maps on iOS and Google Maps on Android. Their labels follow platform/provider localization; the former MapLibre English-label override does not apply.

## Data and hardware

The existing SQL schema is unchanged. See [Supabase setup](supabase/README.md). No sign-in or RLS policy was added. The install UUID is kept in AsyncStorage; a native installation gets a different identity from the old browser app. Disconnect a previously bound device from its old installation before binding it here if the database reports a conflict.

Messages and alerts are saved to Supabase. Bluetooth pairing, physical LoRa transmission, and emergency-service delivery remain unimplemented. Expo Go cannot load arbitrary custom radio native modules; hardware integration may require a development build later.

Location updates save actual phone coordinates, but do not invent RSSI readings or tracking records. History continues to use recorded database entries and Japan time, matching the existing seed data. Public Expo environment variables are included in the app bundle; use only Supabase publishable/anon keys.

## Checks

`npm test` runs native component and data tests.
`npm run build` exports Android and iOS JavaScript bundles; this is not an APK/IPA build.
`npx expo install --check --npm` checks SDK package compatibility.

A native build for distribution will need app signing and Google Maps configuration on Android. Expo Go uses its own native configuration.


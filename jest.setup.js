jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000001' }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(), loop: false, volume: 1 }),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
// Weather comes from Open-Meteo; tests get a fixed rainy reading instead of calling the network.
global.fetch = jest.fn(async url => ({
  ok: true,
  json: async () => {
    const count = String(url).match(/latitude=([^&]*)/)[1].split(',').length;
    const reading = { current: { temperature_2m: 21.4, weather_code: 63, wind_speed_10m: 12.2, is_day: 1 } };
    return count === 1 ? reading : Array.from({ length: count }, () => reading);
  },
}));

import { weatherInfo } from './weather';
test('weather codes map to distinct conditions and icons', () => {
  expect(weatherInfo(0, true)).toMatchObject({ label: 'Clear', icon: 'sun' });
  expect(weatherInfo(0, false)).toMatchObject({ label: 'Clear', icon: 'moon' });
  expect(weatherInfo(2).icon).toBe('cloud-sun');
  expect(weatherInfo(3).icon).toBe('cloud');
  expect(weatherInfo(45).icon).toBe('cloud-fog');
  expect(weatherInfo(53).icon).toBe('cloud-drizzle');
  expect(weatherInfo(81).icon).toBe('cloud-rain');
  expect(weatherInfo(75).icon).toBe('cloud-snow');
  expect(weatherInfo(95).icon).toBe('cloud-lightning');
});

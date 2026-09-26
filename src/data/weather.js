import { useEffect, useState } from 'react';

// Current conditions from Open-Meteo (free, no API key). One request covers every node.
const CACHE_MS = 10 * 60 * 1000;
let cache = { key: '', at: 0, byNode: {} };
let inflight = null;

// WMO weather codes grouped into the conditions the app shows.
export function weatherInfo(code, isDay = true) {
  if (code === 0) return isDay ? { label: 'Clear', icon: 'sun', color: '#facc15' } : { label: 'Clear', icon: 'moon', color: '#c7d2fe' };
  if (code === 1 || code === 2) return isDay ? { label: 'Partly cloudy', icon: 'cloud-sun', color: '#fde68a' } : { label: 'Partly cloudy', icon: 'cloud', color: '#cbd5e1' };
  if (code === 3) return { label: 'Overcast', icon: 'cloud', color: '#cbd5e1' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: 'cloud-fog', color: '#94a3b8' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: 'cloud-drizzle', color: '#7dd3fc' };
  if (code >= 61 && code <= 67 || code >= 80 && code <= 82) return { label: 'Rain', icon: 'cloud-rain', color: '#60a5fa' };
  if (code >= 71 && code <= 77 || code === 85 || code === 86) return { label: 'Snow', icon: 'cloud-snow', color: '#e0f2fe' };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: 'cloud-lightning', color: '#c084fc' };
  return { label: 'Unknown', icon: 'cloud', color: '#94a3b8' };
}

function located(nodes) {
  return nodes.filter(node => node.lat != null && node.lng != null
    && Number.isFinite(Number(node.lat)) && Number.isFinite(Number(node.lng)));
}

async function fetchWeather(nodes) {
  const params = [
    'latitude=' + nodes.map(node => Number(node.lat).toFixed(4)).join(','),
    'longitude=' + nodes.map(node => Number(node.lng).toFixed(4)).join(','),
    'current=temperature_2m,weather_code,wind_speed_10m,is_day',
    'timezone=auto',
  ].join('&');
  const response = await fetch('https://api.open-meteo.com/v1/forecast?' + params);
  if (!response.ok) throw new Error('Weather unavailable');
  const body = await response.json();
  const results = Array.isArray(body) ? body : [body];
  return Object.fromEntries(nodes.map((node, index) => {
    const current = results[index]?.current;
    if (!current) return [node.id, null];
    return [node.id, {
      ...weatherInfo(current.weather_code, current.is_day !== 0),
      temperature: Math.round(current.temperature_2m),
      wind: Math.round(current.wind_speed_10m),
    }];
  }));
}

// Returns { [nodeId]: { label, icon, color, temperature, wind } | null }.
export function useWeather(nodes) {
  const targets = located(nodes);
  const key = targets.map(node => node.id + ':' + Number(node.lat).toFixed(2) + ',' + Number(node.lng).toFixed(2)).join('|');
  const [byNode, setByNode] = useState(() => cache.key === key ? cache.byNode : {});

  useEffect(() => {
    if (!targets.length) return;
    let active = true;
    const load = () => {
      // Small margin so the interval tick is never skipped for a cache that is a few seconds too fresh.
      if (cache.key === key && Date.now() - cache.at < CACHE_MS - 30000) {
        setByNode(cache.byNode);
        return;
      }
      if (!inflight || inflight.key !== key) {
        inflight = {
          key,
          promise: fetchWeather(targets).then(result => {
            cache = { key, at: Date.now(), byNode: result };
            return result;
          }).finally(() => {
            if (inflight?.key === key) inflight = null;
          }),
        };
      }
      inflight.promise.then(result => {
        if (active) setByNode(result);
      }).catch(() => {});
    };
    load();
    const timer = setInterval(load, CACHE_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
    // `key` captures every coordinate that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return byNode;
}

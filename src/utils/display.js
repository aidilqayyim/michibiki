export function lastSeenLabel(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (!Number.isFinite(minutes)) return 'Unknown';
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return date.toLocaleDateString();
}

// One source for signal colours so the Nodes bars and map rings agree. Red is reserved for no signal.
const SIGNALS = {
  Strong: { level: 1, color: '#4ade80', label: 'Strong' },
  Good: { level: 0.5, color: '#facc15', label: 'Good' },
  Weak: { level: 0.15, color: '#fb923c', label: 'Weak' },
  Offline: { level: 0, color: '#ef4444', label: 'No signal' },
};

export function signalInfo(signal) {
  return SIGNALS[signal] || SIGNALS.Offline;
}

export const ROLES = ['Hiker', 'Relay', 'Base Station'];

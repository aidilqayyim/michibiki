export function logDateKey(timestamp) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(timestamp));
  const get = (type) => parts.find((part) => part.type === type).value;
  return get('year') + '-' + get('month') + '-' + get('day');
}

export function getTrackingLogs(logs, nodeId = "all", date) {
  return logs.filter((entry) => (nodeId === "all" || entry.nodeId === nodeId) && (!date || entry.date === date))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.nodeId.localeCompare(b.nodeId));
}

export function formatLogDate(date) {
  return new Date(`${date}T12:00:00+09:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Tokyo" });
}

export function formatLogTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Tokyo" });
}

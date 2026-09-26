// Test-only fixtures. Runtime pages load exclusively from Supabase.
export function meshFixture() {
  const nodes = [{
    id: "A07",
    name: "Michibiki A07",
    lat: 33.891213,
    lng: 130.840128,
    color: "#4ade80",
    battery: 88,
    signal: "Strong",
    bindable: true
  }, {
    id: "B12",
    name: "Michibiki B12",
    lat: 33.8894,
    lng: 130.8375,
    color: "#7dd3fc",
    battery: 74,
    signal: "Good",
    bindable: true
  }, {
    id: "C03",
    name: "Michibiki C03",
    lat: 33.8935,
    lng: 130.8455,
    color: "#fb7185",
    battery: 91,
    signal: "Good",
    bindable: true
  }, {
    id: "R03",
    name: "Relay R03",
    lat: 33.8992,
    lng: 130.8361,
    color: "#fbbf24",
    battery: 57,
    signal: "Weak",
    bindable: false
  }];
  const logs = ["2026-09-26", "2026-09-25", "2026-09-24"].flatMap(date => nodes.flatMap(node => [0, 1, 2, 3].map(point => ({
    id: `${date}-${node.id}-${point}`,
    nodeId: node.id,
    date,
    timestamp: `${date}T${9 + point < 10 ? "0" : ""}${9 + point}:15:00+09:00`,
    lat: node.lat + point * 0.0001,
    lng: node.lng,
    rssi: -80
  }))));
  return {
    nodes,
    logs,
    boundId: null,
    channels: [],
    messages: [],
    alerts: [],
    user: {
      id: "test-user"
    },
    refresh: jest.fn(),
    saveLocation: jest.fn().mockResolvedValue(undefined),
    sendEmergency: jest.fn().mockResolvedValue({
      id: "alert"
    })
  };
}

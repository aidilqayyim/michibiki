// Great-circle surface distance from latitude/longitude, in metres.
export function distanceBetweenNodes(from, to) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lng - from.lng);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export function formatDistance(metres) {
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(2)} km`;
}

export function applyEnglishLabels(map) {
  for (const layer of map.getStyle().layers) {
    const text = layer.layout?.["text-field"];
    // Leave route numbers and other non-name labels intact.
    if (layer.type === "symbol" && text && /name/.test(JSON.stringify(text))) {
      map.setLayoutProperty(layer.id, "text-field", [
        "coalesce", ["get", "name_en"], ["get", "name:en"],
        ["get", "name:latin"], ["get", "name"], "",
      ]);
    }
  }
}

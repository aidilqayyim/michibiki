import { useMesh } from "../data/MeshProvider";
import { escapeHtml } from "../utils/display";
import React, { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Marker, Popup, LngLatBounds } from "maplibre-gl";
import { getTrackingLogs, formatLogDate, formatLogTime } from "../data/trackingLogs";

export default function MapHistory({ map, liveMarkers }) {
  const { nodes: logNodes, logs } = useMesh();
  const [params, setParams] = useSearchParams();
  const date = params.get("historyDate");
  const nodeId = params.get("historyNode") || "all";
  const records = useMemo(() => date ? getTrackingLogs(logs, nodeId, date) : [], [logs, date, nodeId]);

  useEffect(() => {
    if (!map || !date) return;
    const markers = [];
    const live = Object.values(liveMarkers.current);
    live.forEach((marker) => { marker.getElement().style.display = "none"; marker.getPopup()?.remove(); });
    const bounds = new LngLatBounds();
    const features = [];
    for (const node of logNodes) {
      const points = records.filter((entry) => entry.nodeId === node.id);
      if (points.length > 1) features.push({ type: "Feature", properties: { color: node.color }, geometry: { type: "LineString", coordinates: points.map((entry) => [entry.lng, entry.lat]) } });
      points.forEach((entry, index) => {
        bounds.extend([entry.lng, entry.lat]);
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `${entry.nodeId} · ${index + 1}`;
        button.setAttribute("aria-label", `${entry.nodeId}, ${formatLogTime(entry.timestamp)}, tracking point ${index + 1}`);
        Object.assign(button.style, { padding: "8px", minHeight: "40px", borderRadius: "20px", border: "2px solid white", background: node.color, color: "#111", fontWeight: "700", fontSize: "11px", cursor: "pointer" });
        const popup = new Popup({ offset: 20 }).setHTML(`<div style="color:#111;font-family:inherit"><strong>${escapeHtml(entry.nodeId)} · ${formatLogDate(entry.date)}</strong><p>${formatLogTime(entry.timestamp)} JST</p><p>Latitude: ${entry.lat.toFixed(6)}<br/>Longitude: ${entry.lng.toFixed(6)}<br/>RSSI: ${entry.rssi} dBm</p></div>`);
        markers.push(new Marker({ element: button }).setLngLat([entry.lng, entry.lat]).setPopup(popup).addTo(map));
      });
    }
    const draw = () => {
      const data = { type: "FeatureCollection", features };
      if (map.getSource("tracking-history")) map.getSource("tracking-history").setData(data);
      else {
        map.addSource("tracking-history", { type: "geojson", data });
        map.addLayer({ id: "tracking-history", type: "line", source: "tracking-history", paint: { "line-color": ["get", "color"], "line-width": 4, "line-opacity": 0.85 } });
      }
    };
    if (map.isStyleLoaded()) draw();
    map.on("style.load", draw);
    if (records.length) map.fitBounds(bounds, { padding: { top: 210, bottom: 180, left: 65, right: 65 }, maxZoom: 16, duration: 0 });
    return () => {
      map.off("style.load", draw);
      markers.forEach((marker) => marker.remove());
      live.forEach((marker) => { marker.getElement().style.display = "grid"; });
      if (map.getStyle()) {
        if (map.getLayer("tracking-history")) map.removeLayer("tracking-history");
        if (map.getSource("tracking-history")) map.removeSource("tracking-history");
      }
    };
  }, [map, date, records, liveMarkers, logNodes]);

  if (!date) return null;
  return <section className="absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+90px)] z-20 max-w-sm rounded-2xl border border-white/20 bg-black/85 p-4 text-white backdrop-blur-xl">
    <p className="text-xs text-blue-300">Tracking history · {nodeId === "all" ? "All nodes" : nodeId}</p>
    <h2 className="mt-1 font-bold">{records.length ? formatLogDate(date) : "No history found"}</h2>
    <p className="mt-1 text-xs text-white/50">{records.length} positions · Tap a point for details. Lines connect readings, not verified trails.</p>
    <div className="mt-3 flex gap-4 text-xs text-blue-300"><Link to={`/logs?node=${encodeURIComponent(nodeId)}`}>Back to logs</Link><button onClick={() => setParams({})}>Exit history</button></div>
  </section>;
}

import React, { useEffect, useState } from "react";
import { useMesh } from "../data/MeshProvider";

export default function CurrentLocation({ map, nodeId, markers, locationRef }) {
  const { saveLocation } = useMesh();
  const [message, setMessage] = useState("Finding your location...");
  const [request, setRequest] = useState(0);
  useEffect(() => {
    if (!map) return;
    if (!nodeId) { setMessage("Connect a device to save your phone location."); return; }
    let cancelled = false;
    if (!navigator.geolocation) { setMessage("Location unavailable. Using demo coordinates."); return; }
    setMessage("Finding your location...");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      if (cancelled) return;
      try {
        setMessage("Saving location...");
        await saveLocation(nodeId, coords);
        if (cancelled) return;
      const position = [coords.longitude, coords.latitude];
      locationRef.current = { id: nodeId, lng: coords.longitude, lat: coords.latitude };
      markers.current[nodeId]?.setLngLat(position);
      map.jumpTo({ center: position, zoom: 15 });
      setMessage(`${nodeId}: phone GPS location, accuracy ±${Math.round(coords.accuracy)} m.`);
      } catch (error) {
        if (!cancelled) setMessage(`Location was not saved: ${error.message}`);
      }
    }, (error) => {
      if (cancelled) return;
      setMessage(`${error.code === 1 ? "Location access denied" : "Location unavailable"}. Keeping existing coordinates.`);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
    return () => { cancelled = true; };
  }, [map, nodeId, markers, locationRef, request, saveLocation]);
  return <div className="absolute left-4 top-[calc(env(safe-area-inset-top)+90px)] z-10 max-w-[calc(100%-32px)] rounded-2xl border border-white/10 bg-black/75 p-3 text-xs text-white/70 backdrop-blur-xl"><p role="status">{message}</p><button onClick={() => setRequest((current) => current + 1)} className="mt-2 text-blue-300">Refresh location</button></div>;
}

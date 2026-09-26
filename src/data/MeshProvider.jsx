import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ensureIdentity, writeBinding, writeLocation, insertRow } from "./api";
import { loadMesh } from "./MeshQueries";

const MeshContext = createContext(null);
export function useMesh() {
  const value = useContext(MeshContext);
  if (!value) throw new Error("MeshProvider is missing.");
  return value;
}

export default function MeshProvider({ children }) {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const mounted = useRef(false);
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    const request = ++revision.current;
    refreshing.current = true;
    try {
      const currentUser = await ensureIdentity();
      const result = await loadMesh(currentUser.id);
      if (mounted.current && request === revision.current) {
        setUser(currentUser);
        setData((previous) => previous ? Object.fromEntries(Object.entries(result).map(([key, value]) =>
          [key, JSON.stringify(previous[key]) === JSON.stringify(value) ? previous[key] : value]
        )) : result);
        setError("");
      }
    } catch (failure) {
      if (mounted.current && request === revision.current) setError(failure.message || "Could not reach Supabase.");
    } finally { if (request === revision.current) refreshing.current = false; }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const timer = setInterval(() => { if (!refreshing.current && document.visibilityState === "visible") refresh(); }, 15000);
    const onFocus = () => { if (!refreshing.current) refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { mounted.current = false; clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  const bindDevice = async (nodeId) => {
    if (nodeId && !data.nodes.some((node) => node.id === nodeId && node.bindable)) throw new Error("This device cannot be bound.");
    setBusy(true);
    try {
      await writeBinding(user.id, nodeId);
      ++revision.current;
      setData((previous) => ({ ...previous, boundId: nodeId }));
      await refresh();
    } finally { setBusy(false); }
  };

  const boundId = data?.boundId;
  const saveLocation = useCallback(async (nodeId, coords) => {
    if (nodeId !== boundId) throw new Error("Bind this device before saving its location.");
    const node = await writeLocation(nodeId, coords);
    ++revision.current;
    refreshing.current = false;
    setData((previous) => ({ ...previous, nodes: previous.nodes.map((item) => item.id === nodeId ? node : item) }));
  }, [boundId]);

  const sendEmergency = async () => {
    const node = data.nodes.find((item) => item.id === data.boundId);
    const alert = await insertRow("emergency_alerts", { user_id: user.id, node_id: node?.id || null, lat: node?.lat ?? null, lng: node?.lng ?? null, is_demo: true });
    ++revision.current;
    refreshing.current = false;
    setData((previous) => ({ ...previous, alerts: [alert, ...previous.alerts] }));
    return alert;
  };

  const sendMessage = async ({ body, channelId, recipientId }) => {
    if (!data.boundId) throw new Error("Connect a device before sending a message.");
    const message = await insertRow("messages", { user_id: user.id, sender_node_id: data.boundId, body: body.trim(), channel_id: channelId || null, recipient_node_id: recipientId || null });
    ++revision.current;
    refreshing.current = false;
    setData((previous) => ({ ...previous, messages: [...previous.messages, message] }));
  };

  if (!data) return <main className="grid min-h-screen place-items-center bg-black px-6 text-white"><div className="max-w-md text-center"><h1 className="text-2xl font-bold">Michibiki</h1><p role={error ? "alert" : "status"} className="mt-4 text-sm leading-6 text-white/65">{error || "Connecting to your mesh..."}</p>{error && <button onClick={refresh} className="mt-5 rounded-full bg-blue-400 px-5 py-3 font-semibold text-black">Retry connection</button>}</div></main>;
  return <MeshContext.Provider value={{ ...data, user, busy, error, refresh, bindDevice, saveLocation, sendEmergency, sendMessage }}>
    {error && <div role="alert" className="fixed left-3 right-3 top-2 z-[80] rounded-xl bg-red-950 p-3 text-xs text-white">Showing last loaded data. {error}<button className="ml-3 underline" onClick={refresh}>Retry</button></div>}
    {children}
  </MeshContext.Provider>;
}

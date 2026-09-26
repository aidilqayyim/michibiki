import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ensureIdentity, writeBinding, writeLocation, writeRole, insertRow, createChannelRows } from "./api";
import { loadMesh } from "./MeshQueries";
import { supabase } from "../supabaseClient";
import { AppState, View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Note, s } from "../ui";
const MeshContext = createContext(null);
export function useMesh() {
  const value = useContext(MeshContext);
  if (!value) throw new Error("MeshProvider is missing.");
  return value;
}
export default function MeshProvider({
  children
}) {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [incomingAlerts, setIncomingAlerts] = useState([]);
  const revision = useRef(0);
  const seenAlerts = useRef(new Set());
  // Alerts raised by this phone or its bound device are never sounded back to it; each alert sounds once.
  const queueAlert = useCallback((row, userId, boundId) => {
    if (!row || seenAlerts.current.has(row.id)) return;
    seenAlerts.current.add(row.id);
    if (row.user_id === userId || row.node_id && row.node_id === boundId) return;
    setIncomingAlerts(current => [...current, row]);
  }, []);
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
        setData(previous => previous ? Object.fromEntries(Object.entries(result).map(([key, value]) => [key, JSON.stringify(previous[key]) === JSON.stringify(value) ? previous[key] : value])) : result);
        setError("");
        // Fallback for when Realtime is off or missed an event: recent alerts arrive on the next refresh.
        (result.recentAlerts || []).forEach(row => queueAlert(row, currentUser.id, result.boundId));
      }
    } catch (failure) {
      if (mounted.current && request === revision.current) setError(failure.message || "Could not reach Supabase.");
    } finally {
      if (request === revision.current) refreshing.current = false;
    }
  }, [queueAlert]);
  useEffect(() => {
    mounted.current = true;
    refresh();
    const timer = setInterval(() => {
      if (!refreshing.current && AppState.currentState === "active") refresh();
    }, 15000);
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active" && !refreshing.current) refresh();
    });
    return () => {
      mounted.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh]);
  const userId = user?.id;
  const boundRef = useRef(null);
  boundRef.current = data?.boundId;
  useEffect(() => {
    if (!supabase || !userId) return;
    const addMessage = row => {
      ++revision.current;
      refreshing.current = false;
      setData(previous => !previous || previous.messages.some(message => message.id === row.id) ? previous : {
        ...previous,
        messages: [...previous.messages, row]
      });
    };
    const addAlert = row => {
      queueAlert(row, userId, boundRef.current);
      setData(previous => !previous || (previous.warningLogs || []).some(alert => alert.id === row.id) ? previous : {
        ...previous,
        warningLogs: [row, ...(previous.warningLogs || [])]
      });
    };
    const channel = supabase.channel("mesh-live").on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages"
    }, payload => addMessage(payload.new)).on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "emergency_alerts"
    }, payload => addAlert(payload.new)).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queueAlert]);
  const dismissAlert = id => setIncomingAlerts(current => current.filter(alert => alert.id !== id));
  const bindDevice = async (nodeId, role) => {
    const node = data.nodes.find(item => item.id === nodeId);
    if (nodeId && !node) throw new Error("This device is no longer available.");
    if (nodeId && data.inUseIds?.includes(nodeId)) throw new Error("That device is in use by another user. Choose another device.");
    setBusy(true);
    try {
      await writeBinding(user.id, nodeId);
      ++revision.current;
      setData(previous => ({
        ...previous,
        boundId: nodeId
      }));
      if (node && role && role !== node.role) {
        const updated = await writeRole(nodeId, role).catch(failure => {
          throw new Error("Device bound, but its role could not be saved: " + failure.message);
        });
        setData(previous => ({
          ...previous,
          nodes: previous.nodes.map(item => item.id === nodeId ? updated : item)
        }));
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  const boundId = data?.boundId;
  const saveLocation = useCallback(async (nodeId, coords) => {
    if (nodeId !== boundId) throw new Error("Bind this device before saving its location.");
    const node = await writeLocation(nodeId, coords);
    ++revision.current;
    refreshing.current = false;
    setData(previous => ({
      ...previous,
      nodes: previous.nodes.map(item => item.id === nodeId ? node : item)
    }));
  }, [boundId]);
  const sendEmergency = async () => {
    const node = data.nodes.find(item => item.id === data.boundId);
    const alert = await insertRow("emergency_alerts", {
      user_id: user.id,
      node_id: node?.id || null,
      lat: node?.lat ?? null,
      lng: node?.lng ?? null,
      is_demo: true
    });
    ++revision.current;
    refreshing.current = false;
    setData(previous => ({
      ...previous,
      alerts: [alert, ...previous.alerts],
      warningLogs: [alert, ...(previous.warningLogs || []).filter(item => item.id !== alert.id)]
    }));
    return alert;
  };
  const sendMessage = async ({
    body,
    channelId,
    recipientId
  }) => {
    if (!data.boundId) throw new Error("Connect a device before sending a message.");
    const message = await insertRow("messages", {
      user_id: user.id,
      sender_node_id: data.boundId,
      body: body.trim(),
      channel_id: channelId || null,
      recipient_node_id: recipientId || null
    });
    ++revision.current;
    refreshing.current = false;
    setData(previous => previous.messages.some(item => item.id === message.id) ? previous : {
      ...previous,
      messages: [...previous.messages, message]
    });
    return message;
  };
  const createChannel = async ({
    name,
    nodeIds
  }) => {
    if (!name.trim()) throw new Error("Enter a channel name.");
    const members = [...new Set([data.boundId, ...nodeIds].filter(Boolean))];
    if (!members.length) throw new Error("Select at least one device.");
    const channel = await createChannelRows(name, members);
    ++revision.current;
    refreshing.current = false;
    setData(previous => ({
      ...previous,
      channels: [...previous.channels, channel]
    }));
    return channel;
  };
  if (!data) return <SafeAreaView style={[s.screen, {
    justifyContent: 'center',
    padding: 24
  }]}><Text style={s.title}>Michibiki</Text><Note error={!!error}>{error || "Connecting to your mesh..."}</Note>{error ? <Button title="Retry connection" onPress={refresh} /> : <ActivityIndicator color="#79aaff" />}</SafeAreaView>;
  return <MeshContext.Provider value={{
    ...data,
    user,
    busy,
    error,
    refresh,
    bindDevice,
    saveLocation,
    sendEmergency,
    sendMessage,
    createChannel,
    incomingAlerts,
    dismissAlert
  }}>
    {error && <SafeAreaView edges={['top']} style={{
      backgroundColor: '#401c24',
      paddingHorizontal: 16
    }}><View><Note error>Showing last loaded data. {error}</Note><Button title="Retry" onPress={refresh} /></View></SafeAreaView>}
    {children}
  </MeshContext.Provider>;
}

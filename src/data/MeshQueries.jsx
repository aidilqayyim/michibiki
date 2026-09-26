import { supabase } from "../supabaseClient";
import { logDateKey } from "./trackingLogs";

export async function readPages(makeSelect) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await makeSelect().range(offset, offset + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

// Shared SELECT queries for the JSX screens. No SQL editor or sign-in call.
export async function loadMesh(userId) {
  const [nodes, bindings, logs, channels, messages, alerts] = await Promise.all([
    // SELECT * FROM nodes ORDER BY id;
    readPages(() => supabase.from("nodes").select("*").order("id")),
    // SELECT * FROM device_bindings WHERE user_id = :browser_id;
    readPages(() => supabase.from("device_bindings").select("*")
      .eq("user_id", userId).order("user_id")),
    // SELECT * FROM tracking_logs ORDER BY recorded_at, id;
    readPages(() => supabase.from("tracking_logs").select("*")
      .order("recorded_at").order("id")),
    // SELECT * FROM channels ORDER BY id;
    readPages(() => supabase.from("channels").select("*").order("id")),
    // SELECT * FROM messages ORDER BY sent_at, id;
    readPages(() => supabase.from("messages").select("*")
      .order("sent_at").order("id")),
    // SELECT * FROM emergency_alerts WHERE user_id = :browser_id;
    readPages(() => supabase.from("emergency_alerts").select("*")
      .eq("user_id", userId).order("created_at", { ascending: false }).order("id")),
  ]);
  return {
    nodes, boundId: bindings[0]?.node_id || null, channels, messages, alerts,
    logs: logs.map((row) => ({ ...row, nodeId: row.node_id, timestamp: row.recorded_at, date: logDateKey(row.recorded_at) })),
  };
}

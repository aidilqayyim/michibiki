import { supabase } from "../supabaseClient";
import { logDateKey } from "./trackingLogs";
export async function readPages(makeSelect) {
  const rows = [];
  for (let offset = 0;; offset += 500) {
    const {
      data,
      error
    } = await makeSelect().range(offset, offset + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

// Databases set up before channel_members existed still load; channels are then open to all.
function missingTableAsEmpty(error) {
  if (error?.code === "PGRST205" || error?.code === "42P01") return [];
  throw error;
}

// Shared SELECT queries for the JSX screens. No SQL editor or sign-in call.
export async function loadMesh(userId) {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const [nodes, bindings, logs, channels, members, messages, alerts, recentAlerts, warningLogs] = await Promise.all([
  // SELECT * FROM nodes ORDER BY id;
  readPages(() => supabase.from("nodes").select("*").order("id")),
  // SELECT * FROM device_bindings ORDER BY user_id; other users' rows mark devices as in use.
  readPages(() => supabase.from("device_bindings").select("*").order("user_id")),
  // SELECT * FROM tracking_logs ORDER BY recorded_at, id;
  readPages(() => supabase.from("tracking_logs").select("*").order("recorded_at").order("id")),
  // SELECT * FROM channels ORDER BY id;
  readPages(() => supabase.from("channels").select("*").order("id")),
  // SELECT * FROM channel_members ORDER BY channel_id, node_id;
  readPages(() => supabase.from("channel_members").select("*").order("channel_id").order("node_id")).catch(missingTableAsEmpty),
  // SELECT * FROM messages ORDER BY sent_at, id;
  readPages(() => supabase.from("messages").select("*").order("sent_at").order("id")),
  // SELECT * FROM emergency_alerts WHERE user_id = :browser_id;
  readPages(() => supabase.from("emergency_alerts").select("*").eq("user_id", userId).order("created_at", {
    ascending: false
  }).order("id")),
  // SELECT * FROM emergency_alerts WHERE status = 'active' AND created_at >= now() - 10 min AND user_id <> :browser_id;
  readPages(() => supabase.from("emergency_alerts").select("*").eq("status", "active").gte("created_at", since).neq("user_id", userId).order("created_at").order("id")),
  // SELECT * FROM emergency_alerts ORDER BY created_at DESC LIMIT 100; the map's warning log.
  supabase.from("emergency_alerts").select("*").order("created_at", {
    ascending: false
  }).order("id").limit(100).then(({
    data,
    error
  }) => {
    if (error) throw error;
    return data;
  })]);
  return {
    nodes,
    boundId: bindings.find(binding => binding.user_id === userId)?.node_id || null,
    inUseIds: bindings.filter(binding => binding.user_id !== userId).map(binding => binding.node_id),
    channels: channels.map(channel => ({
      ...channel,
      memberIds: members.filter(member => member.channel_id === channel.id).map(member => member.node_id)
    })),
    messages,
    alerts,
    recentAlerts,
    warningLogs,
    logs: logs.map(row => ({
      ...row,
      nodeId: row.node_id,
      timestamp: row.recorded_at,
      date: logDateKey(row.recorded_at)
    }))
  };
}

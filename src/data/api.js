import { supabase } from "../supabaseClient";

export async function ensureIdentity() {
  if (!supabase) return Promise.reject(new Error("Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_PUBLISHABLE_KEY in .env, then restart the app."));
  const key = "michibiki.clientId";
  try {
    let id = localStorage.getItem(key);
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return { id };
  } catch {
    throw new Error("Browser storage is required to remember your device binding. Allow site storage and reload.");
  }
}

export async function writeBinding(userId, nodeId) {
  const query = nodeId
    ? supabase.from("device_bindings").upsert({ user_id: userId, node_id: nodeId, bound_at: new Date().toISOString() }, { onConflict: "user_id" }).select().single()
    : supabase.from("device_bindings").delete().eq("user_id", userId);
  const { error } = await query;
  if (error) throw new Error(error.code === "23505" ? "That device is already bound to another user. Choose another device." : error.message);
}

export async function writeLocation(nodeId, coords) {
  const { data, error } = await supabase.from("nodes").update({ lat: coords.latitude, lng: coords.longitude, last_seen: new Date().toISOString() }).eq("id", nodeId).select().single();
  if (error) throw error;
  return data;
}

export async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

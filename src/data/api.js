import { supabase } from "../supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
let identityRequest;
export function ensureIdentity() {
  if (!identityRequest) identityRequest = loadIdentity().catch(error => {
    identityRequest = null;
    throw error;
  });
  return identityRequest;
}
async function loadIdentity() {
  if (!supabase) return Promise.reject(new Error("Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env, then restart the app."));
  const key = "michibiki.clientId";
  try {
    let id = await AsyncStorage.getItem(key);
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      id = randomUUID();
      await AsyncStorage.setItem(key, id);
    }
    return {
      id
    };
  } catch {
    throw new Error("Device storage is unavailable. Restart the app to restore your binding.");
  }
}
export async function writeBinding(userId, nodeId) {
  const query = nodeId ? supabase.from("device_bindings").upsert({
    user_id: userId,
    node_id: nodeId,
    bound_at: new Date().toISOString()
  }, {
    onConflict: "user_id"
  }).select().single() : supabase.from("device_bindings").delete().eq("user_id", userId);
  const {
    error
  } = await query;
  if (error) throw new Error(error.code === "23505" ? "That device is already bound to another user. Choose another device." : error.message);
}
export async function writeLocation(nodeId, coords) {
  const {
    data,
    error
  } = await supabase.from("nodes").update({
    lat: coords.latitude,
    lng: coords.longitude,
    last_seen: new Date().toISOString()
  }).eq("id", nodeId).select().single();
  if (error) throw error;
  return data;
}
export async function writeRole(nodeId, role) {
  const {
    data,
    error
  } = await supabase.from("nodes").update({
    role
  }).eq("id", nodeId).select().single();
  if (error) throw error;
  return data;
}
export async function insertRow(table, row) {
  const {
    data,
    error
  } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}
export async function createChannelRows(name, nodeIds) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "channel";
  const channel = await insertRow("channels", {
    id: `${slug}-${randomUUID().slice(0, 8)}`,
    name: name.trim()
  });
  if (nodeIds.length) {
    const {
      error
    } = await supabase.from("channel_members").insert(nodeIds.map(nodeId => ({
      channel_id: channel.id,
      node_id: nodeId
    })));
    if (error) throw error;
  }
  return {
    ...channel,
    memberIds: nodeIds
  };
}

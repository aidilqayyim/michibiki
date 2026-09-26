// Run alongside Metro: npm run controls -- --node A07
const readline = require('node:readline');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

// Seeded starting point for the mesh nodes this script drives directly (see supabase/hackathon.sql).
// Reset (Shift+X) restores these so a demo run can be repeated from a clean map.
const MESH_ORIGIN = {
  B12: { lat: 33.8894, lng: 130.8375, battery: 74, signal: 'Good', hops: 1 },
  C03: { lat: 33.8935, lng: 130.8455, battery: 91, signal: 'Good', hops: 2 },
  R03: { lat: 33.8992, lng: 130.8361, battery: 57, signal: 'Weak', hops: 3 },
};
const CHANNEL_ID = 'expedition-alpha';
const CHAT_LINES = [
  { node: 'B12', body: 'Reached checkpoint 2, all clear.' },
  { node: 'C03', body: 'Signal strong through the ridge relay.' },
  { node: 'R03', body: 'Relay holding steady, rebroadcasting mesh traffic.' },
  { node: 'B12', body: 'Trail forks ahead, taking the east path.' },
  { node: 'C03', body: 'Spotted the base station beacon, five minutes out.' },
  { node: 'R03', body: 'Three hops active, mesh looks healthy.' },
];
const WALK_STEP = 0.00015;
const WALK_INTERVAL_MS = 1600;

async function main() {
  if (process.argv.includes('--help')) {
    console.log('npm run controls -- --node YOUR_CONNECTED_NODE_ID\nShift+M: your device fails to emit its signal\nShift+B: inactivity check (node not moving)\nShift+V: rapidly count down to 5 seconds\nShift+R: reset your device\'s alert\nShift+W: toggle the rest of the mesh (B12/C03/R03) walking on the map\nShift+C: post the next scripted chat line to the ' + CHANNEL_ID + ' channel\nShift+X: reset the mesh nodes to their starting position\nCtrl+C: exit\nKeep Expo Go open. These publish alerts and mesh activity through Supabase.');
    return;
  }
  try { process.loadEnvFile(path.join(__dirname, '..', '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Add the Supabase URL and publishable key to .env first.');
  const index = process.argv.indexOf('--node');
  let nodeId = index >= 0 ? process.argv[index + 1] : null;
  if (!process.stdin.isTTY) throw new Error('Run this command in an interactive terminal.');
  if (!nodeId) {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    nodeId = await new Promise(resolve => prompt.question('Your connected node ID (shown in Connect): ', resolve));
    prompt.close();
  }
  nodeId = nodeId.trim();
  if (!/^[\w-]{1,80}$/.test(nodeId)) throw new Error('Enter a valid connected node ID.');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // Local copy of the mesh nodes' positions, so Shift+W can move them a little each tick
  // without re-reading the database every time. Falls back to the seed coordinates if a
  // node hasn't loaded yet (e.g. its row was never seeded).
  const meshState = Object.fromEntries(Object.entries(MESH_ORIGIN).map(([id, origin]) => [id, { ...origin, heading: Math.random() * Math.PI * 2 }]));
  {
    const { data, error } = await client.from('nodes').select('id, lat, lng').in('id', Object.keys(MESH_ORIGIN));
    if (!error) for (const row of data) if (meshState[row.id]) Object.assign(meshState[row.id], { lat: row.lat, lng: row.lng });
  }
  let walking = false;
  let walkTimer = null;
  async function walkStep() {
    for (const id of Object.keys(meshState)) {
      const node = meshState[id];
      if (Math.random() < 0.25) node.heading += (Math.random() - 0.5) * (Math.PI / 2);
      node.lat += Math.cos(node.heading) * WALK_STEP;
      node.lng += Math.sin(node.heading) * WALK_STEP;
      const { error } = await client.from('nodes').update({ lat: node.lat, lng: node.lng, last_seen: new Date().toISOString() }).eq('id', id);
      if (error) console.log('Could not move ' + id + ': ' + error.message);
    }
  }
  function setWalking(next) {
    walking = next;
    clearInterval(walkTimer);
    walkTimer = walking ? setInterval(() => { void walkStep(); }, WALK_INTERVAL_MS) : null;
    console.log(walking ? 'Mesh walking: B12/C03/R03 are now drifting on the map.' : 'Mesh walking stopped.');
  }
  let chatIndex = 0;
  async function postNextChatLine() {
    const line = CHAT_LINES[chatIndex % CHAT_LINES.length];
    chatIndex++;
    const { error } = await client.from('messages').insert({ sender_node_id: line.node, channel_id: CHANNEL_ID, body: line.body });
    console.log(error ? 'Could not post message: ' + error.message : line.node + ' → #' + CHANNEL_ID + ': ' + line.body);
  }
  async function resetMesh() {
    setWalking(false);
    for (const [id, origin] of Object.entries(MESH_ORIGIN)) {
      meshState[id] = { ...origin, heading: Math.random() * Math.PI * 2 };
      const { error } = await client.from('nodes').update({ lat: origin.lat, lng: origin.lng, battery: origin.battery, signal: origin.signal, hops: origin.hops, last_seen: new Date().toISOString() }).eq('id', id);
      if (error) console.log('Could not reset ' + id + ': ' + error.message);
    }
    console.log('Mesh nodes reset to their starting position.');
  }

  const channel = client.channel('michibiki-demo:' + nodeId, { config: { broadcast: { ack: true } } });
  const pending = new Map();
  channel.on('broadcast', { event: 'result' }, ({ payload }) => {
    const command = pending.get(payload?.id);
    if (!command) return;
    clearTimeout(command.timer);
    pending.delete(payload.id);
    console.log(payload.error ? 'App: ' + payload.error : 'App accepted: ' + command.action);
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Supabase connection timed out.')), 15000);
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') { clearTimeout(timer); resolve(); }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timer); reject(new Error('Supabase connection: ' + status)); }
    });
  });
  console.log('\nSafety controls for ' + nodeId + '. Keep Expo Go open and bound to this device.');
  console.log('Shift+M: signal transmission failure | Shift+B: inactivity | Shift+V: fast countdown to 5 seconds | Shift+R: reset');
  console.log('Shift+W: toggle mesh walking | Shift+C: post next chat line | Shift+X: reset mesh nodes | Ctrl+C: quit');
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    clearInterval(walkTimer);
    for (const item of pending.values()) clearTimeout(item.timer);
    process.stdin.setRawMode(false);
    process.stdin.pause();
    await client.removeChannel(channel);
    process.exit(0);
  }
  process.on('SIGINT', close);
  process.stdin.on('keypress', async (text, keypress = {}) => {
    if (keypress.ctrl && keypress.name === 'c') { await close(); return; }
    if (keypress.ctrl || keypress.meta) return;
    if (text === 'W') { setWalking(!walking); return; }
    if (text === 'C') { void postNextChatLine(); return; }
    if (text === 'X') { void resetMesh(); return; }
    const action = { M: 'range', B: 'inactivity', V: 'expire', R: 'reset' }[text];
    if (!action) return;
    if (pending.size) { console.log('Waiting for the app to acknowledge the previous command…'); return; }
    const id = randomUUID();
    const timer = setTimeout(() => {
      pending.delete(id);
      console.log('No app acknowledged this command. Check the node ID, keep Expo Go in the foreground, and open Map > Safety to check keyboard connection status.');
    }, 8000);
    pending.set(id, { action, timer });
    try {
      const status = await channel.send({ type: 'broadcast', event: 'command', payload: { id, action, at: Date.now() } });
      if (status !== 'ok') throw new Error('Send failed: ' + status);
    } catch (error) {
      clearTimeout(timer);
      pending.delete(id);
      console.error(error.message);
    }
  });
}
main().catch(error => { console.error(error.message); process.exit(1); });

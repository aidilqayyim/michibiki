import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useMesh } from './MeshProvider';
import { supabase } from '../supabaseClient';
import { createDemoEngine, idleSimulation } from './demoEngine';

const DemoContext = createContext({ simulation: idleSimulation, command: () => {}, message: '', enabled: false });
export const useDemo = () => useContext(DemoContext);

export default function DemoProvider({ children }) {
  const mesh = useMesh();
  const meshRef = useRef(mesh);
  meshRef.current = mesh;
  const engine = useRef(null);
  const commandRef = useRef(null);
  const seen = useRef(new Set());
  const [simulation, setSimulation] = useState(idleSimulation);
  const [message, setMessage] = useState('');
  const [remoteStatus, setRemoteStatus] = useState('Connect a device to enable keyboard controls.');
  useEffect(() => {
    const current = createDemoEngine({ getMesh: () => meshRef.current,
      publishEmergency: args => meshRef.current.sendDemoEmergency(args), onChange: setSimulation, makeId: randomUUID });
    engine.current = current;
    const timer = setInterval(current.tick, 50);
    const sub = AppState.addEventListener('change', status => { if (status === 'active') current.tick(); });
    return () => { clearInterval(timer); sub.remove(); current.dispose(); engine.current = null; };
  }, []);
  useEffect(() => { engine.current?.reset(); setMessage(''); }, [mesh.boundId]);
  function command(action) {
    const current = engine.current;
    if (!current) return 'Monitoring is not ready.';
    let error;
    if (action === 'range' || action === 'inactivity') error = current.start(action);
    else if (action === 'expire') error = current.expire();
    else if (action === 'acknowledge') current.acknowledge();
    else if (action === 'help') current.requestHelp();
    else if (action === 'reset') current.reset();
    else if (action === 'retry') current.retry();
    else error = 'Unknown monitoring command.';
    setMessage(error || '');
    return error;
  }
  commandRef.current = command;
  useEffect(() => {
    if (!supabase || !mesh.boundId) return;
    setRemoteStatus('Connecting keyboard controls…');
    const channel = supabase.channel('michibiki-demo:' + mesh.boundId, { config: { broadcast: { ack: true } } });
    channel.on('broadcast', { event: 'command' }, ({ payload }) => {
      if (!payload || typeof payload.id !== 'string' || !['range', 'inactivity', 'expire', 'reset'].includes(payload.action)
        || !Number.isFinite(payload.at) || Math.abs(Date.now() - payload.at) > 15000 || seen.current.has(payload.id)) return;
      seen.current.add(payload.id);
      if (seen.current.size > 100) seen.current.delete(seen.current.values().next().value);
      const error = commandRef.current(payload.action);
      channel.send({ type: 'broadcast', event: 'result', payload: { id: payload.id, error: error || null } }).catch(() => {});
    }).subscribe(status => setRemoteStatus(status === 'SUBSCRIBED'
      ? 'Keyboard controls ready for ' + mesh.boundId
      : 'Keyboard connection: ' + status.toLowerCase().replaceAll('_', ' ')));
    return () => { supabase.removeChannel(channel); };
  }, [mesh.boundId]);
  return <DemoContext.Provider value={{ simulation, command, message, remoteStatus, enabled: true }}>{children}</DemoContext.Provider>;
}

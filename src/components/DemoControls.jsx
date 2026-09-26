import React, { useState } from 'react';
import { View, Modal, Pressable, StyleSheet } from 'react-native';
import { useDemo } from '../data/DemoProvider';
import { useMesh } from '../data/MeshProvider';
import { Button, colors, Text } from '../ui';

export default function DemoControls({ top, onStart }) {
  const { simulation, command, message, remoteStatus, enabled } = useDemo();
  const { boundId } = useMesh();
  const [open, setOpen] = useState(false);
  if (!enabled) return null;
  const active = !['idle', 'safe', 'sent'].includes(simulation.phase);
  function start(kind) { if (!command(kind)) { setOpen(false); onStart?.(); } }
  const description = simulation.phase === 'scheduled' ? 'Monitoring starts in 3 seconds…'
    : simulation.phase === 'retrying' ? simulation.nodeId + ' · Retrying... x' + simulation.attempt
    : simulation.phase === 'sending' ? 'Publishing emergency…'
    : simulation.phase === 'sent' ? 'Emergency published to mesh'
    : simulation.phase === 'safe' ? 'You confirmed you are okay'
    : simulation.phase === 'error' ? 'Emergency failed — tap Safety to retry'
    : simulation.phase === 'checking' ? 'Inactivity check in progress' : '';
  return <>
    <View pointerEvents="box-none" style={[styles.position, { top }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Safety controls" onPress={() => setOpen(true)} style={styles.trigger}><Text style={styles.triggerText}>Safety</Text></Pressable>
      {!!description && <Pressable accessibilityRole="button" accessibilityLabel="Monitoring status" onPress={() => setOpen(true)} style={styles.status}><Text style={styles.statusText}>{description}</Text></Pressable>}
    </View>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={styles.overlay}><View style={styles.card}>
      <Text style={styles.title}>Safety controls</Text>
      <Text style={styles.body}>Target: {boundId || 'connect a device first'}. Alerts are published to the shared emergency feed.</Text>
      <Button title="Signal transmission failure (Shift+M)" disabled={!boundId || active} onPress={() => start('range')} />
      <Button title="Inactivity check (Shift+B)" disabled={!boundId || active} onPress={() => start('inactivity')} />
      {simulation.phase === 'error' && <Button title="Retry emergency" onPress={() => command('retry')} />}
      {simulation.phase !== 'idle' && <Button title="Reset monitoring" disabled={simulation.phase === 'sending'} onPress={() => command('reset')} />}
      {!!message && <Text accessibilityRole="alert" style={styles.error}>{message}</Text>}
      {!!simulation.error && <Text style={styles.error}>{simulation.error}</Text>}
      <Text style={styles.small}>{remoteStatus}</Text>
      <Text style={styles.small}>Use a separate terminal: npm run controls -- --node {boundId || 'YOUR_NODE_ID'}. Reset clears the animation; published warnings remain in Warning Logs.</Text>
      <Button title="Close" onPress={() => setOpen(false)} />
    </View></View></Modal>
  </>;
}
const styles = StyleSheet.create({
  position: { position: 'absolute', right: 16, maxWidth: 240, alignItems: 'flex-end', gap: 8 },
  trigger: { backgroundColor: '#fffffff2', borderRadius: 22, paddingHorizontal: 18, minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  triggerText: { color: colors.amber, fontWeight: '700', fontSize: 13 },
  status: { backgroundColor: colors.redSoft, borderRadius: 12, padding: 10 },
  statusText: { fontSize: 12, color: colors.red, lineHeight: 18 },
  overlay: { flex: 1, backgroundColor: '#2b211866', justifyContent: 'center', padding: 24 },
  card: { padding: 24, borderRadius: 24, backgroundColor: colors.card, gap: 12, maxWidth: 480, width: '100%', alignSelf: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  body: { fontSize: 14, lineHeight: 20, color: colors.muted },
  small: { fontSize: 12, lineHeight: 18, color: colors.faint },
  error: { color: colors.red, fontSize: 13 },
});

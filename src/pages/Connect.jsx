import React, { useState } from 'react';
import { View, Pressable, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMesh } from '../data/MeshProvider';
import { Screen, Icon, s, colors, Text } from '../ui';
import { ROLES } from '../utils/display';

const coordinates = node => node.lat == null || node.lng == null
  ? 'Location unavailable'
  : Number(node.lat).toFixed(6) + ', ' + Number(node.lng).toFixed(6);

export default function Connect() {
  const { nodes, boundId, inUseIds = [], bindDevice, busy } = useMesh();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Relays and base stations are infrastructure, not something a phone binds to.
  const devices = nodes.filter(node => node.role !== 'Relay' && node.role !== 'Base Station');
  const [selectedId, setSelectedId] = useState(null);
  const [role, setRole] = useState('Hiker');
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState(false);
  const boundDevice = nodes.find(device => device.id === boundId);
  const selectedDevice = devices.find(device => device.id === selectedId && device.id !== boundId && !inUseIds.includes(device.id));

  async function updateBinding(id) {
    setNotice('');
    setFailed(false);
    try {
      await bindDevice(id, id ? role : undefined);
      setSelectedId(null);
      setNotice(id ? 'Device ' + id + ' bound to this user.' : 'Device disconnected.');
    } catch (error) {
      setFailed(true);
      setNotice(error.message);
    }
  }

  return (
    <View style={styles.flex}>
    <Screen title="Connect" right={<View style={styles.badge}><Text style={styles.badgeText}>Mesh connection</Text></View>}>
      <Text style={styles.intro}>Bind your phone to a Michibiki device to join its LoRa mesh.</Text>
      <View style={styles.current}>
        <View style={styles.row}>
          <View style={styles.bluetooth}><Icon name="bluetooth" size={26} color={colors.blue} /></View>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>YOUR DEVICE</Text>
            <Text style={styles.currentTitle}>{boundDevice ? boundDevice.name : 'Ready to connect'}</Text>
            {!boundDevice && <Text style={styles.description}>Choose a nearby Bluetooth device below</Text>}
          </View>
        </View>
        {boundDevice && (
          <View style={styles.boundFooter}>
            <View style={styles.flex}>
              <Text style={styles.bound}>● Bound · {boundDevice.battery ?? '—'}% battery</Text>
              <Text style={styles.coordinates}>{coordinates(boundDevice)}</Text>
            </View>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => updateBinding(null)}
              style={({ pressed }) => [styles.disconnect, (pressed || busy) && styles.dim]}>
              <Text style={styles.white}>Disconnect</Text>
            </Pressable>
          </View>
        )}
      </View>
      <View style={styles.listHeading}>
        <Text style={styles.sectionTitle}>Nearby Bluetooth devices</Text>
        <Text style={styles.count}>{devices.length} {devices.length === 1 ? 'device' : 'devices'}</Text>
      </View>
      <View style={styles.grid}>
        {devices.map(device => {
          const isBound = boundId === device.id;
          const inUse = !isBound && inUseIds.includes(device.id);
          const isSelected = selectedId === device.id && !isBound && !inUse;
          const state = isBound ? 'Bound' : inUse ? 'In Use' : isSelected ? 'Selected' : 'Select';
          return (
            <Pressable key={device.id} accessibilityRole="button"
              accessibilityLabel={device.name + ', ' + state}
              accessibilityState={{ selected: isSelected, disabled: isBound || inUse || busy }}
              disabled={isBound || inUse || busy}
              onPress={() => { setSelectedId(device.id); setRole(ROLES.includes(device.role) ? device.role : 'Hiker'); setNotice(''); }}
              style={({ pressed }) => [styles.device, { width: width >= 768 ? '48.5%' : '100%' },
                isSelected && styles.selected, isBound && { opacity: 0.8 }, inUse && styles.inUse, pressed && styles.dim]}>
              <View style={[styles.avatar, { backgroundColor: device.color || '#4ade80' }]}>
                <Text style={styles.deviceId}>{device.id}</Text>
              </View>
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <Text style={[styles.deviceName, styles.shrink]} numberOfLines={1}>{device.name}</Text>
                  <Text style={[styles.pill, isBound || inUse ? styles.pillBound : styles.pillFree]}>{isBound || inUse ? 'Bound' : 'Free to bind'}</Text>
                </View>
                <Text style={styles.deviceInfo}>{device.role || 'Hiker'} · {device.signal} signal · {device.battery ?? '—'}% battery</Text>
              </View>
              <Text style={[styles.selection, isBound && { color: colors.green }, inUse && { color: colors.faint }]}>{state}</Text>
            </Pressable>
          );
        })}
      </View>
      {!devices.length && <Text style={styles.description}>No devices available.</Text>}
      {!!notice && <Text accessibilityRole={failed ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.notice, failed && { color: colors.red }]}>{notice}</Text>}
      <Text style={styles.demoNote}>Device binding is saved in Supabase. No hardware connection is made. The Nodes tab shows all detected LoRa devices, including relays outside Bluetooth range.</Text>
      {selectedDevice && <View style={{ height: 230 }} />}
    </Screen>
    {selectedDevice && (
      <View style={[styles.confirmation, { bottom: Math.max(insets.bottom, 30) + 84 }]}>
        <Text style={styles.deviceName}>Bind {selectedDevice.name}?</Text>
        <Text style={styles.explanation}>{boundDevice ? 'This will replace your binding to ' + boundDevice.name + '.' : "This device will be your phone's connection to the mesh."} {coordinates(selectedDevice)}</Text>
        <Text style={[styles.locationLabel, { marginTop: 12 }]}>ROLE</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Device role" accessibilityValue={{ text: role }}
          disabled={busy} onPress={() => setRolePickerOpen(true)}
          style={({ pressed }) => [styles.dropdown, (pressed || busy) && styles.dim]}>
          <Text style={[styles.white, styles.flex]}>{role}</Text>
          <Icon name="chevron-down" size={18} color={colors.muted} />
        </Pressable>
        <View style={[styles.row, { marginTop: 14 }]}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => updateBinding(selectedDevice.id)}
            style={({ pressed }) => [styles.bind, (pressed || busy) && styles.dim]}>
            <Text style={styles.bindText}>{busy ? 'Saving...' : 'Bind device'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => setSelectedId(null)}
            style={({ pressed }) => [styles.cancel, (pressed || busy) && styles.dim]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    )}
    <Modal visible={rolePickerOpen} transparent animationType="fade" onRequestClose={() => setRolePickerOpen(false)}>
      <Pressable style={s.overlay} onPress={() => setRolePickerOpen(false)}>
        <Pressable style={s.modal} onPress={() => {}}>
          <Text style={styles.currentTitle}>Set role</Text>
          {ROLES.map(option => (
            <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: option === role }}
              onPress={() => { setRole(option); setRolePickerOpen(false); }}
              style={({ pressed }) => [styles.roleOption, (pressed || option === role) && styles.selected]}>
              <Text style={[styles.white, styles.flex]}>{option}</Text>
              {option === role && <Icon name="check" size={18} color={colors.blue} />}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  badge: { backgroundColor: colors.blueSoft, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: colors.blue, fontSize: 12, fontWeight: '600' },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 24, maxWidth: 512 },
  current: { marginTop: 20, borderRadius: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 20 },
  bluetooth: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#b9cdf5', backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.faint, fontSize: 12, letterSpacing: 1.2 },
  currentTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 4 },
  description: { color: colors.muted, fontSize: 14, marginTop: 4, lineHeight: 20 },
  boundFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.border, paddingTop: 16, marginTop: 20 },
  bound: { color: colors.green, fontSize: 14 }, coordinates: { color: colors.faint, fontSize: 12, marginTop: 4 },
  disconnect: { borderRadius: 24, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  white: { color: colors.text, fontSize: 14 }, dim: { opacity: 0.5 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12, gap: 8 },
  sectionTitle: { color: colors.muted, fontSize: 14, fontWeight: '600' }, count: { color: colors.faint, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  device: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  selected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  deviceId: { fontSize: 14, fontWeight: '900', color: '#000' },
  deviceName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  deviceInfo: { marginTop: 4, fontSize: 12, color: colors.muted, lineHeight: 18 },
  selection: { fontSize: 12, color: colors.blue, fontWeight: '600' },
  confirmation: { position: 'absolute', left: 12, right: 12, maxWidth: 620, alignSelf: 'center', borderRadius: 24, borderWidth: 1, borderColor: '#b9cdf5', backgroundColor: colors.card, padding: 18, elevation: 12, shadowColor: '#2b2118', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  inUse: { opacity: 0.45 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  shrink: { flexShrink: 1 },
  pill: { fontSize: 11, fontWeight: '700', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  pillFree: { color: colors.green, backgroundColor: colors.greenSoft },
  pillBound: { color: colors.amber, backgroundColor: colors.amberSoft },
  dropdown: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardAlt, paddingHorizontal: 14 },
  roleOption: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 14 },
  explanation: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  locationLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: colors.faint },
  bind: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.blue, minHeight: 44 },
  bindText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancel: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, minHeight: 44 },
  cancelText: { color: colors.muted, fontSize: 14 },
  notice: { marginTop: 16, fontSize: 14, color: colors.blue },
  demoNote: { marginTop: 24, fontSize: 12, lineHeight: 20, color: colors.faint },
});

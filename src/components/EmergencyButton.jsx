import React, { useState } from 'react';
import { Modal, View, Pressable } from 'react-native';
import { useMesh } from '../data/MeshProvider';
import { Button, Note, Icon, s, colors, Text } from '../ui';
export default function EmergencyButton({ compact = false, onOpen, style }) {
  const {
    sendEmergency,
    boundId
  } = useMesh();
  // Warnings are raised from a device, so one must be bound first.
  const disabled = !boundId;
  const hint = disabled ? 'Bind a device in Connect to send an emergency warning' : undefined;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  async function send() {
    setBusy(true);
    setError('');
    try {
      await sendEmergency();
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const show = () => {
      onOpen?.();
      setSaved(false);
      setError('');
      setOpen(true);
  };
  return <>{compact ? <Pressable accessibilityRole="button" accessibilityLabel="Emergency" accessibilityHint={hint} accessibilityState={{ disabled }} disabled={disabled} onPress={show} style={({ pressed }) => [style, pressed && { opacity: 0.6 }, disabled && { opacity: 0.35 }]}><Icon name="warning" size={23} color={colors.red} /></Pressable> : <Button title="Emergency" icon="warning" danger disabled={disabled} onPress={show} />}<Modal visible={open} transparent animationType="fade" onRequestClose={() => !busy && setOpen(false)}><View style={s.overlay}><View style={s.modal}><Text style={[s.text, {
            fontSize: 23,
            fontWeight: '800'
          }]}>{saved ? 'Emergency published' : 'Send emergency warning?'}</Text><Text style={s.muted}>{saved ? 'Your emergency has been published to the shared mesh alert feed.' : 'Use this only for a serious emergency. This will publish your warning to the shared mesh alert feed.'}</Text><Note error>{error}</Note>{!saved && <Button title={busy ? 'Sending…' : 'Send Emergency'} danger disabled={busy} onPress={send} />}<Button title={saved ? 'Close' : 'Cancel'} disabled={busy} onPress={() => setOpen(false)} /></View></View></Modal></>;
}

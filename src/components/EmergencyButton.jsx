import React, { useState } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { useMesh } from '../data/MeshProvider';
import { Button, Note, Icon, s } from '../ui';
export default function EmergencyButton({ compact = false, onOpen, style }) {
  const {
    sendEmergency
  } = useMesh();
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
  return <>{compact ? <Pressable accessibilityRole="button" accessibilityLabel="Emergency" onPress={show} style={({ pressed }) => [style, pressed && { opacity: 0.6 }]}><Icon name="warning" size={23} color="#fb7185" /></Pressable> : <Button title="Emergency" icon="warning" danger onPress={show} />}<Modal visible={open} transparent animationType="fade" onRequestClose={() => !busy && setOpen(false)}><View style={s.overlay}><View style={s.modal}><Text style={[s.text, {
            fontSize: 23,
            fontWeight: '800'
          }]}>{saved ? 'Demo warning saved' : 'Send emergency warning?'}</Text><Text style={s.muted}>{saved ? 'Other users have been alerted. Responses will be sent to you shortly.' : 'Use this only for a serious emergency. Other devices will be alert and help will be sent to you promptly.'}</Text><Note error>{error}</Note>{!saved && <Button title={busy ? 'Sending…' : 'Send Emergency'} danger disabled={busy} onPress={send} />}<Button title={saved ? 'Close' : 'Cancel'} disabled={busy} onPress={() => setOpen(false)} /></View></View></Modal></>;
}

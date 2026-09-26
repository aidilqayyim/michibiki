import React, { useEffect } from 'react';
import { Modal, View, Text, Vibration, StyleSheet } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useMesh } from '../data/MeshProvider';
import { Button, Icon } from '../ui';

const siren = require('../../assets/siren.wav');

// Shown on every other phone when a device raises an emergency. Takes over the screen,
// plays the siren even in silent mode and stops other audio until dismissed.
export default function EmergencyAlert({ onShowOnMap }) {
  const { incomingAlerts, dismissAlert, nodes } = useMesh();
  const player = useAudioPlayer(siren);
  const alert = incomingAlerts[0];
  const node = alert && nodes.find(item => item.id === alert.node_id);

  useEffect(() => {
    if (!alert) return;
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' }).catch(() => {});
    player.loop = true;
    player.volume = 1;
    player.seekTo(0);
    player.play();
    Vibration.vibrate([0, 900, 500], true);
    return () => {
      player.pause();
      Vibration.cancel();
    };
  }, [alert?.id, player]);

  if (!alert) return null;
  const hasLocation = alert.lat != null && alert.lng != null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen" onRequestClose={() => {}}>
      <View accessibilityViewIsModal style={styles.screen}>
        <View style={styles.card}>
          <View style={styles.icon}><Icon name="warning" size={44} color="#fff" /></View>
          <Text accessibilityRole="alert" style={styles.title}>EMERGENCY</Text>
          <Text style={styles.who}>{node?.name || alert.node_id || 'A Michibiki user'} needs help</Text>
          <Text style={styles.body}>{alert.message}</Text>
          <Text style={styles.meta}>
            {new Date(alert.created_at).toLocaleTimeString()}
            {hasLocation ? ' · ' + Number(alert.lat).toFixed(5) + ', ' + Number(alert.lng).toFixed(5) : ' · Location unknown'}
          </Text>
          {incomingAlerts.length > 1 && <Text style={styles.meta}>{incomingAlerts.length - 1} more alert{incomingAlerts.length > 2 ? 's' : ''} waiting</Text>}
          {!!alert.node_id && (
            <Button title="Show on map" icon="location" danger style={styles.primary} onPress={() => {
              dismissAlert(alert.id);
              onShowOnMap(alert.node_id);
            }} />
          )}
          <Button title="Dismiss" style={styles.secondary} onPress={() => dismissAlert(alert.id)} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#7f1d1df2', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 28, backgroundColor: '#1c0a0c', borderWidth: 2, borderColor: '#ef4444', padding: 24, gap: 12, alignItems: 'stretch' },
  icon: { alignSelf: 'center', width: 84, height: 84, borderRadius: 42, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fecaca', fontSize: 30, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  who: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  body: { color: '#fecaca', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  meta: { color: '#fca5a5', fontSize: 13, textAlign: 'center' },
  primary: { marginTop: 8 },
  secondary: { backgroundColor: '#ffffff1a' },
});

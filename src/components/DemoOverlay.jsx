import React, { useState } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemo } from '../data/DemoProvider';
import { Button, Icon, colors, Text } from '../ui';

export default function DemoOverlay() {
  const { simulation, command } = useDemo();
  const insets = useSafeAreaInsets();
  const [confirmedId, setConfirmedId] = useState(null);
  const [dismissedId, setDismissedId] = useState(null);
  const id = simulation.emergencyId || simulation.nodeId + '-' + simulation.startsAt;
  const checking = simulation.kind === 'inactivity' && simulation.phase === 'checking';
  const sent = simulation.phase === 'sent';
  const pending = ['sending', 'error'].includes(simulation.phase);
  const seconds = simulation.remaining || 0;
  const time = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');

  if (sent && confirmedId === id) {
    if (dismissedId === id) return null;
    return (
      <View accessibilityLiveRegion="polite" style={[styles.notice, { bottom: Math.max(insets.bottom, 12) + 84 }]}>
        <Icon name="radio" color={colors.green} size={24} />
        <View style={{ flex: 1 }}>
          <Text style={styles.noticeTitle}>Emergency signal broadcast</Text>
          <Text style={styles.noticeBody}>Your alert has been published to the mesh feed. Rangers, the base station, or nearby users may contact you.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss broadcast notice" hitSlop={10} onPress={() => setDismissedId(id)}>
          <Icon name="close" size={20} color={colors.muted} />
        </Pressable>
      </View>
    );
  }
  if (!checking && !sent && !pending) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={styles.card}>
        <Text style={styles.eyebrow}>{simulation.kind === 'inactivity' ? 'INACTIVITY ALERT' : 'SIGNAL ALERT'} · {simulation.nodeId}</Text>
        <Icon name={sent ? 'radio' : 'warning'} color={sent ? colors.green : colors.amber} size={40} />
        <Text style={styles.title}>{checking ? 'Are you okay?' : sent ? 'Emergency signal broadcast' : simulation.phase === 'error' ? 'Emergency could not be sent' : 'Sending emergency…'}</Text>
        {checking ? <>
          <Text style={styles.body}>Please respond to the check-in. Your response will be shared with the mesh.</Text>
          <Text accessibilityLabel={'Time remaining ' + time} style={styles.timer}>{time}</Text>
          <Button title="I'm okay" onPress={() => command('acknowledge')} />
          <Button title="I need help" danger onPress={() => command('help')} />
        </> : <>
          <Text style={styles.body}>{simulation.phase === 'error' ? simulation.error : sent
            ? 'Your emergency signal has been published to the mesh alert feed for all nodes, including the base station.'
            : 'Publishing your emergency signal to the mesh alert feed.'}</Text>
          {simulation.phase === 'error' && <><Button title="Retry emergency" onPress={() => command('retry')} /><Button title="Close" onPress={() => command('reset')} /></>}
          {sent && <Button title="Continue" onPress={() => setConfirmedId(id)} />}
        </>}
      </View></View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#2b211880', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.card, padding: 24, borderRadius: 28, gap: 16, maxWidth: 480, width: '100%', alignSelf: 'center' },
  eyebrow: { fontSize: 11, color: colors.amber, letterSpacing: 1.5, fontWeight: '700' },
  title: { fontSize: 26, color: colors.text, fontWeight: '800' },
  body: { fontSize: 15, lineHeight: 22, color: colors.muted },
  timer: { fontSize: 48, fontVariant: ['tabular-nums'], fontWeight: '800', color: colors.amber, textAlign: 'center' },
  notice: { position: 'absolute', left: 16, right: 16, maxWidth: 600, alignSelf: 'center', borderRadius: 20, padding: 16, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: '#a7d9b5', flexDirection: 'row', alignItems: 'center', gap: 12 },
  noticeTitle: { color: colors.green, fontSize: 15, fontWeight: '700' },
  noticeBody: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 5 },
});

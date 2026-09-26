import React from 'react';
import { Modal, View, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, colors, Text } from '../ui';

function when(timestamp) {
  const date = new Date(timestamp);
  return date.toDateString() === new Date().toDateString()
    ? 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Emergency alerts raised by any device, newest first. Tapping one shows that device on the map.
export default function WarningLogs({ visible, onClose, alerts, nodes, boundId, userId, onSelect }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Dismiss warning logs" accessibilityRole="button" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: '#2b21181f' }]} />
      <View style={[styles.panel, {
        bottom: Math.max(insets.bottom, 12) + 86,
        maxHeight: Math.min(height * 0.6, height - insets.top - insets.bottom - 115),
      }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Warning Logs</Text>
            <Text style={styles.subtitle}>{alerts.length} emergency {alerts.length === 1 ? 'alert' : 'alerts'}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close warning logs" onPress={onClose} style={styles.close}>
            <Icon name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {alerts.map(alert => {
            const node = nodes.find(item => item.id === alert.node_id);
            const mine = alert.node_id ? alert.node_id === boundId : alert.user_id === userId;
            const active = alert.status === 'active';
            return (
              <Pressable
                key={alert.id}
                accessibilityRole="button"
                accessibilityLabel={'Warning from ' + (node?.name || 'unknown device') + ', ' + when(alert.created_at)}
                disabled={!node}
                onPress={() => onSelect(node)}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.cardAlt }]}
              >
                <View style={[styles.badge, { backgroundColor: active ? colors.redSoft : colors.cardAlt }]}>
                  <Icon name="warning" size={18} color={active ? colors.red : colors.faint} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={styles.name}>{node?.name || alert.node_id || 'Unknown device'}</Text>
                    {mine && <Text style={styles.you}>YOU</Text>}
                  </View>
                  <Text style={styles.meta}>{when(alert.created_at)} · {alert.status}</Text>
                  <Text numberOfLines={2} style={styles.message}>{alert.message?.replace(/^\[DEMO\]\s*/i, '')}</Text>
                </View>
                {!!node && <Icon name="chevron" size={16} color={colors.faint} />}
              </Pressable>
            );
          })}
          {!alerts.length && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No warnings yet</Text>
              <Text style={styles.subtitle}>Emergency alerts from any device appear here.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', left: 12, right: 12, maxWidth: 420, borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', elevation: 12, shadowColor: '#2b2118', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 8, paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16 },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  you: { color: colors.purple, backgroundColor: colors.purpleSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, fontSize: 9, fontWeight: '700', overflow: 'hidden' },
  meta: { color: colors.muted, fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  message: { color: colors.text, fontSize: 12, marginTop: 3, lineHeight: 17 },
  empty: { padding: 24, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
});

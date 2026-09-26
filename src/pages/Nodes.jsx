import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useMesh } from '../data/MeshProvider';
import { Screen, Icon, colors, Text, TextInput } from '../ui';
import { distanceBetweenNodes, formatDistance } from '../utils/mapHelpers';
import { lastSeenLabel, signalInfo } from '../utils/display';
import { useWeather } from '../data/weather';

function hasLocation(node) {
  return node && node.lat != null && node.lng != null
    && Number.isFinite(Number(node.lat)) && Number.isFinite(Number(node.lng));
}

function Detail({ icon, color = colors.faint, children }) {
  return (
    <View style={styles.detailRow}>
      <Icon name={icon} size={14} color={color} />
      <Text style={styles.detailText}>{children}</Text>
    </View>
  );
}

function SignalBar({ signal }) {
  const { level, color, label } = signalInfo(signal);
  return (
    <View style={styles.signalRow}>
      <Text style={styles.signalLabel}>Signal {label}</Text>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={'Signal ' + label}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(level * 100) }}
        style={styles.signalTrack}
      >
        {level > 0 && <View style={{ width: level * 100 + '%', height: 8, borderRadius: 4, backgroundColor: color }} />}
      </View>
      <View style={[styles.signalDot, { backgroundColor: color }]} />
    </View>
  );
}

export default function Nodes({ navigation }) {
  const { nodes, boundId, refresh } = useMesh();
  const connected = nodes.find(node => node.id === boundId);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const weather = useWeather(nodes);

  async function refreshNodes() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }
  const filteredNodes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return nodes.filter(node => (node.name + ' ' + node.role + ' ' + node.id).toLowerCase().includes(normalized));
  }, [nodes, query]);

  return (
    <Screen
      title={'Nodes (' + filteredNodes.length + ')'}
      centeredTitle
      right={<View style={styles.countBadge}><Text style={styles.countText}>Nodes: {nodes.length}</Text></View>}
    >
      <Text style={styles.subtitle}>Nearby devices detected on the LoRa mesh</Text>
      <View style={styles.toolbar}>
        <View style={styles.search}>
          <Icon name="search" size={20} color={colors.muted} />
          <TextInput
            accessibilityLabel="Find a node"
            placeholder="Find a node"
            placeholderTextColor={colors.faint}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            style={styles.searchInput}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh nodes"
          accessibilityState={{ busy: refreshing, disabled: refreshing }}
          disabled={refreshing}
          onPress={refreshNodes}
          style={({ pressed }) => [styles.refreshButton, pressed && { backgroundColor: colors.cardAlt }]}
        >
          {refreshing ? <ActivityIndicator color={colors.blue} /> : <Icon name="refresh" size={20} color={colors.blue} />}
        </Pressable>
      </View>
      <View style={styles.list}>
        {filteredNodes.map((node, index) => (
          <View key={node.id} style={[styles.nodeRow, index > 0 && styles.separator]}>
            <View style={styles.avatarColumn}>
              <View style={[styles.avatar, { backgroundColor: node.color || '#4ade80' }]}>
                <Text style={styles.nodeId}>{node.id}</Text>
              </View>
              <View style={styles.battery}>
                <Icon name="battery" size={12} color={colors.muted} />
                <Text style={styles.batteryText}>{node.battery ?? '—'}%</Text>
              </View>
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Icon name={node.locked ? 'lock' : 'unlock'} size={14} color={node.locked ? colors.green : colors.amber} />
                <Text numberOfLines={1} style={styles.name}>{node.name}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={'Logs for ' + node.id}
                  accessibilityHint={'View ' + node.name + ' tracking logs'}
                  onPress={() => navigation.navigate('Logs', { nodeId: node.id })}
                  style={({ pressed }) => [styles.logsButton, pressed && { backgroundColor: colors.blueSoft }]}
                >
                  <Icon name="logs" size={20} color={colors.blue} />
                </Pressable>
              </View>
              <Detail icon="clock">{lastSeenLabel(node.last_seen)}</Detail>
              {hasLocation(node) && (
                <Detail icon={weather[node.id]?.icon || 'cloud'} color={weather[node.id]?.color}>
                  {weather[node.id]
                    ? weather[node.id].label + ' · ' + weather[node.id].temperature + '°C · wind ' + weather[node.id].wind + ' km/h'
                    : node.id in weather ? 'Weather unavailable' : 'Loading weather…'}
                </Detail>
              )}
              <Detail icon="smartphone">Role: {node.role}</Detail>
              <Detail icon="signal">
                {hasLocation(connected) && hasLocation(node)
                  ? formatDistance(distanceBetweenNodes(connected, node)) + ' away'
                  : 'Distance unavailable'} · {node.hops ?? 0} {(node.hops ?? 0) === 1 ? 'hop' : 'hops'}
              </Detail>
              <SignalBar signal={node.signal} />
            </View>
          </View>
        ))}
      </View>
      {!filteredNodes.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No nodes found</Text>
          <Text style={styles.emptyHint}>Try searching using a node name, ID, or role.</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  countBadge: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 8 },
  countText: { color: colors.muted, fontSize: 12 },
  subtitle: { marginTop: 12, textAlign: 'center', color: colors.muted, fontSize: 14 },
  toolbar: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  refreshButton: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: { flex: 1, minHeight: 30, paddingVertical: 4, fontSize: 16, color: colors.text },
  list: { marginTop: 16 },
  nodeRow: { flexDirection: 'row', gap: 16, paddingVertical: 16 },
  separator: { borderTopWidth: 1, borderTopColor: colors.border },
  avatarColumn: { alignItems: 'center' },
  avatar: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center' },
  nodeId: { color: '#000', fontSize: 18, fontWeight: '800' },
  battery: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  batteryText: { color: colors.muted, fontSize: 12 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '700' },
  logsButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  detailRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.muted },
  signalRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  signalLabel: { color: colors.muted, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  signalTrack: { height: 8, flex: 1, minWidth: 24, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e4d8c3' },
  signalDot: { width: 10, height: 10, borderRadius: 5 },
  empty: { marginTop: 64, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyHint: { marginTop: 8, fontSize: 14, color: colors.muted, textAlign: 'center' },
});

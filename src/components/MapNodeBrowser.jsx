import React, { useState } from 'react';
import { Modal, View, Pressable, ScrollView, StyleSheet, useWindowDimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, colors, Text, TextInput } from '../ui';

export default function MapNodeBrowser({ visible, onClose, nodes, boundId, onSelect }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tablet = width >= 768;
  const query = search.trim().toLowerCase();
  const results = nodes.filter(node => {
    const matchesQuery = [node.id, node.name, node.role].some(value => String(value || '').toLowerCase().includes(query));
    return matchesQuery && (filter === 'all' || node.role === { hikers: 'Hiker', relays: 'Relay', bases: 'Base Station' }[filter]);
  });
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable accessibilityLabel="Dismiss node browser" accessibilityRole="button" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: '#2b21181f' }]} />
        <View style={[styles.panel, {
          bottom: Math.max(insets.bottom, 12) + (tablet ? 94 : 86),
          left: tablet ? undefined : 12, right: tablet ? 80 : 12,
          width: tablet ? 350 : undefined,
          height: Math.min(height * (tablet ? 0.65 : 0.58), height - insets.top - insets.bottom - 115, 620),
        }]}>
          {!tablet && <View style={styles.handle} />}
          <View style={styles.header}>
            <View><Text style={styles.title}>Map Nodes</Text><Text style={styles.subtitle}>{nodes.length} nodes detected</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close node browser" onPress={onClose} style={styles.close}><Icon name="close" size={20} color={colors.muted} /></Pressable>
          </View>
          <View style={styles.search}>
            <Icon name="search" size={16} color={colors.muted} />
            <TextInput accessibilityLabel="Search map nodes" placeholder="Search nodes..." placeholderTextColor={colors.faint} value={search} onChangeText={setSearch} style={styles.input} />
            {!!search && <Pressable accessibilityLabel="Clear search" accessibilityRole="button" hitSlop={10} onPress={() => setSearch('')}><Icon name="close" size={18} color={colors.muted} /></Pressable>}
          </View>
          <View style={styles.filters}>
            {[['all', 'All'], ['hikers', 'Hikers'], ['relays', 'Relays'], ['bases', 'Bases']].map(([id, label]) => (
              <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: filter === id }} onPress={() => setFilter(id)} style={[styles.filter, filter === id && { backgroundColor: colors.text }]}>
                <Text style={[styles.filterText, filter === id && { color: '#fff' }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.legend}>
            <Text style={styles.eyebrow}>LEGEND</Text>
            <View style={styles.legendItems}>{[[colors.purple, 'Your device'], ['#4ade80', 'Hiker'], ['#fbbf24', 'Relay']].map(([color, label]) => (
              <View key={label} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>
            ))}</View>
          </View>
          <View style={styles.resultHeader}><Text style={styles.eyebrow}>NODES</Text><Text style={styles.eyebrow}>{results.length} results</Text></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.results}>
            {results.map(node => (
              <Pressable key={node.id} accessibilityRole="button" accessibilityLabel={'Show ' + node.name + ' on map'} onPress={() => onSelect(node)} style={({ pressed }) => [styles.node, pressed && { backgroundColor: colors.cardAlt }]}>
                <View style={[styles.avatar, { backgroundColor: node.id === boundId ? colors.purple : node.color || '#4ade80' }]}><Text style={styles.nodeId}>{node.id === boundId ? '' : node.id}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}><Text numberOfLines={1} style={styles.name}>{node.name}</Text>{node.id === boundId && <Text style={styles.you}>YOU</Text>}</View>
                  <Text style={styles.meta}>{node.role} · {node.battery ?? '—'}% · {node.signal} · {node.hops ?? 0} {node.hops === 1 ? 'hop' : 'hops'}</Text>
                </View>
                <Icon name="chevron" size={16} color={colors.faint} />
              </Pressable>
            ))}
            {!results.length && <View style={styles.empty}><Text style={styles.emptyTitle}>No nodes found</Text><Text style={styles.subtitle}>Try another search or filter.</Text></View>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  panel: { position: 'absolute', borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', elevation: 12, shadowColor: '#2b2118', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  handle: { alignSelf: 'center', height: 4, width: 40, borderRadius: 2, backgroundColor: colors.border, marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  search: { marginHorizontal: 16, flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardAlt, borderRadius: 12 },
  input: { flex: 1, minHeight: 44, color: colors.text, fontSize: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingHorizontal: 16 },
  filter: { borderRadius: 20, backgroundColor: colors.cardAlt, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center' },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  legend: { marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: colors.cardAlt, borderRadius: 16 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: colors.faint },
  legendItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 }, legendText: { fontSize: 11, color: colors.muted },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 12, paddingBottom: 8 },
  results: { paddingHorizontal: 8, paddingBottom: 24 },
  node: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  nodeId: { fontSize: 11, fontWeight: '900', color: '#000' },
  nameRow: { flexDirection: 'row', gap: 8, alignItems: 'center' }, name: { flexShrink: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  you: { color: colors.purple, backgroundColor: colors.purpleSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, fontSize: 9, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 11, marginTop: 4, lineHeight: 17 },
  empty: { padding: 24, alignItems: 'center' }, emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
});

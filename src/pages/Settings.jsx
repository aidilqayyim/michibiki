import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useMesh } from '../data/MeshProvider';
import { Icon, Screen, colors, Text } from '../ui';

const settingsRows = [
  { title: 'About Michibiki', icon: 'info', action: 'about' },
  { title: 'Help & Documentation', icon: 'book', action: 'help' },
  { title: 'App Settings', icon: 'settings', action: 'preferences' },
  { title: 'Local Mesh Discovery', icon: 'radio', action: 'nodes' },
  { title: 'Routes', icon: 'map', action: 'routes' },
  { title: 'Route Recorder', icon: 'disc', action: 'recorder' },
  { title: 'Device Profiles', icon: 'smartphone', action: 'profiles' },
];

export default function Settings({ navigation }) {
  const { nodes, boundId, alerts, refresh } = useMesh();

  function openSetting(action) {
    switch (action) {
      case 'about':
        Alert.alert('About Michibiki', 'Guidance for your mesh. A companion for LoRa location tracking across forests and other environments.');
        break;
      case 'help':
        Alert.alert('Help & Documentation', 'Connect a device, then open Map. The arrow locates your bound device. Tracking logs show previously recorded positions. Messages and emergency alerts are saved to Supabase; radio delivery is not implemented.');
        break;
      case 'nodes':
        navigation.navigate('Nodes');
        break;
      case 'routes':
        navigation.navigate('Logs', { nodeId: 'all' });
        break;
      case 'preferences':
        Alert.alert('App Settings', 'The app currently uses a dark theme and metric distances. Theme, notification and unit controls are not available yet.');
        break;
      case 'recorder':
        Alert.alert('Route Recorder', 'Live route recording is not available yet. Open Routes to view tracking records stored in Supabase.');
        break;
      case 'profiles':
        Alert.alert('Device Profiles', 'Device roles come from Supabase. View each device in Nodes, or bind your device in Connect. Profile editing is not available yet.');
        break;
      default:
        break;
    }
  }

  return (
    <Screen title="Settings">
      <View style={styles.settingsCard}>
        {settingsRows.map((item, index) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            onPress={() => openSetting(item.action)}
            style={({ pressed }) => [
              styles.row,
              index < settingsRows.length - 1 && styles.separator,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.icon}>
              <Icon name={item.icon} size={20} color={colors.blue} />
            </View>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Icon name="chevron" size={20} color={colors.faint} />
          </Pressable>
        ))}
      </View>

      <View style={styles.dataCard}>
        <View style={styles.dataHeader}>
          <Text style={styles.dataTitle}>Mesh data</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh mesh data"
            onPress={refresh}
            hitSlop={12}
            style={({ pressed }) => pressed && styles.refreshPressed}
          >
            <Text style={styles.refresh}>Refresh</Text>
          </Pressable>
        </View>
        <Text style={[styles.dataText, styles.firstLine]}>
          {nodes.length} devices found on the mesh.
        </Text>
        <Text style={styles.dataText}>Bound device: {boundId || 'None'}</Text>
        <Text style={styles.dataText}>
          Your saved emergency alerts: {alerts.length}
        </Text>
        <Text style={styles.caption}>
          Refreshes every 15 seconds while the app is visible.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  settingsCard: {
    marginTop: 0,
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.cardAlt },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.14,
  },
  dataCard: {
    marginTop: 24,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  refresh: { color: colors.blue, fontSize: 14, fontWeight: '600' },
  refreshPressed: { opacity: 0.5 },
  dataText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  firstLine: { marginTop: 12 },
  caption: {
    color: colors.faint,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
});

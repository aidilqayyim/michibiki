import React from 'react';
import { View } from 'react-native';
import { useMesh } from '../data/MeshProvider';
import { getTrackingLogs, formatLogDate, formatLogTime } from '../data/trackingLogs';
import { Screen, Button, Note, s, colors, Text } from '../ui';
export default function Logs({
  route,
  navigation
}) {
  const {
    logs
  } = useMesh();
  const nodeId = route.params?.nodeId || 'all';
  const selected = getTrackingLogs(logs, nodeId);
  const dates = [...new Set(selected.map(l => l.date))].sort().reverse();
  return <Screen title="Tracking logs" right={<Button title="Back" icon="back" onPress={() => navigation.goBack()} />}><Note>{nodeId === 'all' ? 'All nodes' : nodeId} · Times in Japan (UTC+9)</Note>{dates.map(date => <View key={date} style={s.card}><Text style={[s.text, {
        fontWeight: '700'
      }]}>{formatLogDate(date)}</Text><Button title="Show on Map" icon="map" onPress={() => navigation.popTo('Main', {
        screen: 'Map',
        params: {
          historyDate: date,
          historyNode: nodeId
        }
      })} />{selected.filter(l => l.date === date).map(l => <View key={l.id} style={{
        borderTopWidth: 1,
        borderColor: colors.border,
        paddingTop: 12
      }}><Text style={s.text}>{l.nodeId} · {formatLogTime(l.timestamp)}</Text><Text style={s.muted}>Latitude {Number(l.lat).toFixed(6)} · Longitude {Number(l.lng).toFixed(6)}</Text><Text style={s.muted}>Signal strength {l.rssi} dBm</Text></View>)}</View>)}{!dates.length && <Note>No tracking records for this device.</Note>}</Screen>;
}

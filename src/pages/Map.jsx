import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, AccessibilityInfo, Pressable, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useMesh } from '../data/MeshProvider';
import { getTrackingLogs, formatLogDate, formatLogTime } from '../data/trackingLogs';
import EmergencyButton from '../components/EmergencyButton';
import { Icon, colors } from '../ui';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import MapNodeBrowser from '../components/MapNodeBrowser';
import WarningLogs from '../components/WarningLogs';
import { useWeather } from '../data/weather';
import { signalInfo } from '../utils/display';
const weatherIconColor = icon => ({
  sun: '#d97706',
  moon: '#4f46e5',
  'cloud-sun': '#d97706',
  cloud: '#64748b',
  'cloud-fog': '#64748b',
  'cloud-drizzle': '#0284c7',
  'cloud-rain': '#2563eb',
  'cloud-snow': '#0891b2',
  'cloud-lightning': '#7c3aed'
})[icon] || '#64748b';
const coordinate = n => ({
  latitude: Number(n.lat),
  longitude: Number(n.lng)
});
const valid = n => n.lat != null && n.lng != null && Number.isFinite(Number(n.lat)) && Number.isFinite(Number(n.lng)) && Math.abs(Number(n.lat)) <= 90 && Math.abs(Number(n.lng)) <= 180;
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}
function Emitter({
  color,
  size,
  active,
  children
}) {
  const waves = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !active) return;
    const emit = () => {
      waves.forEach((wave, index) => {
        wave.setValue(0);
        Animated.sequence([Animated.delay(index * 350), Animated.timing(wave, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true
        })]).start();
      });
    };
    emit();
    const timer = setInterval(emit, 3000);
    return () => {
      clearInterval(timer);
      waves.forEach(w => {
        w.stopAnimation();
        w.setValue(0);
      });
    };
  }, [waves, reduced, active]);
  return <View style={{
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center'
  }}>
 {!reduced && active && waves.map((wave, i) => <Animated.View key={i} style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor: color,
      opacity: wave.interpolate({
        inputRange: [0, .05, 1],
        outputRange: [0, .7, 0]
      }),
      transform: [{
        scale: wave.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 84 / size]
        })
      }]
    }} />)}
 {children}
 </View>;
}
function DeviceDot({
  pulse,
  active
}) {
  const core = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !pulse) return;
    Animated.sequence([Animated.timing(core, {
      toValue: .5,
      duration: 170,
      useNativeDriver: true
    }), Animated.spring(core, {
      toValue: 1,
      useNativeDriver: true
    })]).start();
    return () => core.stopAnimation();
  }, [pulse, reduced, core]);
  return <Emitter color={colors.purple} size={24} active={active}>
 <View style={{
      width: 23,
      height: 23,
      borderRadius: 12,
      backgroundColor: 'white',
      alignItems: 'center',
      justifyContent: 'center'
    }}><Animated.View style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.purple,
        transform: [{
          scale: core
        }]
      }} /></View>
 </Emitter>;
}
function NodeDot({
  node,
  active
}) {
  const signal = signalInfo(node.signal);
  const offline = signal.level === 0;
  return <Emitter color={signal.color} size={38} active={active && !offline}>
 {offline && <View testID={'offline-ring-' + node.id} style={[styles.offlineRing, {
      borderColor: signal.color
    }]} />}
 <View style={[styles.marker, {
      backgroundColor: node.color || '#4ade80'
    }]}><Text style={styles.markerText}>{node.id}</Text></View>
 </Emitter>;
}
export default function Map({
  route,
  navigation
}) {
  const {
    nodes,
    boundId,
    logs,
    user,
    warningLogs = []
  } = useMesh();
  const weather = useWeather(nodes);
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const map = useRef(null);
  const pendingSelection = useRef(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [legend, setLegend] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [status, setStatus] = useState('');
  const date = route.params?.historyDate;
  const historyNode = route.params?.historyNode || 'all';
  const history = getTrackingLogs(logs, historyNode, date).filter(valid);
  const own = nodes.find(n => n.id === boundId);
  const live = nodes.filter(valid);
  const bottom = Math.max(insets.bottom, 30) + 94;
  const notice = status || (!nodes.length ? 'No devices in Supabase yet. Seed the nodes table to get started.' : '');
  const closePanels = () => {
    setLegend(false);
    setWarningsOpen(false);
    setSelected(null);
  };
  const fit = points => {
    if (points.length) map.current?.fitToCoordinates(points.map(coordinate), {
      edgePadding: {
        top: 210,
        right: 65,
        bottom: 180,
        left: 65
      },
      animated: true
    });
  };
  function showNode(node) {
    setLegend(false);
    setWarningsOpen(false);
    if (!valid(node)) {
      setStatus('This node has no known location.');
      return;
    }
    if (date) {
      pendingSelection.current = node;
      navigation.setParams({
        historyDate: undefined,
        historyNode: undefined
      });
      return;
    }
    setSelected({
      ...node,
      type: 'node'
    });
    map.current?.animateToRegion({
      ...coordinate(node),
      latitudeDelta: .012,
      longitudeDelta: .012
    }, 450);
  }
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(''), 4000);
    return () => clearTimeout(timer);
  }, [status]);
  useEffect(() => {
    if (!ready) return;
    setSelected(null);
    if (!date && pendingSelection.current) {
      const node = pendingSelection.current;
      pendingSelection.current = null;
      showNode(node);
    } else fit(date ? history : live);
    // Fit on entering a mode, not on each background data refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, date, historyNode]);
  // Opened from an emergency alert: focus the device that raised it.
  const focusNodeId = route.params?.focusNodeId;
  useEffect(() => {
    if (!ready || !focusNodeId) return;
    navigation.setParams({
      focusNodeId: undefined
    });
    const node = nodes.find(item => item.id === focusNodeId);
    if (node) showNode(node);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, focusNodeId]);
  function center() {
    closePanels();
    if (date) {
      fit(history);
      return;
    }
    const target = own && valid(own) ? own : live[0];
    map.current?.animateToRegion({
      ...(target ? coordinate(target) : {
        latitude: 33.8848,
        longitude: 130.8756
      }),
      latitudeDelta: target ? 0.012 : 0.07,
      longitudeDelta: target ? 0.012 : 0.07
    }, 450);
    if (own && valid(own)) setPulse(p => p + 1);
  }
  const initial = own && valid(own) ? own : live[0];
  return <View style={styles.root}>
   <MapView ref={map} style={StyleSheet.absoluteFill} userInterfaceStyle="light" initialRegion={{
      ...(initial ? coordinate(initial) : {
        latitude: 33.8848,
        longitude: 130.8756
      }),
      latitudeDelta: .07,
      longitudeDelta: .07
    }} onMapReady={() => setReady(true)} rotateEnabled={false} pitchEnabled={false} scrollEnabled={!legend} zoomEnabled={!legend} legalLabelInsets={{
      top: 0,
      left: 16,
      right: 16,
      bottom: bottom + 56
    }} mapPadding={{
      top: 0,
      left: 0,
      right: 0,
      bottom: bottom + 56
    }}>
    {!date && live.map(node => <Marker key={node.id} coordinate={coordinate(node)} anchor={{
        x: .5,
        y: .5
      }} tracksViewChanges={focused} onPress={() => setSelected({
        ...node,
        type: 'node'
      })}>
     {node.id === boundId ? <DeviceDot pulse={pulse} active={focused} /> : <NodeDot node={node} active={focused} />}
    </Marker>)}
    {!!date && nodes.map(node => {
        const points = history.filter(entry => entry.nodeId === node.id);
        return points.length > 1 ? <Polyline key={node.id} coordinates={points.map(coordinate)} strokeColor={node.color || '#60a5fa'} strokeWidth={4} /> : null;
      })}
    {!!date && history.map(entry => {
        const node = nodes.find(item => item.id === entry.nodeId);
        const number = history.filter(item => item.nodeId === entry.nodeId).findIndex(item => item.id === entry.id) + 1;
        return <Marker key={entry.id} coordinate={coordinate(entry)} onPress={() => setSelected({
          ...entry,
          type: 'log'
        })}><View style={[styles.historyMarker, {
            backgroundColor: node?.color || '#60a5fa'
          }]}><Text style={styles.markerText}>{entry.nodeId} · {number}</Text></View></Marker>;
      })}
   </MapView>
   <View pointerEvents="none" style={[styles.topShade, {
      height: insets.top + 155
    }]}>
    <Svg width="100%" height="100%"><Defs><LinearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#000" stopOpacity={.65} /><Stop offset="1" stopColor="#000" stopOpacity={0} /></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#topShade)" /></Svg>
   </View>
   <View pointerEvents="none" style={[styles.logo, {
      top: insets.top + 18
    }]}>
    <Svg width={35} height={35} viewBox="0 0 40 40" fill="none" stroke="#73e69b" strokeWidth={3} strokeLinecap="round"><Path d="M5 30 17 9M17 30 28 11 38 30" /></Svg>
   </View>
   {(date || notice) && <View style={[styles.topPanel, {
      top: insets.top + 90
    }]}>
    {date ? <><Text style={styles.blue}>Tracking history · {historyNode === 'all' ? 'All nodes' : historyNode}</Text>
     <Text style={styles.historyTitle}>{history.length ? formatLogDate(date) : 'No history found'}</Text>
     <Text style={styles.caption}>{history.length} positions · Tap a point for details. Lines connect readings, not verified trails.</Text>
     <View style={styles.panelActions}>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Logs', {
            nodeId: historyNode
          })} style={styles.textButton}><Text style={styles.blue}>Back to logs</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Exit tracking history" onPress={() => navigation.setParams({
            historyDate: undefined,
            historyNode: undefined
          })} style={styles.textButton}><Text style={styles.blue}>Exit history</Text></Pressable>
     </View>
    </> : <Text accessibilityLiveRegion="polite" style={styles.locationStatus}>{notice}</Text>}
   </View>}
   {selected && <View style={[styles.details, {
      bottom: bottom + 116
    }]}>
    <View style={styles.detailHeader}><Text style={styles.detailTitle}>{selected.type === 'log' ? selected.nodeId + ' · ' + formatLogDate(selected.date) : selected.name + (selected.id === boundId ? ' (Your device)' : '')}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close node details" onPress={() => setSelected(null)} hitSlop={10}><Icon name="close" color="#666" size={20} /></Pressable></View>
    {selected.type === 'log' ? <Text style={styles.detailText}>{formatLogTime(selected.timestamp)} · {selected.rssi} dBm</Text> : <>
     <Text style={styles.detailText}>Role: {selected.role || 'Unknown'}</Text><Text style={styles.detailText}>Battery: {selected.battery ?? '—'}%</Text><Text style={styles.detailText}>Signal: {selected.signal}</Text><Text style={styles.detailText}>Mesh hops: {selected.hops ?? 0}</Text><Text style={styles.detailText}>Last seen: {selected.last_seen ? new Date(selected.last_seen).toLocaleString() : 'Unknown'}</Text>
     <View style={styles.weatherRow}>
      <Icon name={weather[selected.id]?.icon || 'cloud'} size={18} color={weather[selected.id] ? weatherIconColor(weather[selected.id].icon) : '#999'} />
      <Text style={styles.detailText}>{weather[selected.id] ? weather[selected.id].label + ' · ' + weather[selected.id].temperature + '°C · wind ' + weather[selected.id].wind + ' km/h' : selected.id in weather ? 'Weather unavailable' : 'Loading weather…'}</Text>
     </View>
    </>}
    <Text style={styles.detailText}>Latitude: {Number(selected.lat).toFixed(6)}</Text><Text style={styles.detailText}>Longitude: {Number(selected.lng).toFixed(6)}</Text>
    {selected.type === 'node' && <Pressable accessibilityRole="button" accessibilityLabel={'Track logs for ' + selected.id} onPress={() => navigation.navigate('Logs', {
        nodeId: selected.id
      })} style={({
        pressed
      }) => [styles.trackButton, pressed && {
        opacity: .7
      }]}><Icon name="logs" size={18} color="#fff" /><Text style={styles.trackText}>Track logs</Text></Pressable>}
   </View>}
   <View style={[styles.leftControls, {
      bottom
    }]}><Pressable accessibilityRole="button" accessibilityLabel="Open map nodes" accessibilityState={{
        expanded: legend
      }} onPress={() => {
        setSelected(null);
        setLegend(true);
      }} style={({
        pressed
      }) => [styles.control, pressed && styles.controlPressed]}><Icon name={legend ? 'close' : 'list'} size={23} color="#fff" /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Open warning logs" accessibilityState={{
        expanded: warningsOpen
      }} onPress={() => {
        setSelected(null);
        setLegend(false);
        setWarningsOpen(true);
      }} style={({
        pressed
      }) => [styles.control, pressed && styles.controlPressed]}><Icon name="bell" size={22} color="#fca5a5" />{warningLogs.some(alert => alert.status === 'active') && <View style={styles.warningDot} />}</Pressable></View>
   <View style={[styles.rightControls, {
      bottom
    }]}><Pressable accessibilityRole="button" accessibilityLabel={date ? 'Fit tracking history' : 'Locate connected device'} onPress={center} style={({
        pressed
      }) => [styles.control, pressed && styles.controlPressed]}><Icon name="crosshair" size={23} color={own ? '#c084fc' : '#fff'} /></Pressable><EmergencyButton compact style={styles.control} onOpen={closePanels} /></View>
   <WarningLogs visible={warningsOpen} onClose={() => setWarningsOpen(false)} alerts={warningLogs} nodes={nodes} boundId={boundId} userId={user?.id} onSelect={showNode} />
   <MapNodeBrowser visible={legend} onClose={() => setLegend(false)} nodes={nodes} boundId={boundId} onSelect={showNode} />
  </View>;
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000'
  },
  offlineRing: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    backgroundColor: '#ef444433'
  },
  marker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  markerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111'
  },
  historyMarker: {
    minHeight: 40,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center'
  },
  topShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0
  },
  logo: {
    position: 'absolute',
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#ffffff26',
    backgroundColor: '#00000073',
    alignItems: 'center',
    justifyContent: 'center'
  },
  topPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: 384,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#000000bf',
    borderWidth: 1,
    borderColor: '#ffffff1a'
  },
  blue: {
    color: '#93c5fd',
    fontSize: 12
  },
  locationStatus: {
    color: '#ffffffb3',
    fontSize: 12,
    lineHeight: 18
  },
  historyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4
  },
  caption: {
    fontSize: 12,
    color: '#ffffff80',
    marginTop: 4,
    lineHeight: 18
  },
  panelActions: {
    flexDirection: 'row',
    gap: 16
  },
  textButton: {
    minHeight: 36,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8
  },
  leftControls: {
    position: 'absolute',
    left: 16,
    gap: 12
  },
  rightControls: {
    position: 'absolute',
    right: 16,
    gap: 12
  },
  control: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ffffff40',
    backgroundColor: '#181b20e6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: .22,
    shadowRadius: 9,
    elevation: 4
  },
  controlPressed: {
    backgroundColor: '#3e434cf2'
  },
  details: {
    position: 'absolute',
    left: 24,
    right: 24,
    maxWidth: 380,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 18,
    gap: 4
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6
  },
  detailTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111'
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  trackButton: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  trackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  warningDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#181b20'
  },
  detailText: {
    color: '#555',
    fontSize: 13,
    lineHeight: 19
  }
});

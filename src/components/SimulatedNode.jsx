import React, { useEffect, useRef } from 'react';
import { View, Animated, AccessibilityInfo, StyleSheet } from 'react-native';
import { Icon, Text } from '../ui';

export default function SimulatedNode({ node, simulation }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let mounted = true;
    let animation;
    const apply = reduced => {
      animation?.stop();
      opacity.setValue(1);
      if (reduced || !mounted) return;
      animation = Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]));
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(apply);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', apply);
    return () => { mounted = false; animation?.stop(); subscription.remove(); };
  }, [opacity]);
  const label = simulation.phase === 'retrying' ? 'Retrying... x' + simulation.attempt
    : simulation.phase === 'sent' ? 'Emergency published' : simulation.phase === 'error' ? 'Emergency failed' : 'Sending emergency…';
  return <View testID={'simulated-node-' + node.id} style={styles.container}>
    <View style={styles.label}><Text style={styles.labelText}>{label}</Text></View>
    <View style={styles.halo} />
    <View style={styles.dot}><Text style={styles.id}>{node.id}</Text></View>
    <Animated.View style={[styles.warning, { opacity }]}><Icon name="warning" color="#fff" size={20} /></Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  container: { width: 168, height: 110, alignItems: 'center', justifyContent: 'center' },
  label: { position: 'absolute', top: 0, backgroundColor: '#b91c1c', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  labelText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  halo: { position: 'absolute', width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: '#f87171', backgroundColor: '#ef444455' },
  dot: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: '#fff', backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  id: { color: '#fff', fontSize: 11, fontWeight: '900' },
  warning: { position: 'absolute', right: 33, bottom: 15, width: 27, height: 27, borderRadius: 14, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
});

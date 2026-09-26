import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui';
import { Map as PigeonMap } from 'pigeon-maps';
import { osm } from 'pigeon-maps/providers';

// Browser map built on pigeon-maps (plain React, OpenStreetMap tiles), exposing the
// subset of the react-native-maps API that the Map page uses. Phones use NativeMap.js.

const toPoint = coordinate => [coordinate.latitude, coordinate.longitude];
const clampZoom = zoom => Math.max(2, Math.min(17, zoom));
// react-native-maps regions use a latitude span; web maps use zoom levels.
const zoomForDelta = delta => clampZoom(Math.round(Math.log2(360 / (delta || 0.05))));

// Web Mercator in "world units" (0..1), used to fit a set of points into the view.
const worldX = lng => (lng + 180) / 360;
const worldY = lat => {
  const sin = Math.sin(lat * Math.PI / 180);
  return 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
};
const lngFromWorld = x => x * 360 - 180;
const latFromWorld = y => Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI;

function fitView(coordinates, size, padding = {}) {
  const xs = coordinates.map(c => worldX(c.longitude));
  const ys = coordinates.map(c => worldY(c.latitude));
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const left = padding.left || 0, right = padding.right || 0, top = padding.top || 0, bottom = padding.bottom || 0;
  const width = Math.max(size.width - left - right, 60);
  const height = Math.max(size.height - top - bottom, 60);
  const spanX = maxX - minX, spanY = maxY - minY;
  const zoom = spanX || spanY
    ? clampZoom(Math.floor(Math.log2(Math.min(spanX ? width / (spanX * 256) : Infinity, spanY ? height / (spanY * 256) : Infinity))))
    : 15;
  // Shift the centre so the points sit in the padded area, not the whole map.
  const scale = 256 * 2 ** zoom;
  const centerX = (minX + maxX) / 2 + (right - left) / 2 / scale;
  const centerY = (minY + maxY) / 2 + (bottom - top) / 2 / scale;
  return { center: [latFromWorld(centerY), lngFromWorld(centerX)], zoom };
}

const MapView = forwardRef(function MapView({ style, initialRegion, onMapReady, scrollEnabled = true, zoomEnabled = true, mapPadding, children }, ref) {
  const [size, setSize] = useState(null);
  const [view, setView] = useState(() => ({
    center: initialRegion ? toPoint(initialRegion) : [33.8848, 130.8756],
    zoom: zoomForDelta(initialRegion?.latitudeDelta),
  }));
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useImperativeHandle(ref, () => ({
    animateToRegion(region) {
      setView({ center: toPoint(region), zoom: zoomForDelta(region.latitudeDelta) });
    },
    fitToCoordinates(coordinates, options = {}) {
      if (!coordinates.length || !sizeRef.current) return;
      setView(fitView(coordinates, sizeRef.current, options.edgePadding));
    },
  }), []);

  const ready = !!size;
  useEffect(() => {
    if (ready) onMapReady?.();
    // Fire once when the map has a size and can position things, like the native onMapReady.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const interactive = scrollEnabled && zoomEnabled;
  return (
    <View
      style={[style, styles.container]}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        if (width && height) setSize({ width: Math.round(width), height: Math.round(height) });
      }}
    >
      {size && (
        <PigeonMap
          width={size.width}
          height={size.height}
          center={view.center}
          zoom={view.zoom}
          onBoundsChanged={({ center, zoom }) => setView({ center, zoom })}
          provider={osm}
          animate
          mouseEvents={interactive}
          touchEvents={interactive}
          attribution={false}
          attributionPrefix={false}
          minZoom={2}
          maxZoom={18}
        >
          {Children.map(children, child => (
            // pigeon-maps treats a child's `anchor` prop as a lat/lng; ours is the icon anchor.
            isValidElement(child) && child.type === Marker
              ? cloneElement(child, { anchor: undefined, iconAnchor: child.props.anchor })
              : child
          ))}
        </PigeonMap>
      )}
      {/* OpenStreetMap requires visible credit; keep it clear of the navbar. */}
      <Text style={[styles.attribution, { bottom: (mapPadding?.bottom || 0) + 4 }]}>
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>OpenStreetMap</a> contributors
      </Text>
    </View>
  );
});

// pigeon-maps hands every child a latLngToPixel helper; markers position themselves with it.
export function Marker({ coordinate, iconAnchor: anchor = { x: 0.5, y: 1 }, onPress, children, latLngToPixel }) {
  if (!latLngToPixel) return null;
  const [left, top] = latLngToPixel(toPoint(coordinate));
  return (
    <div
      onClick={onPress}
      style={{
        position: 'absolute',
        left,
        top,
        transform: `translate(${-anchor.x * 100}%, ${-anchor.y * 100}%)`,
        cursor: onPress ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  );
}

export function Polyline({ coordinates, strokeColor = '#2563eb', strokeWidth = 3, latLngToPixel, mapState }) {
  if (!latLngToPixel || !mapState) return null;
  const points = coordinates.map(c => latLngToPixel(toPoint(c)).join(',')).join(' ');
  return (
    <svg width={mapState.width} height={mapState.height} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      <polyline points={points} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
    </svg>
  );
}

export default MapView;

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: '#ede3d0' },
  attribution: { position: 'absolute', right: 8, fontSize: 10, color: '#4a3d30', backgroundColor: '#ffffffcc', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
});

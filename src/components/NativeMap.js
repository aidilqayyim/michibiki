// Phones use the real native map. The browser build gets NativeMap.web.js instead,
// because react-native-maps has no web implementation.
export { default, Marker, Polyline } from 'react-native-maps';

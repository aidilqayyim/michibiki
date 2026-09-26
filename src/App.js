import React from 'react';
import { StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import { colors, fontFiles } from './ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MeshProvider from './data/MeshProvider';
import NavBar from './components/NavBar';
import Chat from './pages/Chat';
import Nodes from './pages/Nodes';
import Map from './pages/Map';
import Connect from './pages/Connect';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import EmergencyAlert from './components/EmergencyAlert';
import { ReadStateProvider } from './data/readState';
import DemoProvider from './data/DemoProvider';
import DemoOverlay from './components/DemoOverlay';
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();
const Stack = createNativeStackNavigator();
function Tabs() {
  return <Tab.Navigator initialRouteName="Map" tabBar={props => <NavBar {...props} />} screenOptions={{
    headerShown: false,
    sceneStyle: {
      backgroundColor: colors.bg
    },
    // Quick cross-fade: the next page appears faintly then settles in.
    animation: 'fade',
    transitionSpec: {
      animation: 'timing',
      config: {
        duration: 160
      }
    }
  }}><Tab.Screen name="Chat" component={Chat} /><Tab.Screen name="Nodes" component={Nodes} /><Tab.Screen name="Map" component={Map} /><Tab.Screen name="Connect" component={Connect} /><Tab.Screen name="Settings" component={Settings} /></Tab.Navigator>;
}
export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontFiles);
  // Wait for SF Pro Display so text never flashes in the fallback font; carry on if it fails to load.
  if (!fontsLoaded && !fontError) return null;
  return <SafeAreaProvider><StatusBar barStyle="dark-content" backgroundColor={colors.bg} /><MeshProvider><DemoProvider><ReadStateProvider><NavigationContainer ref={navigationRef} theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.bg,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          primary: colors.blue
        }
      }}><Stack.Navigator screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.bg
          },
          animation: 'fade',
          animationDuration: 180
        }}><Stack.Screen name="Main" component={Tabs} /><Stack.Screen name="Logs" component={Logs} /></Stack.Navigator><EmergencyAlert onShowOnMap={nodeId => navigationRef.isReady() && navigationRef.navigate('Main', {
          screen: 'Map',
          params: {
            focusNodeId: nodeId
          }
        })} /><DemoOverlay /></NavigationContainer></ReadStateProvider></DemoProvider></MeshProvider></SafeAreaProvider>;
}

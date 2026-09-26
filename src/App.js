import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
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
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();
const Stack = createNativeStackNavigator();
function Tabs() {
  return <Tab.Navigator initialRouteName="Map" tabBar={props => <NavBar {...props} />} screenOptions={{
    headerShown: false,
    sceneStyle: {
      backgroundColor: '#000'
    },
    animation: 'none'
  }}><Tab.Screen name="Chat" component={Chat} /><Tab.Screen name="Nodes" component={Nodes} /><Tab.Screen name="Map" component={Map} /><Tab.Screen name="Connect" component={Connect} /><Tab.Screen name="Settings" component={Settings} /></Tab.Navigator>;
}
export default function App() {
  return <SafeAreaProvider><StatusBar barStyle="light-content" backgroundColor="#000" /><MeshProvider><ReadStateProvider><NavigationContainer ref={navigationRef} theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#000',
          card: '#1c1c1e'
        }
      }}><Stack.Navigator screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#000'
          },
          animation: 'slide_from_right'
        }}><Stack.Screen name="Main" component={Tabs} /><Stack.Screen name="Logs" component={Logs} /></Stack.Navigator><EmergencyAlert onShowOnMap={nodeId => navigationRef.isReady() && navigationRef.navigate('Main', {
          screen: 'Map',
          params: {
            focusNodeId: nodeId
          }
        })} /></NavigationContainer></ReadStateProvider></MeshProvider></SafeAreaProvider>;
}

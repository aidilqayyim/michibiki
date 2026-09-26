import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react-native';
import App from './App';
import {meshFixture} from './test/meshFixture';
import {loadMesh} from './data/MeshQueries';
jest.mock('./data/api',()=>({ensureIdentity:async()=>({id:'test-user'}),writeBinding:jest.fn(),insertRow:jest.fn()}));
jest.mock('./data/MeshQueries',()=>({loadMesh:jest.fn()}));
jest.mock('react-native-maps',()=>{
 const React=require('react');const {View}=require('react-native');
 return {__esModule:true,default:React.forwardRef((props,ref)=>{
 React.useImperativeHandle(ref,()=>({animateToRegion:jest.fn(),fitToCoordinates:jest.fn()}));
 return <View testID="native-map">{props.children}</View>;
 }),Marker:View,Polyline:View};
});
test('native tabs and tracking history connect through the real navigator',async()=>{
 loadMesh.mockResolvedValue(meshFixture());
 await render(<App/>);
 await screen.findByTestId('native-map');
 await fireEvent.press(screen.getByRole('tab',{name:'Nodes'}));
 await screen.findByText('Nodes (4)');
 await fireEvent.press(screen.getByLabelText('Logs for A07'));
 await screen.findByText('Tracking logs');
 await fireEvent.press(screen.getAllByText('Show on Map')[0]);
 await screen.findByText('26 September 2026');
 await fireEvent.press(screen.getByLabelText('Exit tracking history'));
 await waitFor(()=>expect(screen.queryByLabelText('Exit tracking history')).toBeNull());
});
test('chat tab shows a blue dot for unread messages until they are read',async()=>{
 const AsyncStorage=require('@react-native-async-storage/async-storage');
 await AsyncStorage.setItem('michibiki.read.none',JSON.stringify({since:0,read:{}}));
 loadMesh.mockResolvedValue({...meshFixture(),channels:[{id:'trail',name:'Trail',memberIds:[]}],messages:[{id:'m1',sender_node_id:'B12',channel_id:'trail',body:'Hello',sent_at:'2026-09-26T01:00:00Z'}]});
 await render(<App/>);
 await screen.findByTestId('chat-unread-dot');
 expect(screen.getByRole('tab',{name:'Chat, unread messages'})).toBeTruthy();
 await fireEvent.press(screen.getByRole('tab',{name:'Chat, unread messages'}));
 await screen.findByText('Hello');
 await waitFor(()=>expect(screen.queryByTestId('chat-unread-dot')).toBeNull());
});

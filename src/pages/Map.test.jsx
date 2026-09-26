import React from 'react';
import { View } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Map from './Map';
import { useMesh } from '../data/MeshProvider';
import { meshFixture } from '../test/meshFixture';
import { useDemo } from '../data/DemoProvider';
jest.mock('../data/DemoProvider', () => ({ useDemo: jest.fn() }));
const mockAnimate = jest.fn();
const mockFit = jest.fn();
jest.mock('../data/MeshProvider', () => ({
  useMesh: jest.fn()
}));
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => false
}));
jest.mock('react-native-maps', () => {
  const React = require('react');
  const {
    View
  } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        animateToRegion: mockAnimate,
        fitToCoordinates: mockFit
      }));
      return <View testID="map">{props.children}</View>;
    }),
    Marker: props => <View testID="marker" {...props} />,
    Polyline: props => <View testID="path" {...props} />
  };
});
let data;
beforeEach(() => {
  jest.clearAllMocks();
  useDemo.mockReturnValue({ simulation: { phase: 'idle' }, enabled: false });
  data = {
    ...meshFixture(),
    boundId: 'A07'
  };
  useMesh.mockReturnValue(data);
});

test('the bound device shows the retry warning while other nodes stay unaffected', async () => {
  useDemo.mockReturnValue({ simulation: { kind: 'range', phase: 'retrying', nodeId: 'A07', attempt: 3 }, enabled: false });
  await render(<Map route={{}} navigation={{ navigate: jest.fn(), setParams: jest.fn() }} />);
  expect(screen.getByTestId('simulated-node-A07')).toBeTruthy();
  expect(screen.getByText('Retrying... x3')).toBeTruthy();
  expect(screen.queryByTestId('simulated-node-B12')).toBeNull();
});
test('recenter targets the bound device and other markers have node IDs', async () => {
  await render(<Map route={{}} navigation={{
    navigate: jest.fn(),
    setParams: jest.fn()
  }} />);
  await fireEvent.press(screen.getByLabelText('Locate connected device'));
  expect(mockAnimate).toHaveBeenCalledWith(expect.objectContaining({
    latitude: data.nodes[0].lat,
    longitude: data.nodes[0].lng
  }), 450);
  expect(screen.getByText('B12')).toBeTruthy();
});
test('no GPS panel, and markers show their signal state', async () => {
  data.nodes = data.nodes.map(node => node.id === 'R03' ? { ...node, signal: 'Offline' } : node);
  await render(<Map route={{}} navigation={{
    navigate: jest.fn(),
    setParams: jest.fn()
  }} />);
  expect(screen.queryByText('Refresh location')).toBeNull();
  expect(screen.getByTestId('offline-ring-R03')).toBeTruthy();
  expect(screen.queryByTestId('offline-ring-B12')).toBeNull();
});
test('history map displays only the requested node and date', async () => {
  await render(<Map route={{
    params: {
      historyDate: '2026-09-25',
      historyNode: 'B12'
    }
  }} navigation={{
    navigate: jest.fn(),
    setParams: jest.fn()
  }} />);
  expect(screen.getAllByTestId('marker')).toHaveLength(4);
  expect(screen.getAllByTestId('path')).toHaveLength(1);
  await fireEvent.press(screen.getAllByTestId('marker')[0]);
  expect(screen.getByText(/09:15:00 · -80 dBm/)).toBeTruthy();
});

test('node browser filters roles, searches, clears search and opens node details', async () => {
  data.nodes = data.nodes.map(node => ({ ...node, role: node.id === 'R03' ? 'Relay' : 'Hiker', hops: 1 }));
  await render(<Map route={{}} navigation={{ navigate: jest.fn(), setParams: jest.fn() }} />);
  await fireEvent.press(screen.getByLabelText('Open map nodes'));
  await screen.findByText('Map Nodes');
  await fireEvent.press(screen.getByText('Relays'));
  expect(screen.getByText('1 results')).toBeTruthy();
  expect(screen.queryByLabelText('Show Michibiki B12 on map')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Search map nodes'), 'missing');
  expect(screen.getByText('No nodes found')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Clear search'));
  await fireEvent.press(screen.getByLabelText('Show Relay R03 on map'));
  expect(mockAnimate).toHaveBeenCalledWith(expect.objectContaining({ latitude: data.nodes[3].lat }), 450);
  expect(screen.getByText('Role: Relay')).toBeTruthy();
  expect(screen.getByText('Mesh hops: 1')).toBeTruthy();
});

test('history recenter fits the selected readings and back opens filtered logs', async () => {
  const navigation = { navigate: jest.fn(), setParams: jest.fn() };
  await render(<Map route={{ params: { historyDate: '2026-09-25', historyNode: 'B12' } }} navigation={navigation} />);
  await fireEvent.press(screen.getByLabelText('Fit tracking history'));
  const expected = data.logs.filter(log => log.date === '2026-09-25' && log.nodeId === 'B12').map(log => ({ latitude: log.lat, longitude: log.lng }));
  expect(mockFit).toHaveBeenCalledWith(expected, expect.any(Object));
  expect(mockAnimate).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Back to logs'));
  expect(navigation.navigate).toHaveBeenCalledWith('Logs', { nodeId: 'B12' });
});

test('node details show weather and open track logs; warning logs list alerts', async () => {
  const navigation = { navigate: jest.fn(), setParams: jest.fn() };
  data.warningLogs = [{ id: 'w1', user_id: 'someone', node_id: 'B12', status: 'active', message: 'Emergency assistance requested.', created_at: '2026-09-26T05:00:00Z' }];
  await render(<Map route={{}} navigation={navigation} />);
  await fireEvent.press(screen.getAllByTestId('marker')[1]);
  expect(await screen.findByText('Rain · 21°C · wind 12 km/h')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Track logs for B12'));
  expect(navigation.navigate).toHaveBeenCalledWith('Logs', { nodeId: 'B12' });
  await fireEvent.press(screen.getByLabelText('Open warning logs'));
  expect(screen.getByText('Warning Logs')).toBeTruthy();
  expect(screen.getByText('Michibiki B12')).toBeTruthy();
});

test('without a bound device, logs stay open but warnings cannot be sent', async () => {
  const navigation = { navigate: jest.fn(), setParams: jest.fn() };
  data.boundId = null;
  await render(<Map route={{}} navigation={navigation} />);
  expect(screen.getByLabelText('Emergency').props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getAllByTestId('marker')[1]);
  await fireEvent.press(screen.getByLabelText('Track logs for B12'));
  expect(navigation.navigate).toHaveBeenCalledWith('Logs', { nodeId: 'B12' });
  await fireEvent.press(screen.getByLabelText('Open warning logs'));
  expect(screen.getByText('Warning Logs')).toBeTruthy();
});

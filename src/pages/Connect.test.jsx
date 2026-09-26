import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react-native';
import Connect from './Connect';
import MeshProvider from '../data/MeshProvider';
import { ensureIdentity, writeBinding, writeRole } from '../data/api';
import { loadMesh } from '../data/MeshQueries';
import { meshFixture } from '../test/meshFixture';
jest.mock('../data/api', () => ({
  ensureIdentity: jest.fn(),
  writeBinding: jest.fn(),
  writeRole: jest.fn(),
  insertRow: jest.fn()
}));
jest.mock('../data/MeshQueries', () => ({
  loadMesh: jest.fn()
}));
let stored;
beforeEach(() => {
  jest.clearAllMocks();
  stored = meshFixture();
  ensureIdentity.mockResolvedValue({
    id: 'test-user'
  });
  loadMesh.mockImplementation(async () => ({
    ...stored
  }));
  writeBinding.mockImplementation(async (user, id) => {
    stored = {
      ...stored,
      boundId: id
    };
  });
});
const mount = () => render(<MeshProvider><Connect /></MeshProvider>);
test('binding persists across remount and disconnects', async () => {
  const view = await mount();
  await screen.findByText('Michibiki A07');
  await fireEvent.press(screen.getByLabelText('Michibiki A07, Select'));
  expect(writeBinding).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Bind device'));
  await screen.findByText('Disconnect');
  expect(writeBinding).toHaveBeenCalledWith('test-user', 'A07');
  await view.unmount();
  await mount();
  await fireEvent.press(await screen.findByText('Disconnect'));
  await waitFor(() => expect(writeBinding).toHaveBeenCalledWith('test-user', null));
  await waitFor(() => expect(screen.queryByText('Disconnect')).toBeNull());
});
test('failed binding preserves the current device', async () => {
  stored.boundId = 'A07';
  writeBinding.mockRejectedValue(new Error('Device already bound'));
  await mount();
  await screen.findByText('Disconnect');
  await fireEvent.press(screen.getByLabelText('Michibiki B12, Select'));
  await fireEvent.press(screen.getByText('Bind device'));
  await screen.findByText('Device already bound');
  expect(screen.getByText('Disconnect')).toBeTruthy();
});
test('network failure offers retry without fake records', async () => {
  loadMesh.mockRejectedValue(new Error('Network unavailable'));
  await mount();
  await screen.findByText('Network unavailable');
  expect(screen.getByText('Retry connection')).toBeTruthy();
  expect(screen.queryByText('Michibiki A07')).toBeNull();
});

test('canceling a selection does not bind a device', async () => {
  await mount();
  await fireEvent.press(await screen.findByLabelText('Michibiki B12, Select'));
  await screen.findByText('Bind Michibiki B12?');
  await fireEvent.press(screen.getByText('Cancel'));
  expect(screen.queryByText('Bind device')).toBeNull();
  expect(writeBinding).not.toHaveBeenCalled();
});

test('hides relays and base stations and blocks devices in use', async () => {
  stored.nodes = stored.nodes.map(node => ({ ...node, role: { R03: 'Relay', B12: 'Base Station' }[node.id] || 'Hiker' }));
  stored.inUseIds = ['C03'];
  await mount();
  expect(await screen.findByText(/^Hiker · Strong signal/)).toBeTruthy();
  expect(screen.queryByText('Relay R03')).toBeNull();
  expect(screen.queryByText('Michibiki B12')).toBeNull();
  const inUse = screen.getByLabelText('Michibiki C03, In Use');
  expect(inUse.props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(inUse);
  expect(screen.queryByText('Bind Michibiki C03?')).toBeNull();
});

test('binding saves the chosen role', async () => {
  stored.nodes = stored.nodes.map(node => ({ ...node, role: 'Hiker' }));
  writeRole.mockImplementation(async (id, role) => ({ ...stored.nodes.find(node => node.id === id), role }));
  await mount();
  await fireEvent.press(await screen.findByLabelText('Michibiki B12, Select'));
  expect(screen.getByLabelText('Device role').props.accessibilityValue.text).toBe('Hiker');
  await fireEvent.press(screen.getByLabelText('Device role'));
  await fireEvent.press(screen.getByText('Base Station'));
  await fireEvent.press(screen.getByText('Bind device'));
  await waitFor(() => expect(writeRole).toHaveBeenCalledWith('B12', 'Base Station'));
  expect(writeBinding).toHaveBeenCalledWith('test-user', 'B12');
});

test('alerts from other phones are picked up on refresh even without realtime', async () => {
  const { useMesh } = require('../data/MeshProvider');
  let mesh;
  function Probe() {
    mesh = useMesh();
    return null;
  }
  stored.boundId = 'A07';
  stored.recentAlerts = [
    { id: 'other', user_id: 'someone-else', node_id: 'B12', status: 'active', created_at: '2026-09-26T05:00:00Z' },
    { id: 'mine', user_id: 'test-user', node_id: 'A07', status: 'active', created_at: '2026-09-26T05:00:00Z' },
    { id: 'my-device', user_id: 'old-phone', node_id: 'A07', status: 'active', created_at: '2026-09-26T05:00:00Z' }
  ];
  await render(<MeshProvider><Probe /></MeshProvider>);
  await waitFor(() => expect(mesh.incomingAlerts.map(alert => alert.id)).toEqual(['other']));
  await act(() => mesh.refresh());
  expect(mesh.incomingAlerts).toHaveLength(1);
});

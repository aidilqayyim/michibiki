import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MeshProvider, { useMesh } from './MeshProvider';
import { loadMesh } from './MeshQueries';
import { insertDemoEmergency } from './api';
import { meshFixture } from '../test/meshFixture';
jest.mock('../supabaseClient', () => ({ supabase: null }));
jest.mock('./MeshQueries', () => ({ loadMesh: jest.fn() }));
jest.mock('./api', () => ({ ensureIdentity: async () => ({ id: 'test-user' }), insertDemoEmergency: jest.fn() }));

function Controls({ source }) {
  const { sendDemoEmergency, incomingAlerts, warningLogs = [] } = useMesh();
  return <><Pressable onPress={() => sendDemoEmergency({ id: 'demo-id', nodeId: source, reason: 'Signal lost' })}><Text>Publish</Text></Pressable>
    <Text>{'Incoming ' + incomingAlerts.length}</Text><Text>{'Logs ' + warningLogs.length}</Text></>;
}
beforeEach(() => {
  jest.clearAllMocks();
  loadMesh.mockResolvedValue({ ...meshFixture(), boundId: 'A07' });
  insertDemoEmergency.mockImplementation(async row => ({ ...row, status: 'active', created_at: new Date().toISOString() }));
});
test('out-of-range demo is persisted and received by the controlling phone once', async () => {
  await render(<MeshProvider><Controls source="B12" /></MeshProvider>);
  await fireEvent.press(await screen.findByText('Publish'));
  await screen.findByText('Incoming 1');
  expect(insertDemoEmergency).toHaveBeenCalledWith(expect.objectContaining({ id: 'demo-id', node_id: 'B12', user_id: 'test-user', is_demo: true, message: 'Signal lost' }));
  await fireEvent.press(screen.getByText('Publish'));
  await waitFor(() => expect(insertDemoEmergency).toHaveBeenCalledTimes(2));
  expect(screen.getByText('Incoming 1')).toBeTruthy();
  expect(screen.getByText('Logs 1')).toBeTruthy();
});
test('inactivity emergency is saved but does not sound its own received-alert siren', async () => {
  await render(<MeshProvider><Controls source="A07" /></MeshProvider>);
  await fireEvent.press(await screen.findByText('Publish'));
  await screen.findByText('Logs 1');
  expect(screen.getByText('Incoming 0')).toBeTruthy();
});

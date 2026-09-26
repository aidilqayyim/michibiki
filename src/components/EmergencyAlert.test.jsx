import React from 'react';
import { Vibration } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import EmergencyAlert from './EmergencyAlert';
import { useMesh } from '../data/MeshProvider';
import { meshFixture } from '../test/meshFixture';
jest.mock('../data/MeshProvider', () => ({
  useMesh: jest.fn()
}));
test('alerts from other devices take over the screen until dismissed', async () => {
  const vibrate = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});
  const dismissAlert = jest.fn();
  const onShowOnMap = jest.fn();
  useMesh.mockReturnValue({
    ...meshFixture(),
    incomingAlerts: [{ id: 'a1', node_id: 'B12', message: 'Emergency assistance requested.', lat: 33.8894, lng: 130.8375, created_at: '2026-09-26T05:00:00Z' }],
    dismissAlert
  });
  await render(<EmergencyAlert onShowOnMap={onShowOnMap} />);
  expect(screen.getByText('Michibiki B12 needs help')).toBeTruthy();
  expect(vibrate).toHaveBeenCalledWith(expect.any(Array), true);
  await fireEvent.press(screen.getByText('Show on map'));
  expect(dismissAlert).toHaveBeenCalledWith('a1');
  expect(onShowOnMap).toHaveBeenCalledWith('B12');
});
test('renders nothing without alerts', async () => {
  useMesh.mockReturnValue({ ...meshFixture(), incomingAlerts: [], dismissAlert: jest.fn() });
  await render(<EmergencyAlert onShowOnMap={jest.fn()} />);
  expect(screen.queryByText('EMERGENCY')).toBeNull();
});

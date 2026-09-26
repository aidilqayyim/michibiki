import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import EmergencyButton from './EmergencyButton';
import { useMesh } from '../data/MeshProvider';
jest.mock('../data/MeshProvider', () => ({
  useMesh: jest.fn()
}));
test('emergency requires confirmation and reports failed writes', async () => {
  const sendEmergency = jest.fn().mockRejectedValue(new Error('Offline'));
  useMesh.mockReturnValue({
    sendEmergency,
    boundId: 'A07'
  });
  await render(<EmergencyButton />);
  await fireEvent.press(screen.getByText('Emergency'));
  expect(sendEmergency).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Send Emergency'));
  await screen.findByText('Offline');
  expect(screen.queryByText('Emergency published')).toBeNull();
  sendEmergency.mockResolvedValue({
    id: 'saved'
  });
  await fireEvent.press(screen.getByText('Send Emergency'));
  await screen.findByText('Emergency published');
  expect(sendEmergency).toHaveBeenCalledTimes(2);
});
test('emergency is disabled until a device is bound', async () => {
  const sendEmergency = jest.fn();
  useMesh.mockReturnValue({ sendEmergency, boundId: null });
  await render(<EmergencyButton compact />);
  const button = screen.getByLabelText('Emergency');
  expect(button.props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(button);
  expect(screen.queryByText('Send Emergency')).toBeNull();
});

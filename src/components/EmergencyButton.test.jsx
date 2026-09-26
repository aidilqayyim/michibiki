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
    sendEmergency
  });
  await render(<EmergencyButton />);
  await fireEvent.press(screen.getByText('Emergency'));
  expect(sendEmergency).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Send Emergency'));
  await screen.findByText('Offline');
  expect(screen.queryByText('Demo warning saved')).toBeNull();
  sendEmergency.mockResolvedValue({
    id: 'saved'
  });
  await fireEvent.press(screen.getByText('Send Emergency'));
  await screen.findByText('Demo warning saved');
  expect(sendEmergency).toHaveBeenCalledTimes(2);
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import DemoOverlay from './DemoOverlay';
import { useDemo } from '../data/DemoProvider';
jest.mock('../data/DemoProvider', () => ({ useDemo: jest.fn() }));

test('check-in offers exactly the two requested responses without a keyboard label', async () => {
  const command = jest.fn();
  useDemo.mockReturnValue({ simulation: { kind: 'inactivity', phase: 'checking', nodeId: 'A07', remaining: 300 }, command });
  await render(<DemoOverlay />);
  expect(screen.getByText('Are you okay?')).toBeTruthy();
  expect(screen.getByText('5:00')).toBeTruthy();
  expect(screen.getAllByRole('button')).toHaveLength(2);
  expect(screen.queryByText(/Shift/)).toBeNull();
  await fireEvent.press(screen.getByText("I'm okay"));
  expect(command).toHaveBeenCalledWith('acknowledge');
  await fireEvent.press(screen.getByText('I need help'));
  expect(command).toHaveBeenCalledWith('help');
});

test('successful publication shows confirmation then a dismissible notice above the navbar', async () => {
  const command = jest.fn();
  useDemo.mockReturnValue({ simulation: { kind: 'inactivity', phase: 'sent', emergencyId: 'one', nodeId: 'A07' }, command });
  await render(<DemoOverlay />);
  expect(screen.getByText(/published to the mesh alert feed for all nodes/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Continue'));
  expect(screen.queryByText('Continue')).toBeNull();
  expect(screen.getByText(/Rangers, the base station, or nearby users may contact you/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Dismiss broadcast notice'));
  expect(screen.queryByText('Emergency signal broadcast')).toBeNull();
});

test('publication errors never display broadcast confirmation', async () => {
  useDemo.mockReturnValue({ simulation: { kind: 'inactivity', phase: 'error', error: 'Offline', nodeId: 'A07' }, command: jest.fn() });
  await render(<DemoOverlay />);
  expect(screen.getByText('Offline')).toBeTruthy();
  expect(screen.queryByText('Emergency signal broadcast')).toBeNull();
});

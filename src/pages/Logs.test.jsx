import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Logs from './Logs';
import { useMesh } from '../data/MeshProvider';
import { meshFixture } from '../test/meshFixture';
jest.mock('../data/MeshProvider', () => ({
  useMesh: jest.fn()
}));
test('history groups by date and navigates with selected node and day', async () => {
  useMesh.mockReturnValue(meshFixture());
  const navigation = {
    popTo: jest.fn()
  };
  await render(<Logs navigation={navigation} route={{
    params: {
      nodeId: 'B12'
    }
  }} />);
  expect(screen.getByText('26 September 2026')).toBeTruthy();
  await fireEvent.press(screen.getAllByText('Show on Map')[0]);
  expect(navigation.popTo).toHaveBeenCalledWith('Main', {
    screen: 'Map',
    params: {
      historyDate: '2026-09-26',
      historyNode: 'B12'
    }
  });
  expect(screen.queryByText(/A07 ·/)).toBeNull();
});

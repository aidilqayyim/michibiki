import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Nodes from './Nodes';
import { useMesh } from '../data/MeshProvider';
import { meshFixture } from '../test/meshFixture';
jest.mock('../data/MeshProvider', () => ({
  useMesh: jest.fn()
}));
test('refresh button reloads the detected nodes', async () => {
  const mesh = meshFixture();
  mesh.refresh.mockResolvedValue(undefined);
  useMesh.mockReturnValue(mesh);
  await render(<Nodes navigation={{ navigate: jest.fn() }} />);
  expect(screen.getByText('Nodes (4)')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Refresh nodes'));
  await waitFor(() => expect(mesh.refresh).toHaveBeenCalledTimes(1));
});

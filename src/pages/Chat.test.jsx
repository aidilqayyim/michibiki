import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Chat from './Chat';
import { ReadStateProvider } from '../data/readState';
import { useMesh } from '../data/MeshProvider';
import { meshFixture } from '../test/meshFixture';
jest.mock('../data/MeshProvider', () => ({
  useMesh: jest.fn()
}));
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true
}));
beforeEach(async () => {
  await AsyncStorage.clear();
});
function mockMesh(overrides = {}) {
  useMesh.mockReturnValue({
    ...meshFixture(),
    boundId: 'A07',
    channels: [{
      id: 'trail',
      name: 'Trail',
      memberIds: []
    }],
    messages: [{
      id: '1',
      sender_node_id: 'A07',
      channel_id: 'trail',
      body: 'Hello',
      sent_at: '2026-09-26T00:00:00Z'
    }],
    sendMessage: jest.fn().mockResolvedValue({}),
    createChannel: jest.fn(),
    ...overrides
  });
}
const navigation = {
  navigate: jest.fn()
};
test('bound device is labeled You and sends to the selected channel', async () => {
  mockMesh();
  const { sendMessage } = useMesh();
  await render(<ReadStateProvider><Chat navigation={navigation} /></ReadStateProvider>);
  expect(screen.getByText('You')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Message'), 'Meet at camp');
  await fireEvent.press(screen.getByText('Send'));
  await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({
    body: 'Meet at camp',
    channelId: 'trail',
    recipientId: null
  }));
  expect(screen.getByLabelText('Message').props.value).toBe('');
});
test('shows sending, then failed, and retries on tap', async () => {
  let reject;
  const sendMessage = jest.fn().mockImplementationOnce(() => new Promise((_, no) => {
    reject = no;
  })).mockResolvedValueOnce({});
  mockMesh({
    sendMessage
  });
  await render(<ReadStateProvider><Chat navigation={navigation} /></ReadStateProvider>);
  await fireEvent.changeText(screen.getByLabelText('Message'), 'Ping');
  await fireEvent.press(screen.getByText('Send'));
  expect(screen.getByText('Sending…')).toBeTruthy();
  reject(new Error('offline'));
  await waitFor(() => expect(screen.getByText('Failed to send · Tap to retry')).toBeTruthy());
  await fireEvent.press(screen.getByText('Ping'));
  await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByText('Ping')).toBeNull());
});
test('hides channels the bound device is not a member of', async () => {
  mockMesh({
    channels: [{
      id: 'trail',
      name: 'Trail',
      memberIds: ['B12']
    }, {
      id: 'camp',
      name: 'Camp',
      memberIds: ['A07', 'B12']
    }]
  });
  await render(<ReadStateProvider><Chat navigation={navigation} /></ReadStateProvider>);
  expect(screen.getByLabelText('Select channel').props.accessibilityValue.text).toBe('Camp');
});
test('creates a channel with the selected devices', async () => {
  const createChannel = jest.fn().mockResolvedValue({
    id: 'ridge-1',
    name: 'Ridge'
  });
  mockMesh({
    createChannel
  });
  await render(<ReadStateProvider><Chat navigation={navigation} /></ReadStateProvider>);
  await fireEvent.press(screen.getByLabelText('Create channel'));
  await fireEvent.changeText(screen.getByLabelText('Channel name'), 'Ridge');
  await fireEvent.press(screen.getByLabelText('Michibiki B12'));
  await fireEvent.press(screen.getByText('Create'));
  await waitFor(() => expect(createChannel).toHaveBeenCalledWith({
    name: 'Ridge',
    nodeIds: ['B12']
  }));
});
test('direct mode lists each device as its own chat', async () => {
  mockMesh({
    messages: [{
      id: '2',
      sender_node_id: 'B12',
      recipient_node_id: 'A07',
      channel_id: null,
      body: 'On my way',
      sent_at: '2026-09-26T01:00:00Z'
    }]
  });
  const { sendMessage } = useMesh();
  await render(<ReadStateProvider><Chat navigation={navigation} /></ReadStateProvider>);
  await fireEvent.press(screen.getByText('Direct'));
  expect(screen.getByLabelText('Chat with Michibiki B12')).toBeTruthy();
  expect(screen.getByLabelText('Chat with Relay R03')).toBeTruthy();
  expect(screen.queryByLabelText('Message')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Chat with Michibiki B12'));
  expect(screen.getByText('On my way')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Message'), 'See you');
  await fireEvent.press(screen.getByText('Send'));
  await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({
    body: 'See you',
    channelId: null,
    recipientId: 'B12'
  }));
});
test('messages sent from the bound device on another phone still count as mine', async () => {
  mockMesh({
    messages: [{
      id: '3',
      user_id: 'another-phone',
      sender_node_id: 'A07',
      recipient_node_id: 'B12',
      channel_id: null,
      body: 'Sent from my old phone',
      sent_at: '2026-09-26T01:00:00Z'
    }]
  });
  await render(<ReadStateProvider><Chat navigation={navigation} /></ReadStateProvider>);
  await fireEvent.press(screen.getByText('Direct'));
  expect(screen.getByText('You: Sent from my old phone')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Chat with Michibiki B12'));
  expect(screen.getByText('You')).toBeTruthy();
});

test('unread messages show dots until their conversation is opened', async () => {
  // Tracking started long ago, so the fixture messages count as new.
  await AsyncStorage.setItem('michibiki.read.A07', JSON.stringify({ since: 0, read: {} }));
  mockMesh({
    channels: [{ id: 'trail', name: 'Trail', memberIds: [] }, { id: 'camp', name: 'Camp', memberIds: [] }],
    messages: [
      { id: 'c1', sender_node_id: 'B12', channel_id: 'camp', body: 'Fire is lit', sent_at: '2026-09-26T01:00:00Z' },
      { id: 'd1', sender_node_id: 'C03', recipient_node_id: 'A07', channel_id: null, body: 'Need water', sent_at: '2026-09-26T02:00:00Z' },
      { id: 'd2', sender_node_id: 'A07', recipient_node_id: 'B12', channel_id: null, body: 'My own message', sent_at: '2026-09-26T02:00:00Z' }
    ]
  });
  await render(<ReadStateProvider><Chat navigation={navigation} /></ReadStateProvider>);
  // Trail is open, Camp is unread -> dot on Channels; C03 wrote directly -> dot on Direct.
  await waitFor(() => expect(screen.getAllByLabelText('Unread')).toHaveLength(2));
  await fireEvent.press(screen.getByText('Direct'));
  // Channels dot + Direct dot + the C03 chat row. B12 only has my own message, so no dot.
  expect(screen.getAllByLabelText('Unread')).toHaveLength(3);
  await fireEvent.press(screen.getByLabelText('Chat with Michibiki C03'));
  await fireEvent.press(screen.getByLabelText('Back to chats'));
  await waitFor(() => expect(screen.getAllByLabelText('Unread')).toHaveLength(1));
  await fireEvent.press(screen.getByText('Channels'));
  await fireEvent.press(screen.getByLabelText('Select channel'));
  await fireEvent.press(screen.getByText('Camp'));
  await waitFor(() => expect(screen.queryAllByLabelText('Unread')).toHaveLength(0));
  expect(JSON.parse(await AsyncStorage.getItem('michibiki.read.A07')).read).toEqual({
    'channel:camp': Date.parse('2026-09-26T01:00:00Z'),
    'direct:C03': Date.parse('2026-09-26T02:00:00Z')
  });
});

test('history from before read tracking started is not flagged unread', async () => {
  mockMesh({
    channels: [{ id: 'trail', name: 'Trail', memberIds: [] }, { id: 'camp', name: 'Camp', memberIds: [] }],
    messages: [{ id: 'old', sender_node_id: 'B12', channel_id: 'camp', body: 'Old news', sent_at: '2020-01-01T00:00:00Z' }]
  });
  await render(<ReadStateProvider><Chat navigation={navigation} /></ReadStateProvider>);
  await waitFor(async () => expect(await AsyncStorage.getItem('michibiki.read.A07')).not.toBeNull());
  expect(screen.queryAllByLabelText('Unread')).toHaveLength(0);
});

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMesh } from './MeshProvider';

// Per-device read markers, kept on this phone: { since, read: { [conversationKey]: lastReadMs } }.
// `since` is when tracking started, so history that existed before is not flagged as unread.
const storageKey = boundId => 'michibiki.read.' + (boundId || 'none');

export const channelKey = channelId => 'channel:' + channelId;
export const directKey = peerId => 'direct:' + peerId;

// A channel with no members is open to every device.
export const isChannelVisible = (channel, boundId) => !channel.memberIds?.length || channel.memberIds.includes(boundId);

export function conversationKey(message, boundId) {
  if (message.channel_id) return channelKey(message.channel_id);
  if (message.recipient_node_id === boundId) return directKey(message.sender_node_id);
  return null;
}

const ReadStateContext = createContext(null);

export function useReadState() {
  const value = useContext(ReadStateContext);
  if (!value) throw new Error('ReadStateProvider is missing.');
  return value;
}

// Shared by the Messages screen and the navbar so both agree on what is unread.
export function ReadStateProvider({ children }) {
  const { boundId, messages, channels, nodes } = useMesh();
  const key = storageKey(boundId);
  const [state, setState] = useState(null);

  useEffect(() => {
    let active = true;
    setState(null);
    const fresh = () => ({ since: Date.now(), read: {} });
    AsyncStorage.getItem(key).then(raw => {
      let saved = null;
      try {
        saved = JSON.parse(raw);
      } catch {}
      if (!saved || typeof saved.since !== 'number') {
        saved = fresh();
        AsyncStorage.setItem(key, JSON.stringify(saved)).catch(() => {});
      }
      if (active) setState(saved);
    }).catch(() => {
      if (active) setState(fresh());
    });
    return () => {
      active = false;
    };
  }, [key]);

  const markRead = useCallback((conversation, time) => {
    setState(previous => {
      if (!previous || !(time > (previous.read[conversation] || previous.since))) return previous;
      const next = { ...previous, read: { ...previous.read, [conversation]: time } };
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [key]);

  // Unread counts per conversation, limited to channels this device can see and devices it can message.
  const unread = useMemo(() => {
    const counts = {};
    if (!state) return counts;
    const known = new Set([
      ...channels.filter(channel => isChannelVisible(channel, boundId)).map(channel => channelKey(channel.id)),
      ...nodes.filter(node => node.id !== boundId).map(node => directKey(node.id)),
    ]);
    for (const message of messages) {
      if (message.sender_node_id === boundId) continue;
      const conversation = conversationKey(message, boundId);
      if (!conversation || !known.has(conversation)) continue;
      if (Date.parse(message.sent_at) > (state.read[conversation] || state.since)) counts[conversation] = (counts[conversation] || 0) + 1;
    }
    return counts;
  }, [state, messages, channels, nodes, boundId]);

  const value = useMemo(() => ({
    markRead,
    unread,
    anyUnread: Object.keys(unread).length > 0,
  }), [markRead, unread]);

  return <ReadStateContext.Provider value={value}>{children}</ReadStateContext.Provider>;
}

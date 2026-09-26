import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useMesh } from '../data/MeshProvider';
import { useReadState, channelKey, directKey, isChannelVisible } from '../data/readState';
import { Screen, Button, Input, Note, Icon, s, colors, useKeyboardVisible } from '../ui';

function timeLabel(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString();
}

// Identity is the device, not the phone: any phone bound to boundId sees its messages as its own.
function isDirectBetween(message, boundId, peerId) {
  return !message.channel_id && (
    (message.sender_node_id === boundId && message.recipient_node_id === peerId)
    || (message.sender_node_id === peerId && message.recipient_node_id === boundId)
  );
}

function Avatar({ node, size = 48 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: node?.color || '#4ade80' }]}>
      <Text style={styles.avatarText}>{node?.id}</Text>
    </View>
  );
}

function Bubble({ own, author, body, time, status, onRetry, onDiscard }) {
  const failed = status === 'failed';
  const statusText = status === 'sending' ? 'Sending…' : failed ? 'Failed to send · Tap to retry' : 'Sent';
  return (
    <Pressable
      disabled={!failed}
      accessibilityHint={failed ? 'Retries sending. Long press to discard.' : undefined}
      onPress={onRetry}
      onLongPress={onDiscard}
      style={[styles.bubble, own ? styles.ownBubble : styles.otherBubble, failed && styles.failedBubble]}
    >
      <Text style={[styles.author, { color: own ? colors.green : colors.blue }]}>{author}</Text>
      <Text style={[s.text, { marginVertical: 6 }]}>{body}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{time}</Text>
        {own && (
          <View style={styles.status}>
            {status === 'sent' && <Icon name="check" size={12} color={colors.green} />}
            <Text style={[styles.metaText, failed && { color: '#ff999f' }]}>{statusText}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function UnreadDot({ style }) {
  return <View accessibilityLabel="Unread" style={[styles.unreadDot, style]} />;
}

function ChannelPicker({ visible, channels, selected, unread, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.modal} onPress={() => {}}>
          <Text style={[s.title, { fontSize: 22 }]}>Channels</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {channels.map(channel => (
              <Pressable
                key={channel.id}
                accessibilityRole="button"
                accessibilityState={{ selected: channel.id === selected }}
                onPress={() => onSelect(channel.id)}
                style={({ pressed }) => [styles.option, (pressed || channel.id === selected) && { backgroundColor: '#253c57' }]}
              >
                <Text style={[s.text, { flex: 1 }]}>{channel.name}</Text>
                {!!unread[channelKey(channel.id)] && <UnreadDot style={styles.inlineDot} />}
                {channel.id === selected && <Icon name="check" size={18} />}
              </Pressable>
            ))}
          </ScrollView>
          <Button title="Close" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CreateChannelDialog({ visible, nodes, boundId, onCreate, onClose }) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function close() {
    if (saving) return;
    setName('');
    setPicked([]);
    setError('');
    onClose();
  }

  function toggle(nodeId) {
    setPicked(current => current.includes(nodeId) ? current.filter(id => id !== nodeId) : [...current, nodeId]);
  }

  async function create() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await onCreate({ name, nodeIds: picked });
      setName('');
      setPicked([]);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const ready = !!name.trim() && (!!boundId || picked.length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={[s.title, { fontSize: 22 }]}>New channel</Text>
            <Input
              accessibilityLabel="Channel name"
              placeholder="Channel name"
              maxLength={60}
              value={name}
              onChangeText={setName}
              editable={!saving}
            />
            <Text style={s.muted}>Devices to add</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {nodes.map(node => {
                const own = node.id === boundId;
                const checked = own || picked.includes(node.id);
                return (
                  <Pressable
                    key={node.id}
                    accessibilityRole="checkbox"
                    accessibilityLabel={node.name}
                    accessibilityState={{ checked, disabled: own || saving }}
                    disabled={own || saving}
                    onPress={() => toggle(node.id)}
                    style={({ pressed }) => [styles.option, pressed && { backgroundColor: '#ffffff12' }]}
                  >
                    <Avatar node={node} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.text}>{node.name}</Text>
                      {own && <Text style={s.muted}>This device</Text>}
                    </View>
                    <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                      {checked && <Icon name="check" size={16} color="#000" />}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Note error>{error}</Note>
            <View style={s.row}>
              <Button title="Cancel" disabled={saving} onPress={close} style={{ flex: 1, backgroundColor: '#2c2c2e' }} />
              <Button title={saving ? 'Creating…' : 'Create'} disabled={saving || !ready} onPress={create} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Chat({ navigation }) {
  const { channels, messages, nodes, boundId, sendMessage, createChannel } = useMesh();
  const keyboardVisible = useKeyboardVisible();
  const focused = useIsFocused();
  const { markRead, unread } = useReadState();
  const [mode, setMode] = useState('channel');
  const [channelId, setChannelId] = useState('');
  const [peerId, setPeerId] = useState(null);
  const [body, setBody] = useState('');
  const [pending, setPending] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const scroller = useRef(null);
  const pendingCounter = useRef(0);

  const visibleChannels = channels.filter(c => isChannelVisible(c, boundId));
  const channel = visibleChannels.find(c => c.id === channelId) || visibleChannels[0];
  const peers = nodes.filter(n => n.id !== boundId);
  const peer = peers.find(n => n.id === peerId);
  const nodeName = id => nodes.find(n => n.id === id)?.name || id;

  const target = mode === 'channel'
    ? channel && { channelId: channel.id, recipientId: null }
    : peer && { channelId: null, recipientId: peer.id };
  const matchesTarget = item => target && (target.channelId
    ? item.channelId === target.channelId
    : item.recipientId === target.recipientId);
  const conversation = !target ? [] : messages.filter(m => target.channelId
    ? m.channel_id === target.channelId
    : isDirectBetween(m, boundId, target.recipientId));
  const conversationPending = pending.filter(matchesTarget);

  const openKey = target && (target.channelId ? channelKey(target.channelId) : directKey(target.recipientId));
  const hasUnread = key => !!unread[key] && key !== openKey;
  const channelsUnread = visibleChannels.some(c => hasUnread(channelKey(c.id)));
  const directUnread = peers.some(n => hasUnread(directKey(n.id)));

  // The open conversation counts as read while it is on screen.
  const latest = conversation.reduce((max, m) => Math.max(max, Date.parse(m.sent_at) || 0), 0);
  useEffect(() => {
    if (focused && openKey && latest) markRead(openKey, latest);
  }, [focused, openKey, latest, markRead]);

  function updatePending(key, changes) {
    setPending(current => current.map(item => item.key === key ? { ...item, ...changes } : item));
  }

  async function deliver(item) {
    updatePending(item.key, { status: 'sending' });
    try {
      await sendMessage({ body: item.body, channelId: item.channelId, recipientId: item.recipientId });
      setPending(current => current.filter(p => p.key !== item.key));
    } catch (e) {
      updatePending(item.key, { status: 'failed', error: e.message });
    }
  }

  function submit() {
    if (!body.trim() || !target || !boundId) return;
    const item = {
      key: 'pending-' + ++pendingCounter.current,
      body: body.trim(),
      ...target,
      sent_at: new Date().toISOString(),
      status: 'sending',
    };
    setPending(current => [...current, item]);
    setBody('');
    deliver(item);
  }

  const directList = mode === 'direct' && !peer;
  const directChats = peers
    .map(node => {
      const thread = messages.filter(m => isDirectBetween(m, boundId, node.id));
      return { node, last: thread[thread.length - 1] };
    })
    .sort((a, b) => (b.last?.sent_at || '').localeCompare(a.last?.sent_at || '') || a.node.name.localeCompare(b.node.name));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Screen title="Messages" scroll={false} contentStyle={keyboardVisible && { paddingBottom: 12 }}>
        <View style={s.row}>
          {[['channel', 'Channels', channelsUnread], ['direct', 'Direct', directUnread]].map(([id, title, dot]) => (
            <View key={id} style={{ flex: 1 }}>
              <Button
                title={title}
                style={{ backgroundColor: mode === id ? '#253c57' : '#1c1c1e' }}
                onPress={() => {
                  setMode(id);
                  setPeerId(null);
                }}
              />
              {dot && <UnreadDot style={styles.cornerDot} />}
            </View>
          ))}
        </View>

        {mode === 'channel' && (
          <View style={[s.row, { marginTop: 14 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select channel"
              accessibilityValue={{ text: channel?.name || 'None' }}
              disabled={!visibleChannels.length}
              onPress={() => setPickerOpen(true)}
              style={({ pressed }) => [styles.dropdown, pressed && { opacity: 0.6 }]}
            >
              <Text numberOfLines={1} style={[s.text, { flex: 1 }]}>{channel?.name || 'No channels yet'}</Text>
              <Icon name="chevron-down" size={20} color={colors.muted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create channel"
              onPress={() => setCreateOpen(true)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            >
              <Icon name="plus" size={22} />
            </Pressable>
          </View>
        )}

        {mode === 'direct' && peer && (
          <View style={[s.row, { marginTop: 14 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to chats"
              onPress={() => setPeerId(null)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            >
              <Icon name="back" size={22} />
            </Pressable>
            <Avatar node={peer} size={40} />
            <Text numberOfLines={1} style={[s.text, { flex: 1, fontWeight: '700' }]}>{peer.name}</Text>
          </View>
        )}

        <ScrollView
          ref={scroller}
          style={{ flex: 1, marginTop: 12 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => { if (!directList) scroller.current?.scrollToEnd({ animated: false }); }}
        >
          {directList ? (
            <>
              {directChats.map(({ node, last }, index) => (
                <Pressable
                  key={node.id}
                  accessibilityRole="button"
                  accessibilityLabel={'Chat with ' + node.name}
                  onPress={() => setPeerId(node.id)}
                  style={({ pressed }) => [styles.chatRow, index > 0 && styles.separator, pressed && { backgroundColor: '#ffffff0d' }]}
                >
                  <Avatar node={node} />
                  <View style={{ flex: 1 }}>
                    <View style={s.between}>
                      <Text numberOfLines={1} style={[s.text, { flex: 1, fontWeight: '700' }]}>{node.name}</Text>
                      {last && <Text style={[styles.metaText, hasUnread(directKey(node.id)) && { color: colors.blue }]}>{timeLabel(last.sent_at)}</Text>}
                    </View>
                    <View style={s.between}>
                      <Text numberOfLines={1} style={[s.muted, { marginTop: 2, flex: 1 }, hasUnread(directKey(node.id)) && { color: '#fff', fontWeight: '600' }]}>
                        {last ? (last.sender_node_id === boundId ? 'You: ' : '') + last.body : ''}
                      </Text>
                      {hasUnread(directKey(node.id)) && <UnreadDot style={styles.inlineDot} />}
                    </View>
                  </View>
                </Pressable>
              ))}
              {!directChats.length && <Note>No other devices found.</Note>}
            </>
          ) : (
            <>
              <Note>Messages are saved online. LoRa transmission is not connected yet.</Note>
              {conversation.map(m => {
                const own = m.sender_node_id === boundId;
                return (
                  <Bubble
                    key={m.id}
                    own={own}
                    author={own ? 'You' : nodeName(m.sender_node_id)}
                    body={m.body}
                    time={timeLabel(m.sent_at)}
                    status="sent"
                  />
                );
              })}
              {conversationPending.map(item => (
                <Bubble
                  key={item.key}
                  own
                  author="You"
                  body={item.body}
                  time={timeLabel(item.sent_at)}
                  status={item.status}
                  onRetry={() => deliver(item)}
                  onDiscard={() => setPending(current => current.filter(p => p.key !== item.key))}
                />
              ))}
              {!conversation.length && !conversationPending.length && (
                <Note>{mode === 'channel' && !channel ? 'Create a channel to start chatting.' : 'No messages in this conversation.'}</Note>
              )}
            </>
          )}
        </ScrollView>

        {!directList && (
          boundId ? (
            <View style={[s.row, styles.composer]}>
              <Input
                accessibilityLabel="Message"
                placeholder="Write a message…"
                multiline
                maxLength={1000}
                value={body}
                onChangeText={setBody}
                editable={!!target}
                style={{ flex: 1, maxHeight: 120 }}
              />
              <Button title="Send" icon="send" disabled={!target || !body.trim()} onPress={submit} />
            </View>
          ) : (
            <Button title="Connect a device to send" style={styles.composer} onPress={() => navigation.navigate('Connect')} />
          )
        )}
      </Screen>

      <ChannelPicker
        visible={pickerOpen}
        channels={visibleChannels}
        selected={channel?.id}
        unread={Object.fromEntries(Object.keys(unread).filter(hasUnread).map(key => [key, unread[key]]))}
        onSelect={id => {
          setChannelId(id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
      <CreateChannelDialog
        visible={createOpen}
        nodes={nodes}
        boundId={boundId}
        onCreate={async input => {
          const created = await createChannel(input);
          setChannelId(created.id);
        }}
        onClose={() => setCreateOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#000', fontSize: 13, fontWeight: '800' },
  bubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginBottom: 10 },
  ownBubble: { alignSelf: 'flex-end', backgroundColor: '#163e2b', borderBottomRightRadius: 6 },
  otherBubble: { alignSelf: 'flex-start', backgroundColor: '#252529', borderBottomLeftRadius: 6 },
  failedBubble: { borderWidth: 1, borderColor: '#ff999f80' },
  author: { fontSize: 12, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  metaText: { color: colors.muted, fontSize: 11 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dropdown: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, backgroundColor: colors.card, paddingHorizontal: 16 },
  iconButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#15243a', alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: '#ffffff40', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.green, borderColor: colors.green },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 4 },
  separator: { borderTopWidth: 1, borderTopColor: '#ffffff1a' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3b82f6' },
  cornerDot: { position: 'absolute', top: 6, left: 8, borderWidth: 2, borderColor: '#000' },
  inlineDot: { marginLeft: 8 },
  composer: { marginTop: 10 },
});

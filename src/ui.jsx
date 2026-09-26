import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export const colors = {
  bg: '#000000',
  card: '#1c1c1e',
  muted: '#99999f',
  blue: '#79aaff',
  purple: '#ab78ff',
  green: '#73e69b',
};

const paths = {
  lock: 'M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Zm1 0V7a4 4 0 0 1 8 0v4',
  unlock: 'M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Zm1 0V7a4 4 0 0 1 7.2-2.4',
  clock: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM12 8v4l3 2',
  signal: 'M5 18v-3M10 18v-6M15 18v-9M20 18v-12',
  battery: 'M4 7h13a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm17 3v4M5 10v4m3-4v4m3-4v4m3-4v4',
  bluetooth: 'm7 7 10 10-5 4V3l5 4L7 17',
  crosshair: 'M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM12 2v3m0 14v3M2 12h3m14 0h3',
  list: 'M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM12 6h8M12 12h8M12 18h8',
  search: 'M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm2 9-4-4',
  info: 'M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  book: 'M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1m0-15c3-2 7-2 10-1v15c-3-1-7-1-10 1V5Z',
  radio: 'M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14M8 8a6 6 0 0 0 0 8M16 8a6 6 0 0 1 0 8M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  disc: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  smartphone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm5 16v.01',
  chevron: 'm9 5 7 7-7 7',
  chat: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z',

  nodes: 'M8 3v3m8-3v3M8 10h8M8 14h5M9 21h6',

  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5m6-2v16m6-14v16',

  connect:
    'm10 13 4-4m-6 7-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',

  'radio-tower':
    'M12 14v7M9 21h6M8.5 10.5a5 5 0 0 0 0 7M15.5 10.5a5 5 0 0 1 0 7M5.5 7.5a9 9 0 0 0 0 13M18.5 7.5a9 9 0 0 1 0 13',

  settings:
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z',

  logs: 'M7 6h10M7 10h10M7 14h7M7 18h5',

  location: 'm21 3-7 18-3-8-8-3 18-7Z',

  warning: 'm12 3 10 18H2L12 3Zm0 6v5m0 3v1',

  close: 'm6 6 12 12M6 18 18 6',

  send: 'm22 2-7 20-4-9-9-4 20-7ZM11 13 22 2',

  back: 'm14 5-7 7 7 7',

  refresh: 'M20 7V2l-3 3a8 8 0 1 0 3 12M20 7h-5',

  plus: 'M12 5v14M5 12h14',

  check: 'm5 12 5 5 9-10',

  'chevron-down': 'm6 9 6 6 6-6',

  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m4.3 13a1.94 1.94 0 0 0 3.4 0',

  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',

  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',

  'cloud-sun': 'M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.95 12.65a4 4 0 0 0-5.93-4.13M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z',

  cloud: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z',

  'cloud-fog': 'M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24M16 17H7m10 4H9',

  'cloud-drizzle': 'M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24M8 19v1m0-6v1m8 4v1m0-6v1m-4 6v1m0-6v1',

  'cloud-rain': 'M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24M16 14v6m-8-6v6m4-4v6',

  'cloud-snow': 'M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01',

  'cloud-lightning': 'M6 16.33A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.97M13 12l-3 5h4l-3 5',
};

// The floating navbar reserves space at the bottom of each screen; while typing it is hidden,
// so screens use this to drop that reserved space.
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

export function Icon({
  name,
  size = 23,
  color = colors.blue,
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'nodes' && (
        <Rect
          x="5"
          y="6"
          width="14"
          height="13"
          rx="3"
        />
      )}

      {name === 'settings' && (
        <Circle
          cx="12"
          cy="12"
          r="3"
        />
      )}

      {name === 'logs' && (
        <Rect
          x="3"
          y="2"
          width="18"
          height="20"
          rx="2"
        />
      )}

      {name === 'radio-tower' && (
        <Circle
          cx="12"
          cy="12"
          r="2"
        />
      )}

      <Path d={paths[name] || paths.nodes} />
    </Svg>
  );
}

export function Button({
  title,
  onPress,
  icon,
  disabled = false,
  danger = false,
  style,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        danger && {
          backgroundColor: '#512329',
        },
        (disabled || pressed) && {
          opacity: 0.45,
        },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          color={danger ? '#ff9298' : colors.blue}
        />
      )}

      <Text
        style={[
          s.buttonText,
          danger && {
            color: '#ff9298',
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Screen({
  children,
  title,
  right,
  centeredTitle = false,
  scroll = true,
  contentStyle,
}) {
  const insets = useSafeAreaInsets();

  const content = (
    <>
      {centeredTitle ? <View style={[s.between, { paddingTop: 18 }]}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#171717', borderWidth: 1, borderColor: '#ffffff1a', alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={35} height={35} viewBox="0 0 40 40" fill="none" stroke={colors.green} strokeWidth={3} strokeLinecap="round"><Path d="M5 30 17 9M17 30 28 11 38 30" /></Svg>
        </View>
        <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit style={[s.title, { flex: 1, textAlign: 'center', fontSize: 26 }]}>{title}</Text>
        {right}
      </View> : <View style={s.header}>
        <View>
          <Text style={s.brand}>
            ╱╲ MICHIBIKI
          </Text>

          <Text style={s.title}>
            {title}
          </Text>
        </View>

        {right}
      </View>}

      {children}
    </>
  );

  return (
    <View
      style={[
        s.screen,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.content, contentStyle]}
        >
          {content}
        </ScrollView>
      ) : (
        <View
          style={[
            s.content,
            {
              flex: 1,
            },
            contentStyle,
          ]}
        >
          {content}
        </View>
      )}
    </View>
  );
}

export function Input(props) {
  return (
    <TextInput
      placeholderTextColor="#77777f"
      {...props}
      style={[
        s.input,
        props.style,
      ]}
    />
  );
}

export function Note({
  children,
  error = false,
}) {
  return children ? (
    <Text
      accessibilityRole={
        error ? 'alert' : undefined
      }
      style={[
        s.note,
        error && {
          color: '#ff999f',
        },
      ]}
    >
      {children}
    </Text>
  ) : null;
}

export const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    width: '100%',
    maxWidth: 880,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 115,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },

  brand: {
    color: colors.green,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 15,
    fontWeight: '700',
  },

  title: {
    color: 'white',
    fontSize: 36,
    fontWeight: '900',
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    gap: 10,
  },

  text: {
    color: '#f4f4f7',
    fontSize: 16,
  },

  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  button: {
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#15243a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '600',
  },

  input: {
    color: 'white',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    minHeight: 48,
  },

  note: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginVertical: 12,
  },

  chip: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: colors.card,
    marginRight: 8,
  },

  overlay: {
    flex: 1,
    backgroundColor: '#000a',
    justifyContent: 'center',
    padding: 24,
  },

  modal: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 24,
    gap: 16,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
});

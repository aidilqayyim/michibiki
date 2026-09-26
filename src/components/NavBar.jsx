import React, { useEffect, useRef, useState } from "react";
import { View, Pressable, Animated, AccessibilityInfo, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

import { Icon, colors, useKeyboardVisible, Text } from "../ui";
import { useReadState } from "../data/readState";

// Each tab gets a fixed-width slot; the bar is as wide as its tabs (and shrinks on narrow screens).
const ITEM_WIDTH = 100;
const BAR_PADDING = 6;

const icons = {
  Chat: "chat",
  Nodes: "nodes",
  Map: "map",
  Connect: "radio-tower",
  Settings: "settings",
};

export default function NavBar({ state, navigation }) {
  const inset = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const { anyUnread } = useReadState();

  const scale = useRef(new Animated.Value(1)).current;
  const position = useRef(new Animated.Value(state.index)).current;

  const [width, setWidth] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const currentRoute = state.routes[state.index]?.name;
  const isMapPage = currentRoute === "Map";

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      position.setValue(state.index);
      return;
    }

    Animated.timing(position, {
      toValue: state.index,
      duration: 230,
      useNativeDriver: true,
    }).start();
  }, [state.index, position, reducedMotion]);

  const handleNavPress = (route) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (event.defaultPrevented) {
      return;
    }

    navigation.navigate(route.name);

    if (reducedMotion) {
      return;
    }

    scale.stopAnimation();
    scale.setValue(1);

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.035,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Hidden while typing so it never floats above the keyboard or pushes inputs up.
  if (keyboardVisible) return null;

  const horizontalPadding = BAR_PADDING;

  const availableWidth =
    width > 0 ? width - horizontalPadding * 2 : 0;

  const itemWidth =
    availableWidth > 0
      ? availableWidth / state.routes.length
      : 0;

  const translateX =
    itemWidth > 0
      ? Animated.multiply(position, itemWidth)
      : 0;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: Math.max(inset.bottom, 30),
        },
      ]}
    >
      <Animated.View
        onLayout={(event) => {
          setWidth(event.nativeEvent.layout.width);
        }}
        style={[
          styles.navbarOuter,
          {
            width: state.routes.length * ITEM_WIDTH + BAR_PADDING * 2,
            transform: [{ scale }],
          },
        ]}
      >
        <BlurView
          intensity={isMapPage ? 10 : 20}
          tint="light"
          style={StyleSheet.absoluteFill}
        />

        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isMapPage
                ? "rgba(255,255,255,0.55)"
                : "rgba(255,255,255,0.55)",
            },
          ]}
        />

        {width > 0 && (
          <View
            pointerEvents="none"
            style={styles.highlightContainer}
          >
            <Animated.View
              style={[
                styles.activeHighlight,
                {
                  width: itemWidth,
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
        )}

        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const unreadDot = route.name === "Chat" && anyUnread;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={route.name + (unreadDot ? ", unread messages" : "")}
              accessibilityState={{
                selected: isActive,
              }}
              onPress={() => handleNavPress(route)}
              style={({ pressed }) => [
                styles.navItem,
                !isActive &&
                  pressed && {
                    backgroundColor:
                      "rgba(43,33,24,0.06)",
                  },
              ]}
            >
              <View style={styles.iconContainer}>
                <Icon
                  name={icons[route.name] ?? "settings"}
                  color={
                    isActive
                      ? colors.blue
                      : colors.muted
                  }
                  size={25}
                />
                {unreadDot && <View testID="chat-unread-dot" style={styles.unreadDot} />}
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: isActive
                      ? colors.blue
                      : colors.muted,
                  },
                ]}
              >
                {route.name}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",

    left: 24,
    right: 24,

    alignItems: "center",

    zIndex: 50,
    elevation: 50,
  },

  navbarOuter: {
    maxWidth: "100%",

    minHeight: 70,

    flexDirection: "row",

    padding: 6,

    borderRadius: 999,

    borderWidth: 1,
    borderColor: colors.border,

    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 16,

    elevation: 12,
  },

  highlightContainer: {
    position: "absolute",

    left: 6,
    right: 6,
    top: 6,
    bottom: 6,

    flexDirection: "row",
  },

  activeHighlight: {
    height: "100%",

    borderRadius: 27,

    backgroundColor: colors.blueSoft,
  },

  navItem: {
    flex: 1,

    minWidth: 0,
    minHeight: 48,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 27,

    zIndex: 2,
  },

  iconContainer: {
    width: 0,
    height: 34,

    alignItems: "center",
    justifyContent: "center",

    overflow: "visible",
  },

  unreadDot: {
    position: "absolute",
    top: 1,
    left: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  label: {
    marginTop: 1,

    fontSize: 12,
    fontWeight: "500",

    letterSpacing: 0.3,

    textAlign: "center",
  },
});
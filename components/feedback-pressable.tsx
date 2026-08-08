import * as Haptics from "expo-haptics";
import { useRef } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

type HapticStyle = "light" | "selection" | "success" | "warning" | "none";

type FeedbackPressableProps = Omit<PressableProps, "style"> & {
    haptic?: HapticStyle;
    style?: PressableProps["style"];
    wrapperStyle?: StyleProp<ViewStyle>;
  };

export default function FeedbackPressable({
  children,
  disabled,
  haptic = "selection",
  onPress,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  style,
  wrapperStyle,
  ...props
}: FeedbackPressableProps) {
  const reduceMotion = useReducedMotion();
  const isHovered = useRef(false);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function playHaptic() {
    if (process.env.EXPO_OS !== "ios" || haptic === "none") return;
    if (haptic === "success" || haptic === "warning") {
      void Haptics.notificationAsync(
        haptic === "success" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );
      return;
    }
    void (haptic === "light"
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.selectionAsync());
  }

  return (
    <Animated.View style={[wrapperStyle, animatedStyle]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPress={(event) => {
          playHaptic();
          onPress?.(event);
        }}
        onPressIn={(event) => {
          if (!disabled && !reduceMotion) scale.value = withTiming(0.975, { duration: 90 });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          if (!reduceMotion) scale.value = withTiming(isHovered.current ? 1.02 : 1, { duration: 140 });
          onPressOut?.(event);
        }}
        onHoverIn={(event) => {
          isHovered.current = true;
          if (!disabled && !reduceMotion && process.env.EXPO_OS === "web") {
            scale.value = withTiming(1.02, { duration: 160 });
          }
          onHoverIn?.(event);
        }}
        onHoverOut={(event) => {
          isHovered.current = false;
          if (!reduceMotion && process.env.EXPO_OS === "web") {
            scale.value = withTiming(1, { duration: 180 });
          }
          onHoverOut?.(event);
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

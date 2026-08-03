import * as Haptics from "expo-haptics";
import type { PropsWithChildren } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

type HapticStyle = "light" | "selection" | "success" | "warning" | "none";

type FeedbackPressableProps = PropsWithChildren<
  Omit<PressableProps, "style"> & {
    haptic?: HapticStyle;
    style?: StyleProp<ViewStyle>;
    wrapperStyle?: StyleProp<ViewStyle>;
  }
>;

export default function FeedbackPressable({
  children,
  disabled,
  haptic = "selection",
  onPress,
  onPressIn,
  onPressOut,
  style,
  wrapperStyle,
  ...props
}: FeedbackPressableProps) {
  const reduceMotion = useReducedMotion();
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
          if (!reduceMotion) scale.value = withTiming(1, { duration: 120 });
          onPressOut?.(event);
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

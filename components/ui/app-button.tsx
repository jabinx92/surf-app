import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import FeedbackPressable from "@/components/feedback-pressable";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";

type AppButtonProps = {
  children: ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet";
  size?: "md" | "lg";
  arrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ children, onPress, variant = "primary", size = "md", arrow = false, loading = false, disabled = false, accessibilityHint, style }: AppButtonProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const labelColor = variant === "primary" ? theme.colors.onAccent : theme.colors.text;

  return (
    <FeedbackPressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled }}
      disabled={disabled || loading}
      haptic="light"
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.base,
        size === "lg" && styles.large,
        styles[variant],
        (hovered || pressed) && styles[`${variant}Active`],
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.row}>
          <Text style={[styles.label, size === "lg" && styles.labelLarge, { color: labelColor }]}>{children}</Text>
          {arrow ? <IconSymbol color={labelColor} name="arrow.right" size={18} /> : null}
        </View>
      )}
    </FeedbackPressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    base: { alignItems: "center", borderCurve: "continuous", borderRadius: theme.radius.md, borderWidth: 1.5, justifyContent: "center", minHeight: 48, paddingHorizontal: 18 },
    large: { minHeight: 56, paddingHorizontal: 24 },
    primary: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    primaryActive: { backgroundColor: theme.colors.accentPressed, borderColor: theme.colors.accentPressed },
    secondary: { backgroundColor: "transparent", borderColor: theme.colors.borderStrong },
    secondaryActive: { backgroundColor: theme.colors.surface },
    quiet: { backgroundColor: "transparent", borderColor: "transparent", paddingHorizontal: 4 },
    quietActive: { opacity: 0.7 },
    disabled: { opacity: 0.5 },
    row: { alignItems: "center", flexDirection: "row", gap: 8 },
    label: { fontSize: 15, fontWeight: "700" },
    labelLarge: { fontSize: 16 },
  });
}

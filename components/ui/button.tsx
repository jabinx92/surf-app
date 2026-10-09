import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

type ButtonVariant = "default" | "outline" | "ghost";

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
};

export function Button({ children, disabled, loading = false, style, variant = "default", ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "default" ? "#ffffff" : "#0f766e"} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
  },
  default: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  outline: { backgroundColor: "#ffffff", borderColor: "#d4d4d8" },
  ghost: { backgroundColor: "transparent", borderColor: "transparent" },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
  label: { fontSize: 15, fontWeight: "600" },
  defaultLabel: { color: "#ffffff" },
  outlineLabel: { color: "#18181b" },
  ghostLabel: { color: "#0f766e" },
});

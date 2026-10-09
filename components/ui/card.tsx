import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
    padding: 28,
  },
});

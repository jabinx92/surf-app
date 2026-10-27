import { Image, type ImageSource } from "expo-image";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useAppTheme } from "@/lib/app-theme";

type PhotoPlaceholderProps = {
  // Pass a real photo here once we have one (with the photographer's permission).
  source?: ImageSource | string | number | null;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// Until real surf photos are added, this draws a simple horizon: sky, sea, deep water.
export function PhotoPlaceholder({ source, accessibilityLabel, style, children }: PhotoPlaceholderProps) {
  const theme = useAppTheme();
  const [sky, sea, deep] = theme.colors.photo;

  return (
    <View style={[styles.frame, { backgroundColor: deep, borderRadius: theme.radius.lg }, style]}>
      {source ? (
        <Image accessibilityLabel={accessibilityLabel} contentFit="cover" source={source} style={StyleSheet.absoluteFill} transition={200} />
      ) : (
        <View accessible={false} style={StyleSheet.absoluteFill}>
          <View style={[styles.band, { backgroundColor: sky, flex: 4 }]} />
          <View style={[styles.band, { backgroundColor: sea, flex: 3 }]} />
          <View style={[styles.band, { backgroundColor: deep, flex: 3 }]} />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderCurve: "continuous", overflow: "hidden" },
  band: { width: "100%" },
});

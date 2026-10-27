import { Image, type ImageSource } from "expo-image";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useFocusCrop, type Focus } from "@/components/ui/focus-crop";
import { useAppTheme } from "@/lib/app-theme";

type PhotoPlaceholderProps = {
  // Pass a real photo here once we have one (with the photographer's permission).
  source?: ImageSource | string | number | null;
  // Width ÷ height of the photo, and where its subject is, so cropping never cuts the subject out.
  aspect?: number;
  focus?: Focus;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// Until real surf photos are added, this draws a simple horizon: sky, sea, deep water.
export function PhotoPlaceholder({ source, aspect, focus, accessibilityLabel, style, children }: PhotoPlaceholderProps) {
  const theme = useAppTheme();
  const [sky, sea, deep] = theme.colors.photo;
  const crop = useFocusCrop(aspect ?? 1, focus);

  return (
    <View onLayout={crop.onLayout} style={[styles.frame, { backgroundColor: deep, borderRadius: theme.radius.lg }, style]}>
      {source ? (
        <Image accessibilityLabel={accessibilityLabel} contentFit="cover" source={source} style={aspect ? crop.style : StyleSheet.absoluteFill} transition={200} />
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

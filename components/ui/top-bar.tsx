import { router } from "expo-router";
import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import FeedbackPressable from "@/components/feedback-pressable";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";

type TopBarProps = {
  // Show a Back button instead of the WaveLens brand.
  back?: boolean | string;
  right?: ReactNode;
};

export function TopBar({ back = false, right }: TopBarProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.bar}>
      {back ? (
        <FeedbackPressable accessibilityRole="button" haptic="none" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={styles.back}>
          <IconSymbol color={theme.colors.text} name="chevron.left" size={22} />
          <Text style={styles.backText}>{typeof back === "string" ? back : "Back"}</Text>
        </FeedbackPressable>
      ) : (
        <FeedbackPressable accessibilityLabel="WaveLens home" accessibilityRole="link" haptic="none" onPress={() => router.push("/")} style={styles.brand}>
          <Image source={require("@/assets/images/wavelens-icon.png")} style={styles.brandMark} />
          <Text style={styles.brandName}>WaveLens</Text>
        </FeedbackPressable>
      )}
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    bar: { alignItems: "center", flexDirection: "row", gap: 12, justifyContent: "space-between", minHeight: 64 },
    back: { alignItems: "center", flexDirection: "row", gap: 2, marginLeft: -6, minHeight: 44, paddingRight: 12 },
    backText: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
    brand: { alignItems: "center", flexDirection: "row", gap: 9, minHeight: 44 },
    brandMark: { borderRadius: theme.radius.sm, height: 30, width: 30 },
    brandName: {
      color: theme.colors.text,
      fontSize: 19,
      ...(theme.name === "sport" ? { fontStyle: "italic" as const, fontWeight: "900" as const, letterSpacing: -0.2, textTransform: "uppercase" as const } : { fontWeight: "700" as const, letterSpacing: -0.4 }),
    },
    right: { alignItems: "center", flexDirection: "row", gap: 10 },
  });
}

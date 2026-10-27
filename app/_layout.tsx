import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { router, Stack, type Href, usePathname } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import HomeBrandLink from "@/components/home-brand-link";
import { AppThemeProvider, useAppTheme } from "@/lib/app-theme";
import { StyleSheet, View } from "react-native";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StripeProvider } from "../components/stripe-provider";


export const unstable_settings = {
  anchor: "(tabs)",
};

// Screens that draw their own top bar, so the floating brand link would overlap it.
const screensWithTopBar = ["/", "/explore", "/location", "/creators", "/become-a-creator", "/book"];

export default function RootLayout() {
  return (
    <StripeProvider>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </StripeProvider>
  );
}

function RootNavigator() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const baseTheme = theme.statusBar === "light" ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: theme.colors.background,
      card: theme.colors.background,
    },
  };

  useEffect(() => {
    if (process.env.EXPO_OS === "web") return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
    });
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string" && url.startsWith("/")) router.push(url as Href);
    });
    return () => subscription.remove();
  }, []);

  return (
  <ThemeProvider value={navigationTheme}>
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="location" />
        <Stack.Screen name="creators" />
        <Stack.Screen name="creators/[id]" />
        <Stack.Screen name="book" />
        <Stack.Screen name="requests" />
        <Stack.Screen name="session/[bookingId]" />
        <Stack.Screen name="become-a-creator" />
        <Stack.Screen name="creator-application-status" />
        <Stack.Screen name="creator-requests" />
        <Stack.Screen name="availability" options={{ contentStyle: { backgroundColor: "#061827", paddingTop: insets.top } }} />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="admin" options={{ contentStyle: { backgroundColor: "#061827", paddingTop: insets.top } }} />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="messages/[bookingId]" options={{ contentStyle: { backgroundColor: "#061827", paddingTop: insets.top } }} />
        <Stack.Screen name="gallery/[bookingId]" />
        <Stack.Screen name="review/[bookingId]" />
        <Stack.Screen name="report" />
        <Stack.Screen name="account" />
        <Stack.Screen name="profile-settings" />
        <Stack.Screen name="creator-payouts" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="support" />

        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
          }}
        />
      </Stack>

      {!screensWithTopBar.includes(pathname) && !pathname.startsWith("/creators/") ? (
        <HomeBrandLink top={insets.top + 14} />
      ) : null}

      <View pointerEvents="none" style={[styles.statusBarBackdrop, { backgroundColor: theme.colors.background, height: insets.top }]} />
      <StatusBar style={theme.statusBar} />
    </View>
  </ThemeProvider>
);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  statusBarBackdrop: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 100,
  },
});

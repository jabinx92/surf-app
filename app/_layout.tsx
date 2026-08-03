import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, View } from "react-native";


export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const baseTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: "#061827",
      card: "#061827",
    },
  };

  return (
  <ThemeProvider value={navigationTheme}>
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#061827",
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
        <Stack.Screen name="become-a-creator" />
        <Stack.Screen name="creator-application-status" />
        <Stack.Screen name="creator-requests" />
        <Stack.Screen name="availability" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="messages/[bookingId]" />
        <Stack.Screen name="gallery/[bookingId]" />
        <Stack.Screen name="review/[bookingId]" />
        <Stack.Screen name="report" />
        <Stack.Screen name="account" />
        <Stack.Screen name="profile-settings" />
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

      <StatusBar style="light" />
    </View>
  </ThemeProvider>
);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#061827",
  },
});

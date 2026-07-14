import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useState } from "react";

export default function LocationScreen() {
  const [status, setStatus] = useState("Ready");
  async function getCurrentLocation() {
    try {
      setStatus("Requesting permission...");

      const { status: permissionStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (permissionStatus !== "granted") {
        setStatus("Location permission denied");
        return;
      }

      setStatus("Getting your location...");

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setStatus(
        `Lat: ${location.coords.latitude.toFixed(4)}\nLng: ${location.coords.longitude.toFixed(4)}`
      );
    } catch (error) {
      console.error(error);
      setStatus("Unable to get your location. Please try again.");
    }
  }
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />

      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.locationIcon}>
          <Text style={styles.locationIconText}>⌖</Text>
        </View>

        <Text style={styles.eyebrow}>FIND YOUR BREAK</Text>

        <Text style={styles.title}>Where are you surfing?</Text>

        <Text style={styles.description}>
          Share your location to find nearby surf spots and photographers
          available in your area.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={getCurrentLocation}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Use My Location</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            // We will build manual search after location permission.
          }}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Search a Surf Spot</Text>
        </Pressable>

        <Text style={styles.statusText}>{status}</Text>

        <Text style={styles.privacyText}>
          Your location is used only to show nearby surf spots.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#061827",
    paddingHorizontal: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingTop: 10,
    paddingVertical: 14,
    paddingRight: 24,
  },
  backButtonText: {
    color: "#d9e5ec",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 70,
  },
  locationIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(86, 214, 201, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(86, 214, 201, 0.3)",
    marginBottom: 26,
  },
  locationIconText: {
    color: "#56d6c9",
    fontSize: 30,
    fontWeight: "700",
  },
  eyebrow: {
    color: "#7ce0d6",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 44,
    lineHeight: 49,
    fontWeight: "800",
    letterSpacing: -1.6,
    maxWidth: 350,
  },
  description: {
    color: "#b9c9d6",
    fontSize: 17,
    lineHeight: 26,
    marginTop: 20,
    maxWidth: 350,
  },
  actions: {
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#56d6c9",
  },
  primaryButtonText: {
    color: "#061827",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  statusText: {
    color: "#ffffff",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  privacyText: {
    color: "#698596",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
  },
});

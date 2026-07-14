import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { Spacing } from "@/constants/spacing";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthForm from "@/components/AuthForm";

export default function HomeScreen() {
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <StatusBar style="dark" />

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowAuth(false)}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <View style={styles.authContent}>
          <AuthForm />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.welcomeScreen}>
      <StatusBar style="light" />

      {/* Decorative ocean shapes */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>W</Text>
        </View>

        <Text style={styles.brandName}>WaveLens</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>SURF • CAPTURE • REMEMBER</Text>
        </View>

        <Text style={styles.headline}>
          Capture the sessions{"\n"}
          you&apos;ll never forget.
        </Text>

        <Text style={styles.description}>
          Discover trusted surf photographers and book someone to capture your
          next session.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            router.navigate("/location");
          }
          }
          
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Book a Surf Photographer</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowAuth(true)}
          style={styles.signInButton}
        >
          <Text style={styles.signInPrompt}>Already have an account? </Text>
          <Text style={styles.signInText}>Sign In</Text>
        </Pressable>

        <Text style={styles.services}>Photography • Video • Drone</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  welcomeScreen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  authScreen: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
  },
  authContent: {
    flex: 1,
    justifyContent: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingRight: 20,
  },
  backButtonText: {
    color: "#14213d",
    fontSize: 16,
    fontWeight: "600",
  },
  glowTop: {
    position: "absolute",
    top: -170,
    right: -130,
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 55,
    borderColor: "rgba(67, 193, 186, 0.08)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -230,
    left: -170,
    width: 480,
    height: 480,
    borderRadius: 240,
    borderWidth: 75,
    borderColor: "rgba(30, 111, 143, 0.14)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#56d6c9",
  },
  brandMarkText: {
    color: "#061827",
    fontSize: 17,
    fontWeight: "900",
  },
  brandName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  eyebrow: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(86, 214, 201, 0.35)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 22,
    backgroundColor: "rgba(86, 214, 201, 0.07)",
  },
  eyebrowText: {
    color: "#7ce0d6",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  headline: {
    maxWidth: 350,
    color: "#ffffff",
    fontSize: Typography.hero,
    lineHeight: 51,
    fontWeight: "800",
    letterSpacing: -1.8,
  },
  description: {
    maxWidth: 340,
    color: "#b9c9d6",
    fontSize: 17,
    lineHeight: 26,
    marginTop: 22,
  },
  footer: {
    paddingBottom: 22,
  },
  primaryButton: {
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#56d6c9",
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  primaryButtonText: {
    color: "#061827",
    fontSize: 16,
    fontWeight: "800",
  },
  signInButton: {
    flexDirection: "row",
    alignSelf: "center",
    paddingVertical: 18,
  },
  signInPrompt: {
    color: "#91a8b8",
    fontSize: 14,
  },
  signInText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  services: {
    color: "#698596",
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});

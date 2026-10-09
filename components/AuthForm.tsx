import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";
import PasswordRequirements from "@/components/PasswordRequirements";
import { isStrongPassword } from "@/utils/password";
import { getRandomAvatarColor } from "@/utils/avatar";
import { router } from "expo-router";
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthFormProps = {
  onAuthenticated?: () => void;
};

export default function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  function changeMode(nextMode: "signIn" | "signUp") {
    setMode(nextMode);
    setMessage("");
    setMessageType("error");
  }

  async function signUp() {
    if (!email.trim() || !password) {
      setMessageType("error");
      setMessage("Enter an email and password.");
      return;
    }

    if (!isStrongPassword(password)) {
      setMessageType("error");
      setMessage("Choose a password that meets every requirement below.");
      return;
    }

    setMessage("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { avatar_color: getRandomAvatarColor() },
        },
      });
      if (error) throw error;
      if (!data.session) {
        setMessageType("success");
        setMessage("Account created. Check your email for the confirmation link, then sign in.");
        return;
      }
      setMessageType("success");
      setMessage("Your account was created. You are now signed in.");
      onAuthenticated?.();
    } catch (error) {
      setMessageType("error");
      setMessage(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    if (!email.trim() || !password) {
      setMessageType("error");
      setMessage("Enter an email and password.");
      return;
    }

    setMessage("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setMessageType("success");
      setMessage("You are signed in.");
      onAuthenticated?.();
    } catch (error) {
      setMessageType("error");
      setMessage(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.eyebrow}>
        <Text style={styles.eyebrowText}>{mode === "signIn" ? "WELCOME BACK" : "JOIN WAVELENS"}</Text>
      </View>
      <Text style={styles.title}>{mode === "signIn" ? "Sign in to WaveLens" : "Create your account"}</Text>
      <Text style={styles.subtitle}>
        {mode === "signIn"
          ? "Sign in to manage your sessions and account."
          : "Create an account to book surf photographers and videographers."}
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <Input value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Password</Text>
          {mode === "signIn" ? (
            <Pressable accessibilityRole="link" onPress={() => router.push("/forgot-password")} disabled={loading}>
              <Text style={styles.inlineLink}>Forgot password?</Text>
            </Pressable>
          ) : null}
        </View>
        <Input value={password} onChangeText={setPassword} placeholder="Enter your password" autoCapitalize="none" secureTextEntry />
      </View>

      {mode === "signUp" ? (
        <Animated.View entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)} exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)} layout={LinearTransition.duration(180).reduceMotion(ReduceMotion.System)}>
          <PasswordRequirements heading="Your password needs:" password={password} />
        </Animated.View>
      ) : null}

      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          style={messageType === "success" ? styles.successMessage : styles.errorMessage}
        >
          {message}
        </Text>
      ) : null}

      {mode === "signIn" ? (
        <>
          <Button onPress={signIn} disabled={loading} loading={loading}>Sign in</Button>

          <View style={styles.accountPrompt}>
            <Text style={styles.accountPromptText}>New here?</Text>
            <Pressable accessibilityRole="button" onPress={() => changeMode("signUp")} disabled={loading} style={styles.modeButton}>
              <Text style={styles.modeButtonText}>Create an account</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Button onPress={signUp} disabled={loading} loading={loading}>Create account</Button>

          <View style={styles.accountPrompt}>
            <Text style={styles.accountPromptText}>Already have an account?</Text>
            <Pressable accessibilityRole="button" onPress={() => changeMode("signIn")} disabled={loading} style={styles.modeButton}>
              <Text style={styles.modeButtonText}>Sign in</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function authErrorMessage(error: unknown) {
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return "WaveLens could not reach Supabase. Check your connection and try again—the button will remain available.";
  }
  return error instanceof Error ? error.message : "Please try again.";
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 18,
  },
  eyebrow: {
    alignSelf: "flex-start",
    backgroundColor: "#ccfbf1",
    borderCurve: "continuous",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  eyebrowText: {
    color: "#0f766e",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  title: {
    color: "#18181b",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginTop: -4,
  },
  subtitle: {
    color: "#71717a",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  field: { gap: 8 },
  labelRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  label: { color: "#27272a", fontSize: 14, fontWeight: "600" },
  inlineLink: { color: "#0f766e", fontSize: 13, fontWeight: "600" },
  errorMessage: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    color: "#b91c1c",
    fontSize: 14,
    padding: 12,
  },
  successMessage: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#15803d",
    fontSize: 14,
    padding: 12,
  },
  accountPrompt: { alignItems: "center", borderTopColor: "#e4e4e7", borderTopWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: 5, justifyContent: "center", marginTop: 2, minHeight: 52, paddingTop: 14 },
  accountPromptText: { color: "#71717a", fontSize: 14 },
  modeButton: { justifyContent: "center", minHeight: 44, paddingHorizontal: 2 },
  modeButtonText: { color: "#0f766e", fontSize: 14, fontWeight: "700" },
});

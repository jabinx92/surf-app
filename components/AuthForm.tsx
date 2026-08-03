import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";
import PasswordRequirements from "@/components/PasswordRequirements";
import { isStrongPassword } from "@/utils/password";
import { getRandomAvatarColor } from "@/utils/avatar";
import { router } from "expo-router";
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion } from "react-native-reanimated";
import FeedbackPressable from "@/components/feedback-pressable";

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
      <Text style={styles.title}>WaveLens</Text>
      <Text style={styles.subtitle}>
        {mode === "signIn"
          ? "Sign in to manage your sessions and account."
          : "Create an account to book surf photographers and videographers."}
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        autoCapitalize="none"
        secureTextEntry
        style={styles.input}
      />

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
          <FeedbackPressable accessibilityRole="button" haptic="light" onPress={signIn} disabled={loading} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{loading ? "Please wait…" : "Sign in"}</Text>
          </FeedbackPressable>

          <Pressable accessibilityRole="link" onPress={() => router.push("/forgot-password")} disabled={loading} style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>

          <View style={styles.accountPrompt}>
            <Text style={styles.accountPromptText}>New here?</Text>
            <Pressable accessibilityRole="button" onPress={() => changeMode("signUp")} disabled={loading} style={styles.modeButton}>
              <Text style={styles.modeButtonText}>Create an account</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <FeedbackPressable accessibilityRole="button" haptic="light" onPress={signUp} disabled={loading} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{loading ? "Creating account…" : "Create account"}</Text>
          </FeedbackPressable>

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
    gap: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    color: "#667085",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d5dd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorMessage: {
    color: "#b42318",
    fontSize: 14,
  },
  successMessage: {
    color: "#067647",
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  accountPrompt: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 5, justifyContent: "center", minHeight: 44 },
  accountPromptText: { color: "#667085", fontSize: 15 },
  modeButton: { justifyContent: "center", minHeight: 44, paddingHorizontal: 2 },
  modeButtonText: { color: "#167f78", fontSize: 15, fontWeight: "700" },
  forgotPasswordButton: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  forgotPasswordText: {
    color: "#344054",
    fontSize: 15,
    fontWeight: "600",
  },
});

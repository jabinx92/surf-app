import * as Linking from "expo-linking";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function sendResetLink() {
    if (!email.trim()) {
      setIsError(true);
      setMessage("Enter the email address for your WaveLens account.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const redirectTo = Linking.createURL("reset-password");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) throw error;

      setIsError(false);
      setMessage(
        "If an account uses that email, a password-reset link is on its way. Check your spam folder too."
      );
    } catch (error) {
      setIsError(true);
      setMessage(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter your account email and WaveLens will send you a secure reset link.
          </Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={sendResetLink}
            placeholder="Email"
            returnKeyType="send"
            style={styles.input}
            value={email}
          />

          {message ? (
            <Text
              accessibilityLiveRegion="polite"
              style={isError ? styles.errorMessage : styles.successMessage}
            >
              {message}
            </Text>
          ) : null}

          <Pressable
            disabled={loading}
            onPress={sendResetLink}
            style={[styles.primaryButton, loading && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Sending…" : "Send reset link"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function authErrorMessage(error: unknown) {
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return "WaveLens could not connect. Check your internet connection and try again.";
  }
  return error instanceof Error ? error.message : "We could not send the link. Please try again.";
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#061827", flex: 1 },
  content: { alignSelf: "center", flexGrow: 1, maxWidth: 620, padding: 20, width: "100%" },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  card: { backgroundColor: "#ffffff", borderRadius: 24, gap: 16, marginTop: 48, padding: 24 },
  title: { color: "#101828", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#667085", fontSize: 16, lineHeight: 23 },
  input: { borderColor: "#d0d5dd", borderRadius: 12, borderWidth: 1, fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 },
  errorMessage: { color: "#b42318", fontSize: 14, lineHeight: 20 },
  successMessage: { color: "#067647", fontSize: 14, lineHeight: 20 },
  primaryButton: { alignItems: "center", backgroundColor: "#111827", borderRadius: 12, padding: 16 },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});

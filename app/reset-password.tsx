import * as Linking from "expo-linking";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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

import PasswordRequirements from "@/components/PasswordRequirements";
import { supabase } from "@/lib/supabase";
import { isStrongPassword } from "@/utils/password";

export default function ResetPasswordScreen() {
  const incomingUrl = Linking.useLinkingURL();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [linkReady, setLinkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Checking your reset link…");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let active = true;

    async function prepareRecoverySession() {
      try {
        if (incomingUrl) {
          const params = getLinkParams(incomingUrl);
          const errorDescription = params.get("error_description");
          if (errorDescription) throw new Error(errorDescription.replace(/\+/g, " "));

          const code = params.get("code");
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
          } else if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          throw new Error("This reset link is invalid or has expired. Request a new one.");
        }

        if (active) {
          setLinkReady(true);
          setIsError(false);
          setMessage("");
        }
      } catch (error) {
        if (active) {
          setLinkReady(false);
          setIsError(true);
          setMessage(error instanceof Error ? error.message : "This reset link could not be opened.");
        }
      }
    }

    prepareRecoverySession();
    return () => {
      active = false;
    };
  }, [incomingUrl]);

  async function updatePassword() {
    if (!isStrongPassword(password)) {
      setIsError(true);
      setMessage("Choose a password that meets every requirement below.");
      return;
    }
    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("The two passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setIsError(false);
      setMessage("Password changed. You can now sign in with your new password.");
      setLinkReady(false);
      await supabase.auth.signOut();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Your password could not be changed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Choose a new password</Text>

          {linkReady ? (
            <>
              <TextInput
                autoCapitalize="none"
                autoComplete="new-password"
                onChangeText={setPassword}
                placeholder="New password"
                secureTextEntry
                style={styles.input}
                value={password}
              />
              <PasswordRequirements password={password} />
              <TextInput
                autoCapitalize="none"
                autoComplete="new-password"
                onChangeText={setConfirmPassword}
                onSubmitEditing={updatePassword}
                placeholder="Confirm new password"
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
              />
              <Pressable
                disabled={loading}
                onPress={updatePassword}
                style={[styles.primaryButton, loading && styles.disabledButton]}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Changing…" : "Change password"}
                </Text>
              </Pressable>
            </>
          ) : null}

          {message ? (
            <Text accessibilityLiveRegion="polite" style={isError ? styles.errorMessage : styles.successMessage}>
              {message}
            </Text>
          ) : null}

          {!linkReady && message !== "Checking your reset link…" ? (
            <Pressable onPress={() => router.replace("/sign-in")} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Back to sign in</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getLinkParams(url: string) {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  hashParams.forEach((value, key) => params.set(key, value));
  return params;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#061827", flex: 1 },
  content: { alignSelf: "center", flexGrow: 1, justifyContent: "center", maxWidth: 620, padding: 20, width: "100%" },
  card: { backgroundColor: "#ffffff", borderRadius: 24, gap: 16, padding: 24 },
  title: { color: "#101828", fontSize: 28, fontWeight: "700" },
  input: { borderColor: "#d0d5dd", borderRadius: 12, borderWidth: 1, fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 },
  errorMessage: { color: "#b42318", fontSize: 14, lineHeight: 20 },
  successMessage: { color: "#067647", fontSize: 14, lineHeight: 20 },
  primaryButton: { alignItems: "center", backgroundColor: "#111827", borderRadius: 12, padding: 16 },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  secondaryButton: { alignItems: "center", borderColor: "#111827", borderRadius: 12, borderWidth: 1, padding: 16 },
  secondaryButtonText: { color: "#111827", fontSize: 16, fontWeight: "600" },
});

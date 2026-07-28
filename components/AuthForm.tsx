import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";

type AuthFormProps = {
  onAuthenticated?: () => void;
};

export default function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  async function signUp() {
    if (!email.trim() || !password) {
      setMessageType("error");
      setMessage("Enter an email and password.");
      return;
    }

    setMessage("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
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
        Book surf photographers and videographers.
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

      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          style={messageType === "success" ? styles.successMessage : styles.errorMessage}
        >
          {message}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={signIn}
        disabled={loading}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? "Please wait…" : "Sign in"}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={signUp}
        disabled={loading}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Create account</Text>
      </Pressable>
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
});

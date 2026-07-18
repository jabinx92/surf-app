import { useState } from "react";
import {
  Alert,
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

  async function signUp() {
    if (!email.trim() || !password) {
      Alert.alert("Missing information", "Enter an email and password.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Sign-up failed", error.message);
      return;
    }

    if (!data.session) {
      Alert.alert("Check your email", "Supabase sent you a confirmation link.");
      return;
    }

    Alert.alert("Success", "Your account was created.");
  }

  async function signIn() {
    if (!email.trim() || !password) {
      Alert.alert("Missing information", "Enter an email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Sign-in failed", error.message);
      return;
    }

    Alert.alert("Success", "You are signed in.");
    onAuthenticated?.();
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

      <Pressable
        onPress={signIn}
        disabled={loading}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? "Please wait…" : "Sign in"}
        </Text>
      </Pressable>

      <Pressable
        onPress={signUp}
        disabled={loading}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Create account</Text>
      </Pressable>
    </View>
  );
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

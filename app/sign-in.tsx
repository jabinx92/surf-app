import AuthForm from "@/components/AuthForm";
import { Card } from "@/components/ui/card";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from "react-native";

export default function SignInScreen() {
  const { returnTo, creatorId, spot } = useLocalSearchParams<{ returnTo?: string; creatorId?: string; spot?: string }>();

  function finishAuthentication() {
    if (returnTo === "book" && creatorId) {
      router.replace({ pathname: "/book", params: { creatorId, ...(spot ? { spot } : {}) } });
      return;
    }
    router.replace("/account");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Card style={styles.card}>
          <AuthForm onAuthenticated={finishAuthentication} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#061827", flex: 1 },
  content: { alignSelf: "center", flexGrow: 1, justifyContent: "center", maxWidth: 540, padding: 20, paddingBottom: 64, width: "100%" },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  card: { marginTop: 20 },
});

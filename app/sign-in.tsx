import AuthForm from "@/components/AuthForm";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SignInScreen() {
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

        <View style={styles.card}>
          <AuthForm onAuthenticated={() => router.replace("/account")} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#061827", flex: 1 },
  content: { alignSelf: "center", flexGrow: 1, maxWidth: 620, padding: 20, paddingBottom: 44, width: "100%" },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  card: { backgroundColor: "#ffffff", borderCurve: "continuous", borderRadius: 24, marginTop: 48, padding: 24 },
});

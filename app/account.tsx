import { supabase } from "@/lib/supabase";
import { router, useFocusEffect, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AccountScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAccount = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getUser();
    setEmail(data.user?.email ?? null);
    setIsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void loadAccount(); }, [loadAccount]));

  async function signOut() {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);
    if (error) {
      Alert.alert("Could not sign out", error.message);
      return;
    }
    router.replace("/");
  }

  function requestDeletion() {
    Alert.alert(
      "Delete your WaveLens account?",
      "This permanently removes your account, creator profile, and booking data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: () => void deleteAccount() },
      ],
    );
  }

  async function deleteAccount() {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error || !data?.deleted) throw error ?? new Error("The deletion service did not confirm completion.");
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      Alert.alert("Account deleted", "Your WaveLens account and associated booking data were deleted.");
      router.replace("/");
    } catch (error) {
      Alert.alert("Could not delete account", error instanceof Error ? error.message : "Please try again or contact support.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic">
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
      <Text style={styles.eyebrow}>YOUR WAVELENS</Text>
      <Text style={styles.title}>Account</Text>
      {isLoading ? <View style={styles.state}><ActivityIndicator color="#56d6c9" /></View> : email ? <View style={styles.content}>
        <View style={styles.emailCard}><Text style={styles.emailLabel}>SIGNED IN AS</Text><Text selectable style={styles.email}>{email}</Text></View>
        <Pressable accessibilityRole="button" onPress={() => router.push("/requests")} style={styles.primaryButton}><Text style={styles.primaryText}>My booking requests</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/creator-requests")} style={styles.secondaryButton}><Text style={styles.secondaryText}>Creator dashboard</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/become-a-creator")} style={styles.secondaryButton}><Text style={styles.secondaryText}>Apply as a creator</Text></Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push("/privacy")} style={styles.privacyButton}><Text style={styles.privacyText}>Privacy policy</Text></Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push("/support" as Href)} style={styles.privacyButton}><Text style={styles.privacyText}>Help and support</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={isSigningOut || isDeleting} onPress={() => void signOut()} style={styles.signOutButton}><Text style={styles.signOutText}>{isSigningOut ? "Signing out..." : "Sign out"}</Text></Pressable>
        <View style={styles.dangerZone}><Text style={styles.dangerTitle}>Delete account</Text><Text selectable style={styles.dangerText}>Permanently delete your account, creator profile, and booking data.</Text><Pressable accessibilityRole="button" disabled={isDeleting || isSigningOut} onPress={requestDeletion} style={[styles.deleteButton, isDeleting && styles.disabledButton]}><Text style={styles.deleteText}>{isDeleting ? "Deleting account..." : "Delete account"}</Text></Pressable></View>
      </View> : <View style={styles.state}><Text style={styles.stateTitle}>You are not signed in</Text><Text style={styles.stateText}>Sign in or create an account to send and manage booking requests.</Text><Pressable accessibilityRole="button" onPress={() => router.replace("/")} style={styles.primaryButton}><Text style={styles.primaryText}>Go to sign in</Text></Pressable></View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { alignSelf: "center", backgroundColor: "#061827", flexGrow: 1, maxWidth: 620, padding: 20, paddingBottom: 44, width: "100%" },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backButtonText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginTop: 16 },
  title: { color: "#ffffff", fontSize: 38, fontWeight: "800", letterSpacing: -1.3, marginTop: 10 },
  content: { gap: 12, marginTop: 32 },
  emailCard: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.13)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, marginBottom: 10, padding: 17 },
  emailLabel: { color: "#91a8b8", fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  email: { color: "#ffffff", fontSize: 16, fontWeight: "700", marginTop: 8 },
  state: { alignItems: "center", gap: 14, paddingHorizontal: 22, paddingTop: 90 },
  stateTitle: { color: "#ffffff", fontSize: 22, fontWeight: "800" },
  stateText: { color: "#b9c9d6", fontSize: 16, lineHeight: 23, textAlign: "center" },
  primaryButton: { alignItems: "center", backgroundColor: "#56d6c9", borderCurve: "continuous", borderRadius: 16, justifyContent: "center", minHeight: 54, paddingHorizontal: 18 },
  primaryText: { color: "#061827", fontSize: 16, fontWeight: "800" },
  secondaryButton: { alignItems: "center", borderColor: "rgba(255,255,255,0.2)", borderCurve: "continuous", borderRadius: 16, borderWidth: 1, justifyContent: "center", minHeight: 54, paddingHorizontal: 18 },
  secondaryText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  signOutButton: { alignItems: "center", justifyContent: "center", marginTop: 16, minHeight: 48 },
  signOutText: { color: "#f5a3a3", fontSize: 15, fontWeight: "800" },
  privacyButton: { alignItems: "center", justifyContent: "center", marginTop: 2, minHeight: 36 },
  privacyText: { color: "#91a8b8", fontSize: 14, fontWeight: "700" },
  dangerZone: { borderColor: "rgba(240,112,112,0.35)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, marginTop: 16, padding: 17 },
  dangerTitle: { color: "#ffffff", fontSize: 17, fontWeight: "800" },
  dangerText: { color: "#b9c9d6", fontSize: 14, lineHeight: 20, marginTop: 7 },
  deleteButton: { alignItems: "center", borderColor: "rgba(240,112,112,0.7)", borderCurve: "continuous", borderRadius: 13, borderWidth: 1, justifyContent: "center", marginTop: 16, minHeight: 45, paddingHorizontal: 14 },
  disabledButton: { opacity: 0.6 },
  deleteText: { color: "#f5a3a3", fontSize: 14, fontWeight: "800" },
});

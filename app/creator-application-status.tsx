import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Application = {
  display_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const statusContent = {
  pending: {
    icon: "✓",
    eyebrow: "APPLICATION RECEIVED",
    title: "Your portfolio is in review.",
    body: "A WaveLens admin will review your application. You can leave this page and return later—your status is saved to your account.",
  },
  approved: {
    icon: "✓",
    eyebrow: "APPLICATION APPROVED",
    title: "You are a WaveLens creator.",
    body: "Your creator profile is live. Add availability and start responding to booking requests.",
  },
  rejected: {
    icon: "!",
    eyebrow: "APPLICATION UPDATE",
    title: "Your application was not approved.",
    body: "Contact WaveLens support if you would like more information or want to discuss reapplying.",
  },
} as const;

export default function CreatorApplicationStatusScreen() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadStatus = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setMessage("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.replace("/sign-in");
        return;
      }
      const { data, error } = await supabase
        .from("creator_applications")
        .select("display_name, status, created_at")
        .eq("applicant_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setApplication(data as Application | null);
      if (!data) setMessage("No creator application was found for this account.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not check your application status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus(true);
    const timer = setInterval(() => void loadStatus(), 15000);
    return () => clearInterval(timer);
  }, [loadStatus]);

  const content = application ? statusContent[application.status] : null;

  return (
    <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic">
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.replace("/")} style={styles.backButton}>
        <Text style={styles.backText}>Back to home</Text>
      </Pressable>

      {loading ? (
        <View style={styles.state}><ActivityIndicator color="#56d6c9" /></View>
      ) : content && application ? (
        <View style={styles.content}>
          <View style={[styles.icon, application.status === "rejected" && styles.iconRejected]}>
            <Text style={styles.iconText}>{content.icon}</Text>
          </View>
          <Text style={styles.eyebrow}>{content.eyebrow}</Text>
          <Text style={styles.title}>{content.title}</Text>
          <Text selectable style={styles.body}>{content.body}</Text>

          <View style={styles.statusCard}>
            <View><Text style={styles.cardLabel}>STATUS</Text><Text style={styles.cardValue}>{application.status}</Text></View>
            <View><Text style={styles.cardLabel}>APPLICATION</Text><Text style={styles.cardName}>{application.display_name}</Text></View>
          </View>

          {application.status === "pending" ? <Text style={styles.autoRefresh}>This page checks for updates automatically every 15 seconds.</Text> : null}
          {application.status === "approved" ? <Pressable accessibilityRole="button" onPress={() => router.replace("/availability")} style={styles.primaryButton}><Text style={styles.primaryText}>Set your availability</Text></Pressable> : null}
          {application.status === "rejected" ? <Pressable accessibilityRole="button" onPress={() => router.replace("/become-a-creator")} style={styles.primaryButton}><Text style={styles.primaryText}>Reapply</Text></Pressable> : null}
          {application.status === "rejected" ? <Pressable accessibilityRole="button" onPress={() => router.push("/support")} style={styles.supportButton}><Text style={styles.supportText}>Contact support</Text></Pressable> : null}
          <Pressable accessibilityRole="button" onPress={() => void loadStatus(true)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Check status now</Text></Pressable>
        </View>
      ) : (
        <View style={styles.state}><Text style={styles.body}>{message}</Text><Pressable accessibilityRole="button" onPress={() => router.replace("/become-a-creator")} style={styles.primaryButton}><Text style={styles.primaryText}>Start an application</Text></Pressable></View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { alignSelf: "center", backgroundColor: "#061827", flexGrow: 1, maxWidth: 620, padding: 20, paddingBottom: 48, width: "100%" },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  state: { alignItems: "center", gap: 18, paddingHorizontal: 20, paddingTop: 100 },
  content: { alignItems: "center", paddingTop: 62 },
  icon: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 38, height: 76, justifyContent: "center", width: 76 },
  iconRejected: { backgroundColor: "#f5b841" },
  iconText: { color: "#061827", fontSize: 36, fontWeight: "900" },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "900", letterSpacing: 1.5, marginTop: 28 },
  title: { color: "#ffffff", fontSize: 36, fontWeight: "900", letterSpacing: -1.2, lineHeight: 42, marginTop: 10, textAlign: "center" },
  body: { color: "#b9c9d6", fontSize: 16, lineHeight: 24, marginTop: 14, textAlign: "center" },
  statusCard: { backgroundColor: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.13)", borderRadius: 18, borderWidth: 1, gap: 22, marginTop: 30, padding: 18, width: "100%" },
  cardLabel: { color: "#698596", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  cardValue: { color: "#7ce0d6", fontSize: 17, fontWeight: "900", marginTop: 5, textTransform: "capitalize" },
  cardName: { color: "#ffffff", fontSize: 17, fontWeight: "800", marginTop: 5 },
  autoRefresh: { color: "#698596", fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: "center" },
  primaryButton: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 16, justifyContent: "center", marginTop: 24, minHeight: 54, paddingHorizontal: 20, width: "100%" },
  primaryText: { color: "#061827", fontSize: 15, fontWeight: "900" },
  secondaryButton: { alignItems: "center", borderColor: "rgba(255,255,255,.2)", borderRadius: 16, borderWidth: 1, justifyContent: "center", marginTop: 12, minHeight: 52, paddingHorizontal: 20, width: "100%" },
  secondaryText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  supportButton: { alignItems: "center", justifyContent: "center", marginTop: 10, minHeight: 44 },
  supportText: { color: "#91a8b8", fontSize: 14, fontWeight: "700" },
});

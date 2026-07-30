import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const reasons = ["spam", "harassment", "safety", "fraud", "other"] as const;

export default function ReportScreen() {
  const params = useLocalSearchParams<{ creatorId?: string; bookingId?: string; messageId?: string }>();
  const [reason, setReason] = useState<(typeof reasons)[number]>("safety");
  const [details, setDetails] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const submissionStarted = useRef(false);

  async function submitReport() {
    if (submissionStarted.current) return;
    submissionStarted.current = true;
    setIsSending(true);
    setMessage("");

    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        submissionStarted.current = false;
        router.push("/sign-in");
        return;
      }

      const { error } = await supabase.from("user_reports").insert({
        reporter_id: data.user.id,
        creator_profile_id: params.creatorId || null,
        booking_request_id: params.bookingId || null,
        message_id: params.messageId || null,
        reason,
        details: details.trim(),
      });
      if (error) throw error;

      router.replace({ pathname: "/account", params: { notice: "report-sent" } });
    } catch (error) {
      submissionStarted.current = false;
      setMessage(error instanceof Error ? error.message : "We could not submit your report. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Back</Text></Pressable>
      <Text style={styles.eyebrow}>SAFETY & TRUST</Text>
      <Text style={styles.title}>Report a concern</Text>
      <Text selectable style={styles.subtitle}>Reports are private and reviewed by WaveLens admins.</Text>

      <View style={styles.reasons}>
        {reasons.map((item) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: reason === item }}
            disabled={isSending}
            key={item}
            onPress={() => setReason(item)}
            style={[styles.reason, reason === item && styles.selected]}
          >
            <Text style={[styles.reasonText, reason === item && styles.selectedText]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        accessibilityLabel="Report details"
        editable={!isSending}
        maxLength={1000}
        multiline
        onChangeText={setDetails}
        placeholder="Tell us what happened..."
        placeholderTextColor="#698596"
        style={styles.input}
        textAlignVertical="top"
        value={details}
      />
      {message ? <View accessibilityRole="alert" style={styles.message}><Text selectable style={styles.messageText}>{message}</Text></View> : null}
      <Pressable accessibilityRole="button" disabled={isSending} onPress={() => void submitReport()} style={[styles.submit, isSending && styles.disabled]}><Text style={styles.submitText}>{isSending ? "Submitting report..." : "Submit report"}</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { alignSelf: "center", backgroundColor: "#061827", flexGrow: 1, maxWidth: 680, padding: 20, paddingBottom: 44, width: "100%" },
  back: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44 },
  backText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  eyebrow: { color: "#f5b841", fontSize: 12, fontWeight: "900", letterSpacing: 1.4, marginTop: 24 },
  title: { color: "#ffffff", fontSize: 38, fontWeight: "900", marginTop: 8 },
  subtitle: { color: "#b9c9d6", fontSize: 16, lineHeight: 23, marginTop: 8 },
  reasons: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 30 },
  reason: { borderColor: "rgba(255,255,255,0.2)", borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  selected: { backgroundColor: "#f5b841", borderColor: "#f5b841" },
  reasonText: { color: "#d9e5ec", fontWeight: "800", textTransform: "capitalize" },
  selectedText: { color: "#061827" },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)", borderCurve: "continuous", borderRadius: 16, borderWidth: 1, color: "#ffffff", fontSize: 16, minHeight: 150, marginTop: 24, padding: 16 },
  message: { backgroundColor: "rgba(255,177,92,0.1)", borderColor: "rgba(255,177,92,0.32)", borderRadius: 14, borderWidth: 1, marginTop: 18, padding: 14 },
  messageText: { color: "#ffd4a3", fontSize: 14, lineHeight: 20 },
  submit: { alignItems: "center", backgroundColor: "#56d6c9", borderCurve: "continuous", borderRadius: 17, justifyContent: "center", marginTop: 24, minHeight: 56 },
  submitText: { color: "#061827", fontSize: 16, fontWeight: "900" },
  disabled: { opacity: 0.6 },
});

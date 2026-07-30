import { hourlyRate, serviceOptions, type Creator } from "@/data/creators";
import { supabase } from "@/lib/supabase";
import { SessionDatePicker } from "@/components/session-date-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const sessionLengths = [1, 2, 3, 4] as const;

export default function BookingScreen() {
  const { creatorId, spot } = useLocalSearchParams<{ creatorId: string; spot?: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceType, setServiceType] = useState<(typeof serviceOptions)[number]>("Photography");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionHours, setSessionHours] = useState<(typeof sessionLengths)[number]>(1);
  const [notes, setNotes] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const loadCreator = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("id, display_name, city, services, portfolio_url, starting_rate, bio, travel_miles, avatar_url, is_verified")
      .eq("id", creatorId)
      .eq("is_listed", true)
      .maybeSingle();
    const nextCreator = error ? null : (data as Creator | null);
    setCreator(nextCreator);
    if (nextCreator) setServiceType(nextCreator.services[0] ?? "Photography");
    setIsLoading(false);
  }, [creatorId]);

  useFocusEffect(useCallback(() => { void loadCreator(); }, [loadCreator]));

  async function submitRequest() {
    if (!creator) return;
    setFormMessage("");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
      setFormMessage("Choose your session date from the calendar.");
      return;
    }
    if (!spot?.trim()) {
      setFormMessage("Go back and select the surf spot where you want to be filmed.");
      return;
    }
    if (contactDetails.trim().length < 2) {
      setFormMessage("Add an email address, phone number, or Instagram handle so the creator can reply.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setFormMessage("Sign in or create an account before sending a booking request.");
        return;
      }
      const { error } = await supabase.from("booking_requests").insert({
        customer_id: userData.user.id,
        creator_profile_id: creator.id,
        service_type: serviceType,
        session_date: sessionDate,
        session_hours: sessionHours,
        surf_spot: spot.trim(),
        notes: notes.trim(),
        contact_details: contactDetails.trim(),
      });
      if (error) throw error;
      setIsSubmitted(true);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "We could not send your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <View style={styles.centered}><ActivityIndicator color="#56d6c9" /></View>;
  if (!creator) return <View style={styles.centered}><Text selectable style={styles.title}>Creator not found</Text><Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.link}>Go back</Text></Pressable></View>;

  if (isSubmitted) {
    return (
      <ScrollView contentContainerStyle={[styles.screen, styles.confirmationScreen]} contentInsetAdjustmentBehavior="automatic">
        <StatusBar style="light" />
        <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
        <Text style={styles.eyebrow}>REQUEST SENT</Text>
        <Text selectable style={styles.confirmationTitle}>Your session request is on its way.</Text>
        <Text selectable style={styles.confirmationBody}>{creator.display_name} can now review your request and reply through WaveLens.</Text>
        <View style={styles.confirmationCard}>
          <View style={styles.confirmationRow}><Text style={styles.confirmationLabel}>CREATOR</Text><Text selectable style={styles.confirmationValue}>{creator.display_name}</Text></View>
          <View style={styles.confirmationRow}><Text style={styles.confirmationLabel}>DATE</Text><Text selectable style={styles.confirmationValue}>{sessionDate}</Text></View>
          <View style={styles.confirmationRow}><Text style={styles.confirmationLabel}>SURF SPOT</Text><Text selectable style={styles.confirmationValue}>{spot}</Text></View>
          <View style={styles.confirmationRow}><Text style={styles.confirmationLabel}>SESSION</Text><Text selectable style={styles.confirmationValue}>{sessionHours} {sessionHours === 1 ? "hour" : "hours"} · {serviceType}</Text></View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.replace("/requests")} style={styles.submitButton}><Text style={styles.submitText}>View my requests</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.replace("/creators")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Browse more creators</Text></Pressable>
      </ScrollView>
    );
  }

  const estimatedTotal = creator.starting_rate * sessionHours;

  return (
    <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
      <Text style={styles.eyebrow}>REQUEST A SESSION</Text>
      <Text style={styles.title}>Book {creator.display_name}</Text>
      <Text selectable style={styles.subtitle}>{hourlyRate(creator)} starting rate · {creator.city}</Text>

      <View style={styles.spotCard}><Text style={styles.spotLabel}>SURF SPOT</Text><Text selectable style={styles.spotName}>{spot || "Choose a surf spot before sending"}</Text></View>

      <View style={styles.estimateCard}>
        <View><Text style={styles.estimateLabel}>ESTIMATED STARTING TOTAL</Text><Text selectable style={styles.estimateTotal}>${estimatedTotal}</Text></View>
        <Text selectable style={styles.estimateDetail}>{hourlyRate(creator)} × {sessionHours} {sessionHours === 1 ? "hour" : "hours"}</Text>
      </View>

      <View style={styles.section}><Text style={styles.label}>WHAT DO YOU NEED?</Text><View style={styles.options}>{serviceOptions.filter((option) => creator.services.includes(option)).map((option) => <Pressable accessibilityRole="button" key={option} onPress={() => setServiceType(option)} style={[styles.option, serviceType === option && styles.optionSelected]}><Text style={[styles.optionText, serviceType === option && styles.optionTextSelected]}>{option}</Text></Pressable>)}</View></View>
      <View style={styles.section}><Text style={styles.label}>SESSION LENGTH</Text><View style={styles.options}>{sessionLengths.map((hours) => <Pressable accessibilityLabel={`${hours} ${hours === 1 ? "hour" : "hours"}`} accessibilityRole="button" key={hours} onPress={() => setSessionHours(hours)} style={[styles.option, sessionHours === hours && styles.optionSelected]}><Text style={[styles.optionText, sessionHours === hours && styles.optionTextSelected]}>{hours} {hours === 1 ? "hour" : "hours"}</Text></Pressable>)}</View></View>
      <View style={styles.section}><Text style={styles.label}>SESSION DATE</Text><SessionDatePicker onChange={setSessionDate} value={sessionDate} /></View>
      <View style={styles.section}><Text style={styles.label}>A NOTE FOR {creator.display_name.toUpperCase()}</Text><TextInput accessibilityLabel="Booking details" multiline onChangeText={setNotes} placeholder="Surf spot, preferred time, and anything they should know." placeholderTextColor="#698596" textAlignVertical="top" value={notes} style={[styles.input, styles.notesInput]} /></View>
      <View style={styles.section}><Text style={styles.label}>HOW SHOULD THEY REACH YOU?</Text><TextInput accessibilityLabel="Contact details" autoCapitalize="none" autoCorrect={false} onChangeText={setContactDetails} placeholder="Email, phone, or Instagram handle" placeholderTextColor="#698596" value={contactDetails} style={styles.input} /></View>
      {formMessage ? <View accessibilityRole="alert" style={styles.formMessage}><Text selectable style={styles.formMessageText}>{formMessage}</Text></View> : null}
      <Pressable accessibilityHint="Sends this booking request to the creator" accessibilityRole="button" disabled={isSubmitting} onPress={() => void submitRequest()} style={({ pressed }) => [styles.submitButton, (pressed || isSubmitting) && styles.buttonPressed]}><Text style={styles.submitText}>{isSubmitting ? "Sending..." : "Send booking request"}</Text></Pressable>
      <Text selectable style={styles.footnote}>WaveLens does not process payments. Confirm final scope and payment directly with the creator.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { alignSelf: "center", backgroundColor: "#061827", flexGrow: 1, maxWidth: 680, padding: 20, paddingBottom: 44, width: "100%" },
  centered: { alignItems: "center", backgroundColor: "#061827", flex: 1, gap: 16, justifyContent: "center" },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backButtonText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginTop: 16 },
  title: { color: "#ffffff", fontSize: 38, fontWeight: "800", letterSpacing: -1.3, marginTop: 10 },
  subtitle: { color: "#b9c9d6", fontSize: 16, marginTop: 9 },
  spotCard: { backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, marginTop: 22, padding: 16 },
  spotLabel: { color: "#91a8b8", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  spotName: { color: "#ffffff", fontSize: 17, fontWeight: "800", marginTop: 6 },
  estimateCard: { alignItems: "center", backgroundColor: "rgba(86,214,201,0.1)", borderColor: "rgba(86,214,201,0.25)", borderCurve: "continuous", borderRadius: 20, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 14, padding: 17 },
  estimateLabel: { color: "#8aede2", fontSize: 10, fontWeight: "900", letterSpacing: 1.05 },
  estimateTotal: { color: "#ffffff", fontSize: 28, fontWeight: "900", letterSpacing: -0.8, marginTop: 5 },
  estimateDetail: { color: "#d2f4ef", fontSize: 13, fontWeight: "700", textAlign: "right" },
  section: { marginTop: 28 },
  label: { color: "#91a8b8", fontSize: 11, fontWeight: "800", letterSpacing: 1.1, marginBottom: 12 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: { borderColor: "rgba(255,255,255,0.18)", borderRadius: 999, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 10 },
  optionSelected: { backgroundColor: "#56d6c9", borderColor: "#56d6c9" },
  optionText: { color: "#d9e5ec", fontSize: 14, fontWeight: "700" },
  optionTextSelected: { color: "#061827" },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)", borderRadius: 16, borderWidth: 1, color: "#ffffff", fontSize: 16, paddingHorizontal: 16, paddingVertical: 15 },
  notesInput: { minHeight: 130 },
  formMessage: { backgroundColor: "rgba(255,177,92,0.1)", borderColor: "rgba(255,177,92,0.32)", borderCurve: "continuous", borderRadius: 14, borderWidth: 1, marginTop: 22, padding: 14 },
  formMessageText: { color: "#ffd4a3", fontSize: 14, lineHeight: 20 },
  submitButton: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 18, justifyContent: "center", marginTop: 36, minHeight: 58 },
  submitText: { color: "#061827", fontSize: 16, fontWeight: "800" },
  footnote: { color: "#698596", fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: "center" },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  link: { color: "#56d6c9", fontSize: 16, fontWeight: "700" },
  confirmationScreen: { justifyContent: "center" },
  successIcon: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 30, height: 60, justifyContent: "center", marginBottom: 18, width: 60 },
  successIconText: { color: "#061827", fontSize: 30, fontWeight: "900" },
  confirmationTitle: { color: "#ffffff", fontSize: 38, fontWeight: "800", letterSpacing: -1.3, lineHeight: 43, marginTop: 10 },
  confirmationBody: { color: "#b9c9d6", fontSize: 16, lineHeight: 24, marginTop: 12 },
  confirmationCard: { backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 20, borderWidth: 1, gap: 16, marginTop: 26, padding: 18 },
  confirmationRow: { gap: 4 },
  confirmationLabel: { color: "#698596", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  confirmationValue: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  secondaryButton: { alignItems: "center", borderColor: "rgba(255,255,255,0.18)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, justifyContent: "center", marginTop: 12, minHeight: 54 },
  secondaryButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
});

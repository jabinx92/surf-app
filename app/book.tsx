import { hourlyRate, serviceOptions, type Creator } from "@/data/creators";
import { supabase } from "@/lib/supabase";
import { SessionDatePicker } from "@/components/session-date-picker";
import { SessionTimePicker } from "@/components/session-time-picker";
import { formatSessionDate, formatSessionTime } from "@/utils/session-time";
import { clearBookingDraft, loadBookingDraft, saveBookingDraft } from "@/utils/booking-draft";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInUp, ReduceMotion } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/app-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TopBar } from "@/components/ui/top-bar";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";

const sessionLengths = [1, 2, 3, 4] as const;

export default function BookingScreen() {
  const { creatorId, spot } = useLocalSearchParams<{ creatorId: string; spot?: string }>();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceType, setServiceType] = useState<(typeof serviceOptions)[number]>("Photography");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState("");
  const [sessionHours, setSessionHours] = useState<(typeof sessionLengths)[number]>(1);
  const [notes, setNotes] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [needsAuthentication, setNeedsAuthentication] = useState(false);

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
    if (nextCreator) {
      const draft = await loadBookingDraft(nextCreator.id);
      if (draft && (!spot || draft.spot === spot)) {
        setServiceType(draft.serviceType);
        setSessionDate(draft.sessionDate);
        setSessionStartTime(draft.sessionStartTime);
        setSessionHours(draft.sessionHours);
        setNotes(draft.notes);
        setContactDetails(draft.contactDetails);
      } else {
        setServiceType(nextCreator.services[0] ?? "Photography");
      }
    }
    setIsLoading(false);
  }, [creatorId, spot]);

  useFocusEffect(useCallback(() => { void loadCreator(); }, [loadCreator]));

  async function submitRequest() {
    if (!creator) return;
    setHasAttemptedSubmit(true);
    setFormMessage("");
    setNeedsAuthentication(false);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
      setFormMessage("Choose your session date from the calendar.");
      return;
    }
    if (!spot?.trim()) {
      setFormMessage("Go back and select the surf spot where you want to be filmed.");
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(sessionStartTime)) {
      setFormMessage("Choose the time you want your session to begin.");
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
        setNeedsAuthentication(true);
        return;
      }
      const { error } = await supabase.from("booking_requests").insert({
        customer_id: userData.user.id,
        creator_profile_id: creator.id,
        creator_display_name: creator.display_name,
        service_type: serviceType,
        session_date: sessionDate,
        session_start_time: sessionStartTime,
        session_hours: sessionHours,
        surf_spot: spot.trim(),
        notes: notes.trim(),
        contact_details: contactDetails.trim(),
      });
      if (error) throw error;
      await clearBookingDraft(creator.id);
      if (process.env.EXPO_OS === "ios") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setIsSubmitted(true);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "We could not send your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function continueToSignIn() {
    if (!creator) return;
    await saveBookingDraft({
      contactDetails,
      creatorId: creator.id,
      notes,
      serviceType,
      sessionDate,
      sessionHours,
      sessionStartTime,
      spot: spot?.trim() ?? "",
    });
    router.push({ pathname: "/sign-in", params: { returnTo: "book", creatorId: creator.id, ...(spot ? { spot } : {}) } });
  }

  if (isLoading) return <View style={styles.centered}><ActivityIndicator color={theme.colors.accent} /></View>;
  if (!creator) {
    return (
      <View style={styles.centered}>
        <Text selectable style={styles.title}>Creator not found</Text>
        <AppButton onPress={() => router.back()} variant="secondary">Go back</AppButton>
      </View>
    );
  }

  if (isSubmitted) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
        <ScrollView contentContainerStyle={[styles.screen, styles.confirmationScreen]} contentInsetAdjustmentBehavior="automatic">
          <Animated.View entering={FadeInUp.duration(240).reduceMotion(ReduceMotion.System)}>
            <View style={styles.successIcon}><IconSymbol color={theme.colors.onAccent} name="checkmark" size={30} /></View>
            <Text selectable style={styles.title}>Request sent.</Text>
            <Text selectable style={styles.subtitle}>{creator.display_name} will review it and reply in WaveLens. You&apos;ll only pay once they accept.</Text>
            <View style={styles.summary}>
              <SummaryRow label="Creator" styles={styles} value={creator.display_name} />
              <SummaryRow label="When" styles={styles} value={`${formatSessionDate(sessionDate)} at ${formatSessionTime(sessionStartTime)}`} />
              <SummaryRow label="Where" styles={styles} value={spot ?? ""} />
              <SummaryRow label="Session" styles={styles} value={`${sessionHours} ${sessionHours === 1 ? "hour" : "hours"} · ${serviceType}`} last />
            </View>
            <View style={styles.confirmationActions}>
              <AppButton onPress={() => router.replace("/requests")} size="lg">View my requests</AppButton>
              <AppButton onPress={() => router.replace("/creators")} size="lg" variant="secondary">Browse more creators</AppButton>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const estimatedTotal = creator.starting_rate * sessionHours;
  const dateMissing = hasAttemptedSubmit && !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate);
  const timeMissing = hasAttemptedSubmit && !/^([01]\d|2[0-3]):[0-5]\d$/.test(sessionStartTime);
  const contactMissing = hasAttemptedSubmit && contactDetails.trim().length < 2;
  const availableServices = serviceOptions.filter((option) => creator.services.includes(option));

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic" keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" onScrollBeginDrag={Keyboard.dismiss}>
        <TopBar back />
        <Text style={styles.title}>Book {creator.display_name}</Text>
        <View style={[styles.spotRow, hasAttemptedSubmit && !spot?.trim() && styles.spotRowInvalid]}>
          <IconSymbol color={theme.colors.accentText} name="mappin" size={16} />
          <Text selectable style={styles.spotText}>{spot || "No surf spot chosen. Go back and pick one."}</Text>
        </View>

        {availableServices.length > 1 ? (
          <Field label="What do you need?" styles={styles}>
            <View style={styles.segmented}>
              {availableServices.map((option) => (
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: serviceType === option }} key={option} onPress={() => setServiceType(option)} style={[styles.segment, serviceType === option && styles.segmentSelected]}>
                  <Text style={[styles.segmentText, serviceType === option && styles.segmentTextSelected]}>{option}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
        ) : null}

        <Field label="How long?" styles={styles}>
          <View style={styles.segmented}>
            {sessionLengths.map((hours) => (
              <Pressable accessibilityLabel={`${hours} ${hours === 1 ? "hour" : "hours"}`} accessibilityRole="radio" accessibilityState={{ checked: sessionHours === hours }} key={hours} onPress={() => setSessionHours(hours)} style={[styles.segment, sessionHours === hours && styles.segmentSelected]}>
                <Text style={[styles.segmentText, sessionHours === hours && styles.segmentTextSelected]}>{hours} hr</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field error={dateMissing ? "Pick a date to continue." : undefined} label="Date" styles={styles}>
          <View style={dateMissing ? styles.invalid : undefined}><SessionDatePicker onChange={setSessionDate} value={sessionDate} /></View>
        </Field>

        <Field error={timeMissing ? "Pick a start time to continue." : undefined} label="Start time" styles={styles}>
          <View style={timeMissing ? styles.invalid : undefined}><SessionTimePicker onChange={setSessionStartTime} value={sessionStartTime} /></View>
        </Field>

        <Field error={contactMissing ? "Add an email, phone number, or Instagram handle." : undefined} label="How can they reach you?" styles={styles}>
          <TextInput accessibilityLabel="Contact details" autoCapitalize="none" autoCorrect={false} onChangeText={setContactDetails} placeholder="Email, phone, or Instagram" placeholderTextColor={theme.colors.textFaint} returnKeyType="done" submitBehavior="blurAndSubmit" value={contactDetails} style={[styles.input, contactMissing && styles.invalid]} />
        </Field>

        <Field label={`Anything ${creator.display_name} should know?`} optional styles={styles}>
          <TextInput accessibilityLabel="Booking details" multiline onChangeText={setNotes} placeholder="Where to meet, what board you're on, the shots you want…" placeholderTextColor={theme.colors.textFaint} returnKeyType="done" submitBehavior="blurAndSubmit" textAlignVertical="top" value={notes} style={[styles.input, styles.notesInput]} />
        </Field>

        <View style={styles.total}>
          <View>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text selectable style={styles.totalDetail}>{hourlyRate(creator)} × {sessionHours} {sessionHours === 1 ? "hour" : "hours"}</Text>
          </View>
          <Text selectable style={styles.totalValue}>${estimatedTotal}</Text>
        </View>

        {formMessage ? (
          <View accessibilityRole="alert" style={styles.formMessage}>
            <Text selectable style={styles.formMessageText}>{formMessage}</Text>
            {needsAuthentication ? <AppButton onPress={() => void continueToSignIn()} style={styles.signInButton}>Sign in with email</AppButton> : null}
          </View>
        ) : null}

        <AppButton accessibilityHint="Sends this booking request to the creator" loading={isSubmitting} onPress={() => void submitRequest()} size="lg" style={styles.submit}>Send request</AppButton>
        <Text selectable style={styles.footnote}>No charge yet. You pay through WaveLens after {creator.display_name} accepts.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type BookingStyles = ReturnType<typeof createStyles>;

function Field({ label, optional = false, error, styles, children }: { label: string; optional?: boolean; error?: string; styles: BookingStyles; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{optional ? <Text style={styles.optional}>  Optional</Text> : null}</Text>
      {children}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function SummaryRow({ label, value, last = false, styles }: { label: string; value: string; last?: boolean; styles: BookingStyles }) {
  return (
    <View style={[styles.summaryRow, last && styles.summaryRowLast]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text selectable style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radius } = theme;
  return StyleSheet.create({
    page: { backgroundColor: colors.background, flex: 1 },
    screen: { alignSelf: "center", flexGrow: 1, maxWidth: 600, paddingBottom: 44, paddingHorizontal: 20, width: "100%" },
    centered: { alignItems: "center", backgroundColor: colors.background, flex: 1, gap: 16, justifyContent: "center" },
    title: { ...theme.display, color: colors.text, fontSize: 34, lineHeight: 38, marginTop: 8 },
    subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: 10 },
    spotRow: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, marginTop: 10 },
    spotRowInvalid: { borderBottomColor: colors.warning, borderBottomWidth: 2 },
    spotText: { color: colors.accentText, fontSize: 15, fontWeight: "700" },
    field: { marginTop: 26 },
    label: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 10 },
    optional: { color: colors.textFaint, fontSize: 13, fontWeight: "500" },
    error: { color: colors.warning, fontSize: 13, marginTop: 8 },
    invalid: { borderColor: colors.warning, borderRadius: radius.md, borderWidth: 1.5 },
    segmented: { backgroundColor: colors.surface, borderCurve: "continuous", borderRadius: radius.md, flexDirection: "row", padding: 3 },
    segment: { alignItems: "center", borderCurve: "continuous", borderRadius: Math.max(radius.md - 3, 2), flex: 1, justifyContent: "center", minHeight: 42 },
    segmentSelected: { backgroundColor: colors.inverse },
    segmentText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
    segmentTextSelected: { color: colors.onInverse, fontWeight: "700" },
    input: { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: "continuous", borderRadius: radius.md, borderWidth: 1, color: colors.text, fontSize: 16, minHeight: 52, paddingHorizontal: 16, paddingVertical: 14 },
    notesInput: { minHeight: 110 },
    total: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 32, paddingTop: 20 },
    totalLabel: { color: colors.text, fontSize: 16, fontWeight: "700" },
    totalDetail: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
    totalValue: { color: colors.text, fontSize: 28, fontVariant: ["tabular-nums"], fontWeight: "800" },
    formMessage: { backgroundColor: colors.warningSoft, borderCurve: "continuous", borderRadius: radius.md, marginTop: 20, padding: 14 },
    formMessageText: { color: colors.text, fontSize: 14, lineHeight: 20 },
    signInButton: { marginTop: 12 },
    submit: { marginTop: 20 },
    footnote: { color: colors.textFaint, fontSize: 13, lineHeight: 19, marginTop: 12, textAlign: "center" },
    confirmationScreen: { justifyContent: "center" },
    confirmationActions: { gap: 10, marginTop: 28 },
    successIcon: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 30, height: 60, justifyContent: "center", marginBottom: 16, width: 60 },
    summary: { backgroundColor: colors.surface, borderCurve: "continuous", borderRadius: radius.lg, marginTop: 24, paddingHorizontal: 16 },
    summaryRow: { borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", gap: 16, justifyContent: "space-between", paddingVertical: 14 },
    summaryRowLast: { borderBottomWidth: 0 },
    summaryLabel: { color: colors.textMuted, fontSize: 15 },
    summaryValue: { color: colors.text, flexShrink: 1, fontSize: 15, fontWeight: "600", textAlign: "right" },
  });
}

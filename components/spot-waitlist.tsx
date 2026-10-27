import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";
import { supabase } from "@/lib/supabase";

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Shown when no photographer works at a break yet. Each signup is proof of demand we can show photographers we recruit.
export function SpotWaitlist({ spot }: { spot: string }) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "joined">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      if (data.user.email) setEmail((current) => current || data.user.email!);
    });
  }, []);

  async function join() {
    const cleanEmail = email.trim().toLowerCase();
    if (!emailPattern.test(cleanEmail)) {
      setError("Enter an email address we can reach you at.");
      return;
    }
    setError("");
    setStatus("sending");
    const { error: insertError } = await supabase.from("spot_waitlist").insert({ email: cleanEmail, surf_spot: spot, user_id: userId });
    // 23505 means this email is already on this spot's list, which is fine.
    if (insertError && insertError.code !== "23505") {
      setStatus("idle");
      setError("We couldn't save that just now. Please try again.");
      return;
    }
    setStatus("joined");
  }

  if (status === "joined") {
    return (
      <View accessibilityLiveRegion="polite" style={styles.card}>
        <View style={styles.doneIcon}><IconSymbol color={theme.colors.onAccent} name="checkmark" size={22} /></View>
        <Text style={styles.title}>You&apos;re on the list for {spot}.</Text>
        <Text style={styles.body}>We&apos;ll email you as soon as a photographer starts working there. In the meantime, you can still book someone below who travels.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>No photographers at {spot} yet</Text>
      <Text style={styles.body}>Want one? Leave your email and we&apos;ll find a local photographer for this break and let you know when they join.</Text>
      <View style={styles.form}>
        <TextInput
          accessibilityLabel="Your email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          inputMode="email"
          keyboardType="email-address"
          onChangeText={(value) => { setEmail(value); setError(""); }}
          onSubmitEditing={() => void join()}
          placeholder="you@example.com"
          placeholderTextColor={theme.colors.textFaint}
          returnKeyType="send"
          style={[styles.input, error ? styles.inputInvalid : null]}
          textContentType="emailAddress"
          value={email}
        />
        <AppButton loading={status === "sending"} onPress={() => void join()}>Notify me</AppButton>
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Text style={styles.fine}>We&apos;ll only email you about photographers at this spot.</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radius } = theme;
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: "continuous", borderRadius: radius.lg, borderWidth: 1, gap: 10, marginBottom: 24, padding: 20 },
    title: { ...theme.heading, color: colors.text, fontSize: 20 },
    body: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    form: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
    input: { backgroundColor: colors.background, borderColor: colors.border, borderCurve: "continuous", borderRadius: radius.md, borderWidth: 1, color: colors.text, flexBasis: 220, flexGrow: 1, fontSize: 16, minHeight: 48, paddingHorizontal: 14 },
    inputInvalid: { borderColor: colors.warning },
    error: { color: colors.warning, fontSize: 13 },
    fine: { color: colors.textFaint, fontSize: 12 },
    doneIcon: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  });
}

import { supabase } from "@/lib/supabase";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type PayoutStatus = { charges: boolean; payouts: boolean; submitted: boolean };

export default function CreatorPayoutsScreen() {
  const [status, setStatus] = useState<PayoutStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.from("creator_payout_accounts")
      .select("charges_enabled, payouts_enabled, details_submitted")
      .maybeSingle();
    if (error) setMessage(error.message);
    else if (!data) setStatus({ charges: false, payouts: false, submitted: false });
    else setStatus({ charges: data.charges_enabled, payouts: data.payouts_enabled, submitted: data.details_submitted });
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function startOnboarding() {
    setStarting(true);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("create-stripe-connect-account", { method: "POST" });
      if (error || data?.error) throw new Error(data?.error ?? error?.message ?? "Could not start payout setup.");
      if (data.ready) {
        setStatus({ charges: true, payouts: true, submitted: true });
        setMessage("Your Stripe account is ready to receive payouts.");
      } else if (data.url) {
        await Linking.openURL(data.url);
        setMessage("Finish the Stripe form, then return here and refresh your status.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start payout setup.");
    } finally {
      setStarting(false);
    }
  }

  const ready = Boolean(status?.charges && status?.payouts);
  return <ScrollView contentContainerStyle={styles.screen}>
    <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Back</Text></Pressable>
    <Text style={styles.eyebrow}>CREATOR PAYOUTS</Text><Text style={styles.title}>Get paid through WaveLens</Text>
    <Text style={styles.subtitle}>Stripe securely verifies your identity and sends your earnings to your bank. WaveLens never stores your bank or card details.</Text>
    {loading ? <View style={styles.state}><ActivityIndicator color="#56d6c9" /></View> : <>
      <View style={styles.card}><Text style={[styles.badge, ready && styles.ready]}>{ready ? "READY FOR PAYOUTS" : "SETUP REQUIRED"}</Text><Text style={styles.cardTitle}>{ready ? "Your payout account is connected" : "Connect your Stripe account"}</Text><Text style={styles.body}>{ready ? "Surfers can pay for accepted sessions. Stripe will route your share to this connected account." : "Stripe will ask for your legal identity and bank information. This is required before a surfer can pay you."}</Text></View>
      <Pressable disabled={starting} onPress={() => void startOnboarding()} style={[styles.button, starting && styles.disabled]}><Text style={styles.buttonText}>{starting ? "Opening Stripe…" : ready ? "Refresh Stripe status" : "Set up payouts with Stripe"}</Text></Pressable>
      {message ? <Text accessibilityLiveRegion="polite" selectable style={styles.message}>{message}</Text> : null}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { alignSelf: "center", backgroundColor: "#061827", flexGrow: 1, maxWidth: 680, padding: 20, paddingBottom: 44, width: "100%" },
  back: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44 }, backText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "900", letterSpacing: 1.5, marginTop: 16 }, title: { color: "#fff", fontSize: 38, fontWeight: "900", marginTop: 10 },
  subtitle: { color: "#b9c9d6", fontSize: 16, lineHeight: 24, marginTop: 10 }, state: { alignItems: "center", paddingTop: 80 },
  card: { backgroundColor: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.13)", borderRadius: 18, borderWidth: 1, gap: 10, marginTop: 28, padding: 18 },
  badge: { color: "#ffd4a3", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 }, ready: { color: "#7ce0d6" }, cardTitle: { color: "#fff", fontSize: 20, fontWeight: "900" }, body: { color: "#b9c9d6", fontSize: 15, lineHeight: 22 },
  button: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 14, justifyContent: "center", marginTop: 18, minHeight: 54 }, buttonText: { color: "#061827", fontSize: 16, fontWeight: "900" }, disabled: { opacity: .6 },
  message: { color: "#ffd4a3", fontSize: 14, lineHeight: 20, marginTop: 14, textAlign: "center" },
});


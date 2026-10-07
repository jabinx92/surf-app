import { supabase } from "@/lib/supabase";
import { useStripe } from "@stripe/stripe-react-native";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function BookingPayment({ bookingId, estimatedAmountCents, onSubmitted }: { bookingId: string; estimatedAmountCents: number; onSubmitted: () => void }) {
  if (!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return <View style={styles.notice}><Text style={styles.noticeText}>Payments are not configured in this build yet.</Text></View>;
  }
  return <ConfiguredPayment bookingId={bookingId} estimatedAmountCents={estimatedAmountCents} onSubmitted={onSubmitted} />;
}

function ConfiguredPayment({ bookingId, estimatedAmountCents, onSubmitted }: { bookingId: string; estimatedAmountCents: number; onSubmitted: () => void }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function pay() {
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("create-booking-payment", { body: { bookingId } });
      if (error || !data?.clientSecret) throw new Error(data?.error ?? error?.message ?? "Could not prepare payment.");
      const initialized = await initPaymentSheet({
        merchantDisplayName: "WaveLens",
        paymentIntentClientSecret: data.clientSecret,
        returnURL: Linking.createURL("payment-complete"),
      });
      if (initialized.error) throw new Error(initialized.error.message);
      const result = await presentPaymentSheet();
      if (result.error) {
        if (result.error.code !== "Canceled") setMessage(result.error.message);
        return;
      }
      setMessage("Payment submitted. Stripe is confirming it now.");
      onSubmitted();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not complete payment.");
    } finally {
      setLoading(false);
    }
  }

  return <View style={styles.container}>
    <View style={styles.summary}><Text style={styles.summaryLabel}>SESSION TOTAL</Text><Text style={styles.total}>{formatUsd(estimatedAmountCents)}</Text></View>
    <Pressable accessibilityRole="button" disabled={loading} onPress={() => void pay()} style={[styles.button, loading && styles.disabled]}><Text style={styles.buttonText}>{loading ? "Opening secure checkout…" : `Pay ${formatUsd(estimatedAmountCents)}`}</Text></Pressable>
    <Text style={styles.caption}>Secure payment powered by Stripe. The creator receives their share through WaveLens.</Text>
    {message ? <Text accessibilityLiveRegion="polite" selectable style={styles.message}>{message}</Text> : null}
  </View>;
}

function formatUsd(amountCents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);
}

const styles = StyleSheet.create({
  container: { backgroundColor: "rgba(86,214,201,.08)", borderColor: "rgba(86,214,201,.25)", borderRadius: 18, borderWidth: 1, gap: 12, marginTop: 18, padding: 17 },
  summary: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { color: "#7ce0d6", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  total: { color: "#ffffff", fontSize: 24, fontWeight: "900" },
  button: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 13, justifyContent: "center", minHeight: 52 },
  buttonText: { color: "#061827", fontSize: 16, fontWeight: "900" },
  caption: { color: "#91a8b8", fontSize: 12, lineHeight: 18, textAlign: "center" },
  message: { color: "#ffd4a3", fontSize: 13, lineHeight: 19, textAlign: "center" },
  disabled: { opacity: .6 },
  notice: { backgroundColor: "rgba(245,184,65,.1)", borderRadius: 14, marginTop: 18, padding: 14 },
  noticeText: { color: "#ffd4a3", fontSize: 14, lineHeight: 20 },
});


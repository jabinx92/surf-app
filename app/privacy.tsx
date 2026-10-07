import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const effectiveDate = "July 16, 2026";

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic">
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
      <Text style={styles.eyebrow}>WAVELENS</Text>
      <Text style={styles.title}>Privacy policy</Text>
      <Text style={styles.date}>Effective {effectiveDate}</Text>

      <Section title="What this covers">
        WaveLens helps surfers request photography and video sessions from approved local creators. This policy explains what information we handle when you use the app.
      </Section>
      <Section title="Information we collect">
        We collect the email address used to create your account. When you request a session, we collect the selected creator, surf spot, service type, session date and length, your note, and the contact details you choose to provide. Creator applicants provide their profile details, portfolio link, services, hourly rates, biography, and travel range.
      </Section>
      <Section title="Location">
        If you allow location access, WaveLens uses your approximate current location only while the app is in use to sort nearby surf spots. We do not request background location access.
      </Section>
      <Section title="How information is shared">
        When you send a booking request, the selected creator can view the request details and the contact information you supplied so they can respond. Public creator profiles show only the details that WaveLens approved for listing. We do not sell personal information.
      </Section>
      <Section title="Service providers">
        WaveLens uses Supabase for account authentication and database storage. Your information is processed to operate the marketplace, secure accounts, and deliver booking requests.
      </Section>
      <Section title="Payments">
        Payments and creator payouts are processed by Stripe. WaveLens stores the amount, payment status, and Stripe transaction identifiers needed to operate the booking, but does not store full card or bank-account details.
      </Section>
      <Section title="Your choices">
        You can sign out or permanently delete your account and associated booking data in the Account screen. To request access to account information, contact WaveLens using the support address published on the App Store listing.
      </Section>
      <Section title="Changes">
        We may update this policy as WaveLens grows. The effective date above shows when it was last revised.
      </Section>
    </ScrollView>
  );
}

function Section({ children, title }: { children: string; title: string }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#061827", flexGrow: 1, padding: 20, paddingBottom: 52 },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backButtonText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginTop: 16 },
  title: { color: "#ffffff", fontSize: 38, fontWeight: "800", letterSpacing: -1.3, marginTop: 10 },
  date: { color: "#91a8b8", fontSize: 14, marginTop: 8 },
  section: { marginTop: 28 },
  sectionTitle: { color: "#ffffff", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  body: { color: "#c6d6de", fontSize: 16, lineHeight: 24 },
});

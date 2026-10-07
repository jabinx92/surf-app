import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SupportScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic">
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
      <Text style={styles.eyebrow}>WAVELENS SUPPORT</Text>
      <Text style={styles.title}>Help with your session.</Text>
      <Text selectable style={styles.subtitle}>WaveLens connects surfers with approved local creators and provides secure session payments through Stripe after a request is accepted.</Text>
      <SupportItem title="Booking requests">Choose your surf spot, date, session length, and contact preference before you send a request. The creator can accept or decline it from their dashboard.</SupportItem>
      <SupportItem title="Payments">Pay only through the secure checkout shown on an accepted booking. If a paid booking must be cancelled or refunded, contact WaveLens support before changing the session.</SupportItem>
      <SupportItem title="Creator profiles">Only creators approved by WaveLens appear in the public directory. Review a creator&apos;s portfolio, services, travel range, and starting hourly rate before requesting a session.</SupportItem>
      <SupportItem title="Privacy and account deletion">You can permanently delete your account and associated booking data from Account. Read the full privacy policy in the Account screen.</SupportItem>
      <View style={styles.note}>
        <Text selectable style={styles.noteText}>Need more help? Email the WaveLens support team.</Text>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("mailto:jabinx92@gmail.com")}>
          <Text selectable style={styles.email}>jabinx92@gmail.com</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SupportItem({ children, title }: { children: string; title: string }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><Text selectable style={styles.body}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { alignSelf: "center", backgroundColor: "#061827", flexGrow: 1, maxWidth: 680, padding: 20, paddingBottom: 52, width: "100%" },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backButtonText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginTop: 16 },
  title: { color: "#ffffff", fontSize: 38, fontWeight: "800", letterSpacing: -1.3, lineHeight: 44, marginTop: 10 },
  subtitle: { color: "#b9c9d6", fontSize: 16, lineHeight: 24, marginTop: 12 },
  section: { marginTop: 28 },
  sectionTitle: { color: "#ffffff", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  body: { color: "#c6d6de", fontSize: 16, lineHeight: 24 },
  note: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, marginTop: 28, padding: 16 },
  noteText: { color: "#91a8b8", fontSize: 13, lineHeight: 19 },
  email: { color: "#7ce0d6", fontSize: 15, fontWeight: "700", marginTop: 8, textDecorationLine: "underline" },
});

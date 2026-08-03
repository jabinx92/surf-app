import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthForm from "@/components/AuthForm";
import FeedbackPressable from "@/components/feedback-pressable";

const valueProps = [
  ["Discover", "Find a local surf photographer or filmmaker around your break."],
  ["Choose", "Review their work, style, coverage, and hourly rate."],
  ["Book", "Send a request with the session details that matter."],
];

const shareUrl = "https://wavelens.expo.app";
const shareMessage =
  "I found WaveLens—a better way to book surf photographers and videographers for your next session.";

export default function HomeScreen() {
  const [showAuth, setShowAuth] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 820;

  async function shareWaveLens() {
    try {
      if (process.env.EXPO_OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ text: shareMessage, title: "Share WaveLens", url: shareUrl });
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          Alert.alert("WaveLens link copied", "Paste it into a message to share it with a friend.");
        } else {
          Alert.alert("Share WaveLens", shareUrl);
        }
        return;
      }

      await Share.share(
        process.env.EXPO_OS === "ios"
          ? { message: shareMessage, title: "Share WaveLens", url: shareUrl }
          : { message: `${shareMessage}\n\n${shareUrl}`, title: "Share WaveLens" },
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      Alert.alert("Could not share WaveLens", "Please try again in a moment.");
    }
  }

  if (showAuth) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <StatusBar style="dark" />
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.authContent}>
          <Pressable accessibilityRole="button" onPress={() => setShowAuth(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to WaveLens</Text>
          </Pressable>
          <View style={styles.authCard}>
            <Text style={styles.authEyebrow}>WELCOME BACK</Text>
            <Text style={styles.authTitle}>Your next session starts here.</Text>
            <AuthForm onAuthenticated={() => setShowAuth(false)} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.shell, isWide && styles.shellWide]}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => router.push("/")} style={styles.brand}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>W</Text></View>
              <Text style={styles.brandName}>WaveLens</Text>
            </Pressable>
            {isWide ? (
              <View style={styles.desktopNav}>
                <Pressable accessibilityRole="link" onPress={() => router.push("/location")} style={styles.navLink}>
                  <Text style={styles.navLinkText}>Explore spots</Text>
                </Pressable>
                <Pressable accessibilityRole="link" onPress={() => router.push("/creators")} style={styles.navLink}>
                  <Text style={styles.navLinkText}>Find creators</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.headerActions}>
              <Pressable accessibilityRole="button" onPress={() => router.push("/become-a-creator")} style={styles.creatorLink}>
                <Text style={styles.creatorLinkText}>For creators</Text>
              </Pressable>
              <Pressable accessibilityLabel="Open account" accessibilityRole="button" onPress={() => router.push("/account")} style={styles.accountButton}>
                <Text style={styles.accountButtonText}>Account</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.heroLayout, isWide && styles.heroLayoutWide]}>
            <View style={[styles.heroCopy, isWide && styles.heroCopyWide]}>
              <View style={styles.eyebrow}><View style={styles.liveDot} /><Text style={styles.eyebrowText}>SURF MEDIA, MADE SIMPLE</Text></View>
              <Text style={[styles.headline, isWide && styles.headlineWide]}>The better way to remember your best sessions.</Text>
              <Text style={styles.description}>Book a photographer or videographer to capture your next surf session.</Text>
              <View style={styles.heroActions}>
                <FeedbackPressable accessibilityRole="button" haptic="light" onPress={() => router.push("/location")} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Find a creator</Text>
                  <Text style={styles.buttonArrow}>-&gt;</Text>
                </FeedbackPressable>
                <Pressable accessibilityRole="button" onPress={() => router.push("/become-a-creator")} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>I shoot surf</Text>
                </Pressable>
              </View>
              <Text style={styles.microcopy}>Built for surf sessions, not generic photo shoots.</Text>
            </View>

            <View style={[styles.featureCard, isWide && styles.featureCardWide]}>
              <View style={styles.featureTopRow}>
                <View><Text style={styles.featureLabel}>YOUR SESSION</Text><Text style={styles.featureTitle}>A local eye on the lineup.</Text></View>
                <View style={styles.featureBadge}><Text style={styles.featureBadgeText}>W</Text></View>
              </View>
              <View style={styles.breakLine} />
              <View style={styles.featureDetail}><Text style={styles.featureDetailLabel}>DISCOVER</Text><Text style={styles.featureDetailText}>Photo, video, and drone coverage</Text></View>
              <View style={styles.featureDetail}><Text style={styles.featureDetailLabel}>BOOK</Text><Text style={styles.featureDetailText}>Share your break and session details</Text></View>
              <View style={styles.featureDetail}><Text style={styles.featureDetailLabel}>REMEMBER</Text><Text style={styles.featureDetailText}>Keep the wave long after it is gone</Text></View>
              <View style={styles.featureFooter}><Text style={styles.featureFooterText}>Made for the coast</Text><View style={styles.waveMark}><View style={styles.waveMarkInner} /></View></View>
            </View>
          </View>

          <View style={styles.valueSection}>
            <Text style={styles.sectionEyebrow}>HOW WAVELENS WORKS</Text>
            <View style={[styles.valueGrid, isWide && styles.valueGridWide]}>
              {valueProps.map(([title, description], index) => (
                <View key={title} style={styles.valueCard}>
                  <Text style={styles.valueNumber}>0{index + 1}</Text>
                  <Text style={styles.valueTitle}>{title}</Text>
                  <Text style={styles.valueText}>{description}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.shareCard, isWide && styles.shareCardWide]}>
            <View style={styles.shareMark}>
              <Text style={styles.shareMarkText}>W</Text>
            </View>
            <View style={styles.shareCopy}>
              <Text style={[styles.shareEyebrow, isWide && styles.shareTextWide]}>SHARE THE STOKE</Text>
              <Text style={[styles.shareTitle, isWide && styles.shareTextWide]}>Know someone who lives for the next swell?</Text>
              <Text style={[styles.shareText, isWide && styles.shareTextWide]}>Send them WaveLens and help their best session live beyond the lineup.</Text>
            </View>
            <FeedbackPressable
              accessibilityHint="Opens your device share menu"
              accessibilityRole="button"
              haptic="light"
              onPress={() => void shareWaveLens()}
              style={styles.shareButton}
            >
              <Text style={styles.shareButtonIcon}>↗</Text>
              <Text style={styles.shareButtonText}>Share WaveLens</Text>
            </FeedbackPressable>
          </View>

          <View style={styles.bottomCallout}>
            <View><Text style={styles.bottomCalloutTitle}>Shoot the sessions people talk about.</Text><Text style={styles.bottomCalloutText}>Apply to join the WaveLens creator community.</Text></View>
            <Pressable accessibilityRole="button" onPress={() => router.push("/become-a-creator")} style={styles.calloutButton}><Text style={styles.calloutButtonText}>Apply now</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#061827" },
  scrollContent: { paddingBottom: 28 },
  shell: { alignSelf: "center", maxWidth: 640, paddingHorizontal: 20, width: "100%" },
  shellWide: { maxWidth: 1160, paddingHorizontal: 40 },
  topGlow: { backgroundColor: "rgba(86,214,201,0.12)", borderRadius: 260, height: 520, pointerEvents: "none", position: "absolute", right: -230, top: -220, width: 520 },
  bottomGlow: { backgroundColor: "rgba(31,106,153,0.18)", borderRadius: 330, bottom: -340, height: 660, left: -310, pointerEvents: "none", position: "absolute", width: 660 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 72 },
  brand: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 44 },
  brandMark: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 12, height: 34, justifyContent: "center", width: 34 },
  brandMarkText: { color: "#061827", fontSize: 17, fontWeight: "900" },
  brandName: { color: "#ffffff", fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  desktopNav: { alignItems: "center", flexDirection: "row", gap: 8 },
  navLink: { borderCurve: "continuous", borderRadius: 12, justifyContent: "center", minHeight: 40, paddingHorizontal: 13 },
  navLinkText: { color: "#9fb5c4", fontSize: 13, fontWeight: "700" },
  headerActions: { alignItems: "center", flexDirection: "row", gap: 16 },
  creatorLink: { minHeight: 42, justifyContent: "center" },
  creatorLinkText: { color: "#b9c9d6", fontSize: 14, fontWeight: "700" },
  accountButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.14)", borderCurve: "continuous", borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 40, paddingHorizontal: 14 },
  accountButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  heroLayout: { gap: 36, paddingBottom: 48, paddingTop: 58 },
  heroLayoutWide: { alignItems: "center", flexDirection: "row", gap: 72, minHeight: 620, paddingBottom: 82, paddingTop: 74 },
  heroCopy: { flex: 1, maxWidth: 600 },
  heroCopyWide: { flexBasis: 0, minWidth: 0 },
  eyebrow: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(86,214,201,0.1)", borderColor: "rgba(86,214,201,0.25)", borderCurve: "continuous", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 8, paddingHorizontal: 11, paddingVertical: 7 },
  liveDot: { backgroundColor: "#7ce0d6", borderRadius: 4, height: 7, width: 7 },
  eyebrowText: { color: "#8aede2", fontSize: 10, fontWeight: "800", letterSpacing: 1.25 },
  headline: { color: "#ffffff", fontSize: 47, fontWeight: "800", letterSpacing: -2.1, lineHeight: 51, marginTop: 24, maxWidth: 570 },
  headlineWide: { fontSize: 58, letterSpacing: -2.8, lineHeight: 62 },
  description: { color: "#b9c9d6", fontSize: 17, lineHeight: 26, marginTop: 20, maxWidth: 500 },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 30 },
  primaryButton: { alignItems: "center", backgroundColor: "#56d6c9", borderCurve: "continuous", borderRadius: 16, flexDirection: "row", gap: 15, justifyContent: "center", minHeight: 56, paddingHorizontal: 21 },
  primaryButtonText: { color: "#061827", fontSize: 16, fontWeight: "900" },
  buttonArrow: { color: "#061827", fontSize: 17, fontWeight: "900" },
  secondaryButton: { alignItems: "center", borderColor: "rgba(255,255,255,0.21)", borderCurve: "continuous", borderRadius: 16, borderWidth: 1, justifyContent: "center", minHeight: 56, paddingHorizontal: 20 },
  secondaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  microcopy: { color: "#718b9b", fontSize: 12, marginTop: 18 },
  featureCard: { backgroundColor: "rgba(16,42,57,0.92)", borderColor: "rgba(255,255,255,0.13)", borderCurve: "continuous", borderRadius: 28, borderWidth: 1, boxShadow: "0 18px 36px rgba(0, 0, 0, 0.22)", minHeight: 340, padding: 24, width: "100%" },
  featureCardWide: { flexBasis: 410, flexShrink: 0, maxWidth: 410, minHeight: 410, width: "auto" },
  featureTopRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  featureLabel: { color: "#8aede2", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  featureTitle: { color: "#ffffff", fontSize: 25, fontWeight: "800", letterSpacing: -0.8, lineHeight: 30, marginTop: 8, maxWidth: 220 },
  featureBadge: { alignItems: "center", backgroundColor: "rgba(86,214,201,0.14)", borderColor: "rgba(86,214,201,0.27)", borderRadius: 17, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  featureBadgeText: { color: "#7ce0d6", fontSize: 20, fontWeight: "900" },
  breakLine: { backgroundColor: "rgba(255,255,255,0.12)", height: 1, marginVertical: 24 },
  featureDetail: { flexDirection: "row", gap: 14, marginBottom: 17 },
  featureDetailLabel: { color: "#7892a3", fontSize: 10, fontWeight: "900", letterSpacing: 0.7, paddingTop: 3, width: 78 },
  featureDetailText: { color: "#d9e5ec", flex: 1, fontSize: 14, lineHeight: 19 },
  featureFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: "auto", paddingTop: 7 },
  featureFooterText: { color: "#8fb3c9", fontSize: 12, fontWeight: "700" },
  waveMark: { borderBottomColor: "#56d6c9", borderBottomWidth: 2, borderRadius: 20, height: 16, overflow: "hidden", width: 46 },
  waveMarkInner: { backgroundColor: "rgba(86,214,201,0.35)", borderRadius: 22, height: 24, left: 12, position: "absolute", top: 3, width: 28 },
  valueSection: { borderTopColor: "rgba(255,255,255,0.12)", borderTopWidth: 1, paddingTop: 30 },
  sectionEyebrow: { color: "#8aede2", fontSize: 11, fontWeight: "800", letterSpacing: 1.3, marginBottom: 15 },
  valueGrid: { gap: 10 },
  valueGridWide: { flexDirection: "row", gap: 16 },
  valueCard: { backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.1)", borderCurve: "continuous", borderRadius: 20, borderWidth: 1, flex: 1, minHeight: 150, padding: 18 },
  valueNumber: { color: "#56d6c9", fontSize: 12, fontWeight: "900", letterSpacing: 1.1 },
  valueTitle: { color: "#ffffff", fontSize: 20, fontWeight: "800", letterSpacing: -0.5, marginTop: 22 },
  valueText: { color: "#9bb2c1", fontSize: 13, lineHeight: 19, marginTop: 7 },
  shareCard: { alignItems: "center", backgroundColor: "rgba(16,42,57,0.92)", borderColor: "rgba(86,214,201,0.24)", borderCurve: "continuous", borderRadius: 24, borderWidth: 1, gap: 16, marginTop: 34, padding: 22 },
  shareCardWide: { flexDirection: "row", paddingHorizontal: 28, paddingVertical: 25 },
  shareMark: { alignItems: "center", backgroundColor: "rgba(86,214,201,0.14)", borderColor: "rgba(86,214,201,0.3)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, height: 52, justifyContent: "center", width: 52 },
  shareMarkText: { color: "#7ce0d6", fontSize: 22, fontWeight: "900" },
  shareCopy: { flex: 1 },
  shareEyebrow: { color: "#8aede2", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textAlign: "center" },
  shareTitle: { color: "#ffffff", fontSize: 21, fontWeight: "900", letterSpacing: -0.6, lineHeight: 26, marginTop: 7, textAlign: "center" },
  shareText: { color: "#9bb2c1", fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: "center" },
  shareTextWide: { textAlign: "left" },
  shareButton: { alignItems: "center", backgroundColor: "#ffffff", borderCurve: "continuous", borderRadius: 15, flexDirection: "row", gap: 9, justifyContent: "center", minHeight: 50, paddingHorizontal: 18 },
  shareButtonPressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  shareButtonIcon: { color: "#061827", fontSize: 17, fontWeight: "900" },
  shareButtonText: { color: "#061827", fontSize: 14, fontWeight: "900" },
  bottomCallout: { alignItems: "center", backgroundColor: "#56d6c9", borderCurve: "continuous", borderRadius: 24, flexDirection: "row", flexWrap: "wrap", gap: 18, justifyContent: "space-between", marginTop: 34, padding: 22 },
  bottomCalloutTitle: { color: "#061827", fontSize: 21, fontWeight: "900", letterSpacing: -0.7 },
  bottomCalloutText: { color: "#174457", fontSize: 13, marginTop: 5 },
  calloutButton: { alignItems: "center", backgroundColor: "#061827", borderCurve: "continuous", borderRadius: 14, justifyContent: "center", minHeight: 46, paddingHorizontal: 17 },
  calloutButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  authScreen: { flex: 1, backgroundColor: "#eff5f7" },
  authContent: { alignSelf: "center", maxWidth: 520, minHeight: "100%", padding: 22, width: "100%" },
  backButton: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
  backButtonText: { color: "#174457", fontSize: 15, fontWeight: "800" },
  authCard: { backgroundColor: "#ffffff", borderColor: "#d9e5ec", borderCurve: "continuous", borderRadius: 24, borderWidth: 1, boxShadow: "0 12px 30px rgba(6, 24, 39, 0.09)", marginTop: 24, padding: 24 },
  authEyebrow: { color: "#167f78", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  authTitle: { color: "#061827", fontSize: 29, fontWeight: "800", letterSpacing: -1, lineHeight: 35, marginBottom: 22, marginTop: 8 },
});

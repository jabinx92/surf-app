import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FeedbackPressable from "@/components/feedback-pressable";
import { AppButton } from "@/components/ui/app-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { HeroVideo } from "@/components/ui/hero-video";
import { homeHeroMedia } from "@/constants/media";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { TopBar } from "@/components/ui/top-bar";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";

const steps = [
  { icon: "mappin", title: "Pick your break", text: "Tell us where you're paddling out." },
  { icon: "camera.fill", title: "Choose a photographer", text: "See their work, gear, and hourly rate." },
  { icon: "checkmark", title: "Send a request", text: "They accept, you surf, the shots come to you." },
] as const;

const shareUrl = "https://wavelens.expo.app";
const shareMessage =
  "I found WaveLens—a better way to book surf photographers and videographers for your next session.";

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [hasHydrated, setHasHydrated] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = hasHydrated && width >= 820;

  useEffect(() => {
    const timer = setTimeout(() => setHasHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.shell, isWide && styles.shellWide]}>
          <TopBar
            right={
              <>
                {isWide ? (
                  <FeedbackPressable accessibilityRole="link" haptic="none" onPress={() => router.push("/become-a-creator")} style={styles.navLink}>
                    <Text style={styles.navLinkText}>For creators</Text>
                  </FeedbackPressable>
                ) : null}
                <ThemeToggle />
                <FeedbackPressable accessibilityLabel="Account" accessibilityRole="button" haptic="none" onPress={() => router.push("/account")} style={styles.accountButton}>
                  <IconSymbol color={theme.colors.text} name="person.crop.circle" size={26} />
                </FeedbackPressable>
              </>
            }
          />

          <View style={[styles.hero, isWide && styles.heroWide]}>
            <View style={[styles.heroCopy, isWide && styles.heroCopyWide]}>
              <Text style={[styles.headline, isWide && styles.headlineWide]}>Your home break, professionally captured.</Text>
              <Text style={styles.description}>
                Book a local surf photographer or videographer for your next session. Pick a spot, choose your photographer, and send a request.
              </Text>
              <View style={styles.heroActions}>
                <AppButton arrow onPress={() => router.push("/location")} size="lg">Find a photographer</AppButton>
              </View>
            </View>

            <HeroVideo accessibilityLabel="Surfers riding a wave" key={theme.name} media={homeHeroMedia[theme.name]} style={[styles.heroPhoto, isWide && styles.heroPhotoWide]}>
              <View style={styles.photoCaption}>
                <IconSymbol color="#ffffff" name="camera.fill" size={14} />
                <Text style={styles.photoCaptionText}>Photo, video, and drone, delivered to your phone</Text>
              </View>
            </HeroVideo>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <View style={[styles.steps, isWide && styles.stepsWide]}>
              {steps.map((step) => (
                <View key={step.title} style={[styles.step, isWide && styles.stepWide]}>
                  <View style={styles.stepIcon}>
                    <IconSymbol color={theme.colors.accentText} name={step.icon} size={20} />
                  </View>
                  <View style={styles.stepCopy}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepText}>{step.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Mirror of the hero: clip on the left, words on the right. Uses the other look's clip so the page never shows the same one twice. */}
          <View style={[styles.hero, styles.aboutSection, isWide && styles.heroWide]}>
            <HeroVideo accessibilityLabel="A surfer riding a wave, filmed by drone" key={`about-${theme.name}`} media={homeHeroMedia[theme.name === "navy" ? "sport" : "navy"]} style={[styles.heroPhoto, isWide && styles.heroPhotoWide]}>
              <View style={styles.photoCaption}>
                <IconSymbol color="#ffffff" name="camera.fill" size={14} />
                <Text style={styles.photoCaptionText}>Find the photographers who know your break</Text>
              </View>
            </HeroVideo>
            <View style={[styles.heroCopy, isWide && styles.heroCopyWide]}>
              <Text style={[styles.headline, isWide && styles.headlineWide]}>Why WaveLens.</Text>
              <Text style={styles.description}>
                Four years of surfing, and still no good photo of a single wave. Surf photographers are hard to find when you&apos;re not part of the local crew, so we built a way to find them.
              </Text>
              <View style={styles.heroActions}>
                <AppButton arrow onPress={() => router.push("/about")} size="lg" variant="secondary">Read the story</AppButton>
              </View>
            </View>
          </View>

          <View style={[styles.creatorBand, isWide && styles.creatorBandWide]}>
            <View style={styles.creatorCopy}>
              <Text style={styles.creatorTitle}>You shoot surf?</Text>
              <Text style={styles.creatorText}>Get booked by surfers at the breaks you already shoot.</Text>
            </View>
            <FeedbackPressable accessibilityRole="button" haptic="light" onPress={() => router.push("/become-a-creator")} style={({ hovered, pressed }) => [styles.creatorButton, (hovered || pressed) && styles.creatorButtonActive]}>
              <Text style={styles.creatorButtonText}>Apply as a creator</Text>
            </FeedbackPressable>
          </View>

          <View style={styles.footer}>
            <FeedbackPressable accessibilityHint="Opens your device share menu" accessibilityRole="button" haptic="light" onPress={() => void shareWaveLens()} style={styles.footerLink}>
              <IconSymbol color={theme.colors.textMuted} name="square.and.arrow.up" size={16} />
              <Text style={styles.footerLinkText}>Share WaveLens</Text>
            </FeedbackPressable>
            <View style={styles.footerLinks}>
              <FeedbackPressable accessibilityRole="link" haptic="none" onPress={() => router.push("/about")} style={styles.footerLink}>
                <Text style={styles.footerLinkText}>About</Text>
              </FeedbackPressable>
              <FeedbackPressable accessibilityRole="link" haptic="none" onPress={() => router.push("/privacy")} style={styles.footerLink}>
                <Text style={styles.footerLinkText}>Privacy</Text>
              </FeedbackPressable>
              <FeedbackPressable accessibilityRole="link" haptic="none" onPress={() => router.push("/support")} style={styles.footerLink}>
                <Text style={styles.footerLinkText}>Support</Text>
              </FeedbackPressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radius } = theme;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 32 },
    shell: { alignSelf: "center", maxWidth: 640, paddingHorizontal: 20, width: "100%" },
    shellWide: { maxWidth: 1160, paddingHorizontal: 40 },
    navLink: { justifyContent: "center", minHeight: 44, paddingHorizontal: 8 },
    navLinkText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
    accountButton: { alignItems: "center", height: 44, justifyContent: "center", width: 40 },

    hero: { gap: 28, paddingBottom: 40, paddingTop: 20 },
    heroWide: { alignItems: "center", flexDirection: "row", gap: 56, paddingBottom: 72, paddingTop: 40 },
    heroCopy: { maxWidth: 560 },
    heroCopyWide: { flex: 1, minWidth: 0 },
    headline: { ...theme.display, color: colors.text, fontSize: 42, lineHeight: 46 },
    headlineWide: { fontSize: 60, lineHeight: 64 },
    description: { color: colors.textMuted, fontSize: 17, lineHeight: 26, marginTop: 16, maxWidth: 480 },
    heroActions: { alignItems: "flex-start", marginTop: 28 },
    heroPhoto: { aspectRatio: 4 / 3, justifyContent: "flex-end", width: "100%" },
    heroPhotoWide: { aspectRatio: 4 / 5, flexBasis: 440, flexShrink: 0, width: "auto" },
    photoCaption: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)", flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
    photoCaptionText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },

    section: { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 32 },
    sectionTitle: { ...theme.heading, color: colors.text, fontSize: 22, marginBottom: 20 },
    steps: { gap: 20 },
    stepsWide: { flexDirection: "row", gap: 32 },
    step: { flexDirection: "row", gap: 14 },
    stepWide: { flex: 1 },
    stepIcon: { alignItems: "center", backgroundColor: colors.accentSoft, borderRadius: radius.md, height: 40, justifyContent: "center", width: 40 },
    stepCopy: { flex: 1 },
    stepTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    stepText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 3 },

    aboutSection: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: 40 },

    creatorBand: { backgroundColor: colors.inverse, borderCurve: "continuous", borderRadius: radius.lg, gap: 18, marginTop: 44, padding: 24 },
    creatorBandWide: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 32 },
    creatorCopy: { flexShrink: 1 },
    creatorTitle: { ...theme.heading, color: colors.onInverse, fontSize: 22 },
    creatorText: { color: colors.onInverse, fontSize: 15, lineHeight: 22, marginTop: 4, opacity: 0.75 },
    creatorButton: { alignItems: "center", alignSelf: "flex-start", backgroundColor: colors.accent, borderCurve: "continuous", borderRadius: radius.md, justifyContent: "center", minHeight: 48, paddingHorizontal: 20 },
    creatorButtonActive: { backgroundColor: colors.accentPressed },
    creatorButtonText: { color: colors.onAccent, fontSize: 15, fontWeight: "700", ...(theme.name === "sport" ? { fontWeight: "900" as const, letterSpacing: 0.4, textTransform: "uppercase" as const, fontSize: 14 } : null) },

    footer: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between", marginTop: 32 },
    footerLinks: { flexDirection: "row", gap: 16 },
    footerLink: { alignItems: "center", flexDirection: "row", gap: 6, minHeight: 44 },
    footerLinkText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  });
}

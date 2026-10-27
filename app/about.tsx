import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";
import { TopBar } from "@/components/ui/top-bar";
import { homeHeroMedia } from "@/constants/media";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";

const etiquette = [
  { icon: "trash.fill", title: "Pick up your trash", text: "And someone else's, if you can. Leave the beach better than you found it." },
  { icon: "hand.wave.fill", title: "Be friendly to the locals", text: "Say hi, wait your turn, and respect the lineup. You're a guest at their break." },
] as const;

export default function AboutScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const photo = homeHeroMedia[theme.name];

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar back />
        <Text style={[styles.title, isWide && styles.titleWide]}>Why WaveLens exists</Text>
        <PhotoPlaceholder accessibilityLabel="Surfers riding a wave" aspect={photo.posterAspect} focus={photo.posterFocus} source={photo.poster} style={styles.photo} />

        <View style={styles.story}>
          <Text style={styles.lead}>
            I&apos;ve been surfing for about four years, and I still don&apos;t have a single good photo or video of myself on a wave.
          </Text>
          <Text style={styles.body}>
            It&apos;s not for lack of trying. Finding a surf photographer or videographer is surprisingly hard. Most of them work by word of mouth, and if you&apos;re not already part of the local crew, you never hear the word.
          </Text>
          <Text style={styles.body}>
            That&apos;s the thing about surfing: it can be hard to make friends in the water. Breaks are local, lineups can be territorial, and the new face in the water doesn&apos;t always get a warm welcome.
          </Text>
          <Text style={styles.body}>
            WaveLens is my attempt to make that easier. Pick your break, see the photographers and videographers who work there, and book one in a few taps.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A win-win</Text>
          <Text style={styles.body}>
            You go home with photos and video of your best waves. The photographer gets paid for their work. And when you travel to places like Bali or Mexico, where steady income can be harder to come by, booking a local photographer means your money supports a local business and the community around the break.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Be a good guest</Text>
          <View style={styles.etiquette}>
            {etiquette.map((item) => (
              <View key={item.title} style={styles.etiquetteRow}>
                <View style={styles.etiquetteIcon}><IconSymbol color={theme.colors.accentText} name={item.icon} size={20} /></View>
                <View style={styles.etiquetteCopy}>
                  <Text style={styles.etiquetteTitle}>{item.title}</Text>
                  <Text style={styles.etiquetteText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.signature}>Johnny, founder of WaveLens</Text>

        <AppButton arrow onPress={() => router.push("/location")} size="lg" style={styles.cta}>Find a photographer</AppButton>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radius } = theme;
  return StyleSheet.create({
    screen: { backgroundColor: colors.background, flex: 1 },
    content: { alignSelf: "center", maxWidth: 680, paddingBottom: 48, paddingHorizontal: 20, width: "100%" },
    title: { ...theme.display, color: colors.text, fontSize: 36, lineHeight: 40, marginTop: 8 },
    titleWide: { fontSize: 48, lineHeight: 52 },
    photo: { aspectRatio: 16 / 9, marginTop: 24, width: "100%" },
    story: { gap: 16, marginTop: 28 },
    lead: { color: colors.text, fontSize: 21, fontWeight: "600", lineHeight: 30 },
    body: { color: colors.textMuted, fontSize: 17, lineHeight: 27 },
    section: { borderTopColor: colors.border, borderTopWidth: 1, gap: 12, marginTop: 32, paddingTop: 28 },
    sectionTitle: { ...theme.heading, color: colors.text, fontSize: 22 },
    etiquette: { gap: 18 },
    etiquetteRow: { flexDirection: "row", gap: 14 },
    etiquetteIcon: { alignItems: "center", backgroundColor: colors.accentSoft, borderRadius: radius.md, height: 40, justifyContent: "center", width: 40 },
    etiquetteCopy: { flex: 1 },
    etiquetteTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    etiquetteText: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 3 },
    signature: { color: colors.textMuted, fontSize: 15, fontStyle: "italic", marginTop: 32 },
    cta: { alignSelf: "flex-start", marginTop: 24 },
  });
}

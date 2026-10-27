import CreatorCard from "@/components/creator-card";
import FeedbackPressable from "@/components/feedback-pressable";
import { AppButton } from "@/components/ui/app-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TopBar } from "@/components/ui/top-bar";
import type { Creator } from "@/data/creators";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";
import { supabase } from "@/lib/supabase";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreatorsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { spot } = useLocalSearchParams<{ spot?: string }>();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isWide = width >= 850;

  const loadCreators = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("id, display_name, city, services, portfolio_url, portfolio_urls, starting_rate, bio, travel_miles, avatar_url, avatar_color, is_verified, availability:creator_weekly_availability(weekday, start_time, end_time, surf_spot)")
        .eq("is_listed", true)
        .order("created_at", { ascending: false });
      if (error) {
        throw error;
      }
      const nextCreators = (data ?? []) as Creator[];
      nextCreators.sort((first, second) => {
        const firstMatch = first.availability?.some((slot) => !spot || !slot.surf_spot || slot.surf_spot === spot) ? 1 : 0;
        const secondMatch = second.availability?.some((slot) => !spot || !slot.surf_spot || slot.surf_spot === spot) ? 1 : 0;
        return secondMatch - firstMatch;
      });
      setCreators(nextCreators);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load creators right now.");
    } finally {
      setIsLoading(false);
    }
  }, [spot]);

  useFocusEffect(useCallback(() => { void loadCreators(); }, [loadCreators]));

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, isWide && styles.contentWide]}>
        <TopBar
          back="Breaks"
          right={
            <FeedbackPressable accessibilityLabel="Account" accessibilityRole="button" haptic="none" onPress={() => router.push("/account")} style={styles.accountButton}>
              <IconSymbol color={theme.colors.text} name="person.crop.circle" size={26} />
            </FeedbackPressable>
          }
        />
        <View style={styles.header}>
          {spot ? (
            <View style={styles.spotRow}>
              <IconSymbol color={theme.colors.accentText} name="mappin" size={16} />
              <Text style={styles.spotText}>{spot}</Text>
            </View>
          ) : null}
          <Text style={[styles.title, isWide && styles.titleWide]}>Local photographers</Text>
          <Text style={styles.subtitle}>Photographers, videographers, and drone pilots you can book for a session.</Text>
        </View>

        {isLoading ? (
          <View style={styles.state}><ActivityIndicator color={theme.colors.accent} /><Text selectable style={styles.stateText}>Finding creators…</Text></View>
        ) : message ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>We couldn&apos;t load creators.</Text>
            <Text selectable style={styles.stateText}>{message}</Text>
            <AppButton onPress={() => void loadCreators()} variant="secondary">Try again</AppButton>
          </View>
        ) : creators.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.stateTitle}>No one&apos;s listed here yet.</Text>
            <Text selectable style={styles.stateText}>We&apos;re still building the crew for this area. Check back soon — or if you shoot surf, apply to join.</Text>
            <AppButton onPress={() => router.push("/become-a-creator")} variant="secondary">Apply as a creator</AppButton>
          </View>
        ) : (
          <View style={[styles.list, isWide && styles.listWide]}>
            {creators.map((creator) => <View key={creator.id} style={isWide ? styles.listItemWide : undefined}><CreatorCard creator={creator} spot={spot} /></View>)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radius } = theme;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { alignSelf: "center", maxWidth: 640, paddingBottom: 40, paddingHorizontal: 20, width: "100%" },
    contentWide: { maxWidth: 1160, paddingHorizontal: 40 },
    accountButton: { alignItems: "center", height: 44, justifyContent: "center", width: 40 },
    header: { paddingBottom: 24, paddingTop: 12 },
    spotRow: { alignItems: "center", flexDirection: "row", gap: 6, marginBottom: 10 },
    spotText: { color: colors.accentText, fontSize: 15, fontWeight: "700" },
    title: { ...theme.display, color: colors.text, fontSize: 36, lineHeight: 40 },
    titleWide: { fontSize: 48, lineHeight: 52 },
    subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 23, marginTop: 10, maxWidth: 520 },
    list: { gap: 16 },
    listWide: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
    listItemWide: { flexBasis: "31%", flexGrow: 1, maxWidth: 380, minWidth: 270 },
    state: { alignItems: "center", gap: 12, justifyContent: "center", minHeight: 260 },
    stateTitle: { ...theme.heading, color: colors.text, fontSize: 20 },
    stateText: { color: colors.textMuted, fontSize: 15, lineHeight: 22, maxWidth: 440 },
    emptyCard: { alignItems: "flex-start", backgroundColor: colors.surface, borderCurve: "continuous", borderRadius: radius.lg, gap: 10, maxWidth: 560, padding: 24 },
  });
}

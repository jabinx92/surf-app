import CreatorCard from "@/components/creator-card";
import type { Creator } from "@/data/creators";
import { supabase } from "@/lib/supabase";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreatorsScreen() {
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
        .select("id, display_name, city, services, portfolio_url, starting_rate, bio, travel_miles, avatar_url, is_verified, availability:creator_weekly_availability(weekday, start_time, end_time, surf_spot)")
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
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, isWide && styles.contentWide]}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>&lt;- Back to breaks</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/account")} style={styles.accountButton}><Text style={styles.accountButtonText}>Account</Text></Pressable>
        </View>
        <View style={[styles.header, isWide && styles.headerWide]}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{(spot ?? "Selected surf spot").toUpperCase()}</Text>
            <Text style={[styles.title, isWide && styles.titleWide]}>Available surf creators</Text>
            <Text style={styles.subtitle}>Browse approved photographers, filmmakers, and drone operators ready for your session.</Text>
          </View>
          {isWide ? <View style={styles.breakCard}><Text style={styles.breakCardKicker}>SELECTED BREAK</Text><Text style={styles.breakCardTitle}>{spot ?? "All nearby spots"}</Text><Text style={styles.breakCardText}>Choose the style and coverage that fits your next session.</Text></View> : null}
        </View>

        {isLoading ? (
          <View style={[styles.state, isWide && styles.stateWide]}><ActivityIndicator color="#56d6c9" /><Text selectable style={styles.stateText}>Finding creators...</Text></View>
        ) : message ? (
          <View style={[styles.state, styles.stateCard, isWide && styles.stateWide]}><Text style={styles.stateKicker}>CREATOR NETWORK</Text><Text style={styles.stateTitle}>We could not reach the lineup.</Text><Text selectable style={styles.stateText}>{message}</Text><Pressable accessibilityRole="button" onPress={() => void loadCreators()} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable></View>
        ) : creators.length === 0 ? (
          <View style={[styles.emptyCard, isWide && styles.emptyCardWide]}><Text style={styles.emptyKicker}>CREATOR NETWORK</Text><Text style={styles.emptyTitle}>No creators are listed here yet.</Text><Text selectable style={styles.emptyText}>We are building the crew for this area. Check back soon, or apply to shoot with WaveLens.</Text><Pressable accessibilityRole="button" onPress={() => router.push("/become-a-creator")} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Apply as a creator</Text></Pressable></View>
        ) : (
          <View style={[styles.list, isWide && styles.listWide]}>{creators.map((creator) => <View key={creator.id} style={isWide ? styles.listItemWide : undefined}><CreatorCard creator={creator} spot={spot} /></View>)}</View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#061827" },
  content: { alignSelf: "center", maxWidth: 640, minHeight: "100%", paddingBottom: 36, paddingHorizontal: 20, width: "100%" },
  contentWide: { maxWidth: 1160, paddingHorizontal: 40 },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 72 },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backButtonText: { color: "#d9e5ec", fontSize: 14, fontWeight: "700" },
  accountButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.14)", borderCurve: "continuous", borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 40, paddingHorizontal: 14 },
  accountButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  header: { paddingBottom: 34, paddingTop: 26 },
  headerWide: { alignItems: "center", flexDirection: "row", gap: 72, paddingBottom: 48, paddingTop: 52 },
  headerCopy: { flex: 1, maxWidth: 650, minWidth: 0 },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginBottom: 12 },
  title: { color: "#ffffff", fontSize: 36, fontWeight: "800", letterSpacing: -1.2, lineHeight: 41 },
  titleWide: { fontSize: 50, letterSpacing: -2.2, lineHeight: 55 },
  subtitle: { color: "#b9c9d6", fontSize: 16, lineHeight: 23, marginTop: 10 },
  breakCard: { backgroundColor: "rgba(16,42,57,0.9)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 22, borderWidth: 1, flexBasis: 330, flexShrink: 0, padding: 22 },
  breakCardKicker: { color: "#7ce0d6", fontSize: 10, fontWeight: "900", letterSpacing: 1.15 },
  breakCardTitle: { color: "#ffffff", fontSize: 24, fontWeight: "800", letterSpacing: -0.7, marginTop: 10 },
  breakCardText: { color: "#91a8b8", fontSize: 14, lineHeight: 20, marginTop: 8 },
  list: { gap: 18 },
  listWide: { flexDirection: "row", flexWrap: "wrap" },
  listItemWide: { flexBasis: "31%", flexGrow: 1, minWidth: 270 },
  state: { alignItems: "center", gap: 14, justifyContent: "center", minHeight: 280, paddingHorizontal: 22 },
  stateWide: { alignSelf: "stretch", minHeight: 320 },
  stateCard: { backgroundColor: "rgba(255,255,255,0.045)", borderColor: "rgba(255,255,255,0.1)", borderCurve: "continuous", borderRadius: 24, borderWidth: 1 },
  stateKicker: { color: "#7ce0d6", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  stateTitle: { color: "#ffffff", fontSize: 24, fontWeight: "800", letterSpacing: -0.7, textAlign: "center" },
  emptyTitle: { color: "#ffffff", fontSize: 21, fontWeight: "800", textAlign: "center" },
  stateText: { color: "#b9c9d6", fontSize: 16, lineHeight: 23, textAlign: "center" },
  retryButton: { backgroundColor: "#56d6c9", borderRadius: 14, minHeight: 46, justifyContent: "center", paddingHorizontal: 18 },
  retryText: { color: "#061827", fontWeight: "800" },
  emptyCard: { alignItems: "flex-start", backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 24, borderWidth: 1, gap: 12, maxWidth: 580, padding: 24 },
  emptyCardWide: { maxWidth: 720, padding: 32 },
  emptyKicker: { color: "#7ce0d6", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  emptyText: { color: "#b9c9d6", fontSize: 16, lineHeight: 23 },
  emptyButton: { backgroundColor: "#56d6c9", borderCurve: "continuous", borderRadius: 14, justifyContent: "center", marginTop: 8, minHeight: 46, paddingHorizontal: 16 },
  emptyButtonText: { color: "#061827", fontSize: 14, fontWeight: "800" },
});

import { creatorTitle, hourlyRate, type Creator } from "@/data/creators";
import ProfileAvatar from "@/components/profile-avatar";
import { supabase } from "@/lib/supabase";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function CreatorProfileScreen() {
  const { id, spot } = useLocalSearchParams<{ id: string; spot?: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<{ id: string; rating: number; comment: string; created_at: string }[]>([]);

  const loadCreator = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("id, display_name, city, services, portfolio_url, portfolio_urls, starting_rate, bio, travel_miles, avatar_url, avatar_color, is_verified")
      .eq("id", id)
      .eq("is_listed", true)
      .maybeSingle();
    setCreator(error ? null : (data as Creator | null));
    const { data: reviewData } = await supabase.from("creator_reviews").select("id, rating, comment, created_at").eq("creator_profile_id", id).order("created_at", { ascending: false }).limit(20);
    setReviews(reviewData ?? []);
    setIsLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { void loadCreator(); }, [loadCreator]));

  async function openPortfolio(portfolioUrl: string) {
    if (!/^https?:\/\//i.test(portfolioUrl)) {
      Alert.alert("Portfolio unavailable", "This creator has not supplied a valid portfolio link.");
      return;
    }
    try {
      await Linking.openURL(portfolioUrl);
    } catch {
      Alert.alert("Could not open portfolio", "Please try again later.");
    }
  }

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color="#56d6c9" /></View>;
  }
  if (!creator) {
    return <View style={styles.centered}><Text style={styles.title}>Creator not found</Text><Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.backButtonText}>Go back</Text></Pressable></View>;
  }

  const portfolioLinks = creator.portfolio_urls?.length ? creator.portfolio_urls : [creator.portfolio_url];

  return (
    <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
      <View style={styles.hero}><ProfileAvatar color={creator.avatar_color} imageUrl={creator.avatar_url} name={creator.display_name} size={176} /></View>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{creatorTitle(creator.services).toUpperCase()}</Text>
        <View style={styles.nameRow}><Text style={styles.title}>{creator.display_name}</Text>{creator.is_verified ? <View style={styles.verified}><Text style={styles.verifiedText}>✓ VERIFIED CREATOR</Text></View> : null}</View>
        <Text style={styles.meta}>{creator.city} - travels up to {creator.travel_miles} miles</Text>
        <Text style={styles.description}>{creator.bio || "Surf sessions captured with a local eye and a focus on the moments that matter."}</Text>
        <View style={styles.services}>{creator.services.map((service) => <View key={service} style={styles.serviceBadge}><Text style={styles.serviceText}>{service}</Text></View>)}</View>
        <View style={styles.portfolioList}>{portfolioLinks.map((portfolioUrl, index) => <Pressable accessibilityRole="link" key={portfolioUrl} onPress={() => void openPortfolio(portfolioUrl)} style={styles.portfolioButton}><Text style={styles.portfolioText}>View portfolio {portfolioLinks.length > 1 ? index + 1 : ""}</Text></Pressable>)}</View>
        <View style={styles.reviewSection}><Text style={styles.reviewHeading}>REVIEWS {reviews.length ? `· ${(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} ★` : ""}</Text>{reviews.length === 0 ? <Text style={styles.noReviews}>No reviews yet.</Text> : reviews.map(review => <View key={review.id} style={styles.review}><Text style={styles.reviewStars}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</Text>{review.comment ? <Text selectable style={styles.reviewComment}>{review.comment}</Text> : null}</View>)}</View>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/report", params: { creatorId: creator.id } })} style={styles.reportButton}><Text style={styles.reportText}>Report this profile</Text></Pressable>
        <View style={styles.bookingRow}><View><Text style={styles.rateLabel}>STARTING HOURLY RATE</Text><Text style={styles.rate}>{hourlyRate(creator)}</Text></View><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/book", params: { creatorId: creator.id, ...(spot ? { spot } : {}) } })} style={styles.bookButton}><Text style={styles.bookButtonText}>Request to book</Text></Pressable></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#061827", minHeight: "100%", padding: 20, paddingBottom: 40 },
  centered: { alignItems: "center", backgroundColor: "#061827", flex: 1, gap: 18, justifyContent: "center", padding: 24 },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backButtonText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  hero: { alignItems: "center", backgroundColor: "#1d4259", borderRadius: 24, height: 300, justifyContent: "center", marginTop: 8 },
  content: { paddingTop: 24 },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: "#ffffff", fontSize: 38, fontWeight: "800", letterSpacing: -1.3, lineHeight: 44, marginTop: 8 },
  nameRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 10 },
  verified: { backgroundColor: "rgba(86,214,201,.14)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  verifiedText: { color: "#7ce0d6", fontSize: 10, fontWeight: "900", letterSpacing: .7 },
  meta: { color: "#b9c9d6", fontSize: 15, lineHeight: 22, marginTop: 8 },
  description: { color: "#d9e5ec", fontSize: 17, lineHeight: 26, marginTop: 22 },
  services: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 22 },
  serviceBadge: { backgroundColor: "#1d4259", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  serviceText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  portfolioList: { alignItems: "flex-start", gap: 9, marginTop: 22 },
  portfolioButton: { borderColor: "rgba(124,224,214,0.5)", borderRadius: 12, borderWidth: 1, minHeight: 46, justifyContent: "center", paddingHorizontal: 16 },
  portfolioText: { color: "#7ce0d6", fontSize: 14, fontWeight: "800" },
  reviewSection: { borderTopColor: "rgba(255,255,255,.12)", borderTopWidth: 1, gap: 10, marginTop: 28, paddingTop: 22 },
  reviewHeading: { color: "#91a8b8", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  noReviews: { color: "#698596", fontSize: 14 },
  review: { backgroundColor: "rgba(255,255,255,.05)", borderRadius: 15, padding: 14 },
  reviewStars: { color: "#f5b841", fontSize: 16 },
  reviewComment: { color: "#d9e5ec", fontSize: 14, lineHeight: 21, marginTop: 7 },
  reportButton: { alignSelf: "flex-start", marginTop: 18, minHeight: 42, justifyContent: "center" },
  reportText: { color: "#91a8b8", fontSize: 13, fontWeight: "700" },
  bookingRow: { alignItems: "center", borderTopColor: "rgba(255, 255, 255, 0.12)", borderTopWidth: 1, flexDirection: "row", gap: 16, justifyContent: "space-between", marginTop: 32, paddingTop: 24 },
  rateLabel: { color: "#91a8b8", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  rate: { color: "#ffffff", fontSize: 22, fontWeight: "800", marginTop: 3 },
  bookButton: { backgroundColor: "#56d6c9", borderRadius: 16, justifyContent: "center", minHeight: 52, paddingHorizontal: 18 },
  bookButtonText: { color: "#061827", fontSize: 15, fontWeight: "800" },
});

import { creatorTitle, hourlyRate, type Creator } from "@/data/creators";
import ProfileAvatar from "@/components/profile-avatar";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

type PortfolioMedia = {
  id: string;
  media_type: "image" | "video";
  mime_type: string;
  position: number;
  public_url: string;
  storage_path: string;
};

export default function CreatorProfileScreen() {
  const { id, spot } = useLocalSearchParams<{ id: string; spot?: string }>();
  const { width } = useWindowDimensions();
  const isWide = width >= 850;
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<{ id: string; rating: number; comment: string; created_at: string }[]>([]);
  const [portfolioMedia, setPortfolioMedia] = useState<PortfolioMedia[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const loadCreator = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("id, owner_id, display_name, city, services, portfolio_url, portfolio_urls, starting_rate, bio, equipment_setup, travel_miles, avatar_url, avatar_color, is_verified")
      .eq("id", id)
      .eq("is_listed", true)
      .maybeSingle();
    const nextCreator = error ? null : (data as Creator | null);
    setCreator(nextCreator);
    const [{ data: reviewData }, { data: mediaData }, { data: userData }] = await Promise.all([
      supabase.from("creator_reviews").select("id, rating, comment, created_at").eq("creator_profile_id", id).order("created_at", { ascending: false }).limit(20),
      supabase.from("creator_portfolio_media").select("id, media_type, mime_type, position, public_url, storage_path").eq("creator_profile_id", id).order("position"),
      supabase.auth.getUser(),
    ]);
    setReviews(reviewData ?? []);
    setPortfolioMedia((mediaData ?? []) as PortfolioMedia[]);
    setIsOwner(Boolean(nextCreator?.owner_id && userData.user?.id === nextCreator.owner_id));
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

  async function addPortfolioMedia(position: number) {
    if (!creator || !isOwner || isUploadingMedia) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo access to add images or video to your portfolio.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.85 });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    if (asset.fileSize && asset.fileSize > 25 * 1024 * 1024) {
      Alert.alert("File too large", "Choose an image or short video smaller than 25 MB.");
      return;
    }
    const mediaType = asset.type === "video" ? "video" : "image";
    const contentType = asset.mimeType ?? (mediaType === "video" ? "video/mp4" : "image/jpeg");
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];
    if (!allowedTypes.includes(contentType)) {
      Alert.alert("Unsupported file", "Choose a JPG, PNG, WebP, MP4, or MOV file.");
      return;
    }
    setIsUploadingMedia(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Sign in again before uploading.");
      const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : contentType === "video/quicktime" ? "mov" : "mp4";
      const storagePath = `${userData.user.id}/${creator.id}/${position}.${extension}`;
      const response = await fetch(asset.uri);
      if (!response.ok) throw new Error("We could not read that file.");
      const fileData = await response.arrayBuffer();
      const { error: uploadError } = await supabase.storage.from("creator-portfolio").upload(storagePath, fileData, { contentType });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("creator-portfolio").getPublicUrl(storagePath);
      const { data: insertedMedia, error: insertError } = await supabase.from("creator_portfolio_media").insert({ creator_profile_id: creator.id, media_type: mediaType, mime_type: contentType, owner_id: userData.user.id, position, public_url: publicData.publicUrl, storage_path: storagePath }).select("id, media_type, mime_type, position, public_url, storage_path").single();
      if (insertError) {
        await supabase.storage.from("creator-portfolio").remove([storagePath]);
        throw insertError;
      }
      setPortfolioMedia((current) => [...current, insertedMedia as PortfolioMedia].sort((a, b) => a.position - b.position));
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsUploadingMedia(false);
    }
  }

  async function removePortfolioMedia(media: PortfolioMedia) {
    const { error } = await supabase.from("creator_portfolio_media").delete().eq("id", media.id);
    if (error) {
      Alert.alert("Could not remove media", error.message);
      return;
    }
    await supabase.storage.from("creator-portfolio").remove([media.storage_path]);
    setPortfolioMedia((current) => current.filter((item) => item.id !== media.id));
  }

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color="#56d6c9" /></View>;
  }
  if (!creator) {
    return <View style={styles.centered}><Text style={styles.title}>Creator not found</Text><Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.backButtonText}>Go back</Text></Pressable></View>;
  }

  const portfolioLinks = creator.portfolio_urls?.length ? creator.portfolio_urls : [creator.portfolio_url];
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  return (
    <ScrollView contentContainerStyle={[styles.screen, isWide && styles.screenWide]} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
      <View style={styles.hero}><ProfileAvatar color={creator.avatar_color} imageUrl={creator.avatar_url} name={creator.display_name} size={176} /></View>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{creatorTitle(creator.services).toUpperCase()}</Text>
        <View style={styles.nameRow}><Text style={styles.title}>{creator.display_name}</Text>{creator.is_verified ? <View style={styles.verified}><Text style={styles.verifiedText}>✓ VERIFIED CREATOR</Text></View> : null}</View>
        <Text style={styles.meta}>{creator.city} - travels up to {creator.travel_miles} miles</Text>
        <View style={styles.ratingSummary}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingValue}>{averageRating ? averageRating.toFixed(1) : "New"}</Text>
          <Text style={styles.ratingCount}>{reviews.length ? `${reviews.length} verified ${reviews.length === 1 ? "review" : "reviews"}` : "No reviews yet"}</Text>
        </View>
        <Text style={styles.description}>{creator.bio || "Surf sessions captured with a local eye and a focus on the moments that matter."}</Text>
        <View style={styles.services}>{creator.services.map((service) => <View key={service} style={styles.serviceBadge}><Text style={styles.serviceText}>{service}</Text></View>)}</View>
        {(portfolioMedia.length > 0 || isOwner) ? <View style={styles.mediaSection}><View style={styles.mediaHeadingRow}><Text style={styles.mediaHeading}>FEATURED WORK</Text>{isOwner ? <Text style={styles.mediaHelp}>{isUploadingMedia ? "Uploading…" : `${portfolioMedia.length}/6 added`}</Text> : null}</View><View style={styles.mediaGrid}>{Array.from({ length: isOwner ? 6 : portfolioMedia.length }, (_, position) => { const media = portfolioMedia.find((item) => item.position === position); return media ? <Pressable accessibilityLabel={media.media_type === "video" ? "Open portfolio video" : "Open portfolio image"} accessibilityRole="button" key={media.id} onPress={() => void Linking.openURL(media.public_url)} style={styles.mediaTile}>{media.media_type === "image" ? <Image source={{ uri: media.public_url }} style={styles.mediaImage} /> : <View style={styles.videoTile}><Text style={styles.videoIcon}>▶</Text><Text style={styles.videoLabel}>VIDEO</Text></View>}{isOwner ? <Pressable accessibilityLabel="Remove portfolio media" accessibilityRole="button" onPress={(event) => { event.stopPropagation(); void removePortfolioMedia(media); }} style={styles.removeMedia}><Text style={styles.removeMediaText}>×</Text></Pressable> : null}</Pressable> : <Pressable accessibilityLabel={`Add portfolio media ${position + 1}`} accessibilityRole="button" disabled={isUploadingMedia} key={`empty-${position}`} onPress={() => void addPortfolioMedia(position)} style={styles.emptyMediaTile}><Text style={styles.plus}>+</Text><Text style={styles.addMediaText}>Add media</Text></Pressable>; })}</View></View> : null}
        {creator.equipment_setup ? <View style={styles.setupCard}><Text style={styles.setupHeading}>CREATOR SETUP</Text><Text selectable style={styles.setupText}>{creator.equipment_setup}</Text></View> : null}
        <View style={styles.portfolioList}>{portfolioLinks.map((portfolioUrl, index) => <Pressable accessibilityRole="link" key={portfolioUrl} onPress={() => void openPortfolio(portfolioUrl)} style={styles.portfolioButton}><Text style={styles.portfolioText}>View portfolio {portfolioLinks.length > 1 ? index + 1 : ""}</Text></Pressable>)}</View>
        <View style={styles.reviewSection}>
          <Text style={styles.reviewHeading}>SURFER REVIEWS</Text>
          {reviews.length === 0 ? <Text style={styles.noReviews}>This creator has not received a review yet.</Text> : reviews.map((review) => (
            <View key={review.id} style={styles.review}>
              <View style={styles.reviewTopRow}>
                <Text accessibilityLabel={`${review.rating} out of 5 stars`} style={styles.reviewStars}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</Text>
                <View style={styles.verifiedSession}><Text style={styles.verifiedSessionText}>✓ VERIFIED SESSION</Text></View>
              </View>
              {review.comment ? <Text selectable style={styles.reviewComment}>{review.comment}</Text> : <Text style={styles.ratingOnly}>Rating only</Text>}
              <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</Text>
            </View>
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/report", params: { creatorId: creator.id } })} style={styles.reportButton}><Text style={styles.reportText}>Report this profile</Text></Pressable>
        <View style={styles.bookingRow}><View><Text style={styles.rateLabel}>STARTING HOURLY RATE</Text><Text style={styles.rate}>{hourlyRate(creator)}</Text></View><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/book", params: { creatorId: creator.id, ...(spot ? { spot } : {}) } })} style={styles.bookButton}><Text style={styles.bookButtonText}>Request to book</Text></Pressable></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { alignSelf: "center", backgroundColor: "#061827", maxWidth: 640, minHeight: "100%", padding: 20, paddingBottom: 40, width: "100%" },
  screenWide: { maxWidth: 1160, paddingBottom: 64, paddingHorizontal: 40 },
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
  ratingSummary: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 12 },
  ratingStar: { color: "#f5b841", fontSize: 18 },
  ratingValue: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  ratingCount: { color: "#91a8b8", fontSize: 13 },
  description: { color: "#d9e5ec", fontSize: 17, lineHeight: 26, marginTop: 22 },
  services: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 22 },
  serviceBadge: { backgroundColor: "#1d4259", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  serviceText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  mediaSection: { marginTop: 22 },
  mediaHeadingRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  mediaHeading: { color: "#91a8b8", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  mediaHelp: { color: "#698596", fontSize: 12 },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  mediaTile: { aspectRatio: 1.25, backgroundColor: "#102a39", borderRadius: 15, flexBasis: "30%", flexGrow: 1, maxWidth: 210, minWidth: 130, overflow: "hidden" },
  mediaImage: { height: "100%", width: "100%" },
  videoTile: { alignItems: "center", backgroundColor: "#17384b", flex: 1, gap: 6, justifyContent: "center" },
  videoIcon: { color: "#56d6c9", fontSize: 25 },
  videoLabel: { color: "#d9e5ec", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  emptyMediaTile: { alignItems: "center", aspectRatio: 1.25, borderColor: "rgba(86,214,201,.35)", borderRadius: 15, borderStyle: "dashed", borderWidth: 1, flexBasis: "30%", flexGrow: 1, justifyContent: "center", maxWidth: 210, minWidth: 130 },
  plus: { color: "#56d6c9", fontSize: 28, fontWeight: "400" },
  addMediaText: { color: "#91a8b8", fontSize: 11, fontWeight: "800", marginTop: 2 },
  removeMedia: { alignItems: "center", backgroundColor: "rgba(6,24,39,.88)", borderRadius: 14, height: 28, justifyContent: "center", position: "absolute", right: 7, top: 7, width: 28 },
  removeMediaText: { color: "#ffffff", fontSize: 20, lineHeight: 22 },
  setupCard: { backgroundColor: "rgba(86,214,201,.08)", borderColor: "rgba(86,214,201,.24)", borderCurve: "continuous", borderRadius: 17, borderWidth: 1, marginTop: 22, padding: 16 },
  setupHeading: { color: "#7ce0d6", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  setupText: { color: "#d9e5ec", fontSize: 15, lineHeight: 23, marginTop: 8 },
  portfolioList: { alignItems: "flex-start", gap: 9, marginTop: 22 },
  portfolioButton: { borderColor: "rgba(124,224,214,0.5)", borderRadius: 12, borderWidth: 1, minHeight: 46, justifyContent: "center", paddingHorizontal: 16 },
  portfolioText: { color: "#7ce0d6", fontSize: 14, fontWeight: "800" },
  reviewSection: { borderTopColor: "rgba(255,255,255,.12)", borderTopWidth: 1, gap: 10, marginTop: 28, paddingTop: 22 },
  reviewHeading: { color: "#91a8b8", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  noReviews: { color: "#698596", fontSize: 14 },
  review: { backgroundColor: "rgba(255,255,255,.05)", borderRadius: 15, padding: 14 },
  reviewTopRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  reviewStars: { color: "#f5b841", fontSize: 16 },
  verifiedSession: { backgroundColor: "rgba(86,214,201,.12)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  verifiedSessionText: { color: "#7ce0d6", fontSize: 9, fontWeight: "900", letterSpacing: .6 },
  reviewComment: { color: "#d9e5ec", fontSize: 14, lineHeight: 21, marginTop: 7 },
  ratingOnly: { color: "#698596", fontSize: 13, fontStyle: "italic", marginTop: 7 },
  reviewDate: { color: "#698596", fontSize: 11, marginTop: 9 },
  reportButton: { alignSelf: "flex-start", marginTop: 18, minHeight: 42, justifyContent: "center" },
  reportText: { color: "#91a8b8", fontSize: 13, fontWeight: "700" },
  bookingRow: { alignItems: "center", borderTopColor: "rgba(255, 255, 255, 0.12)", borderTopWidth: 1, flexDirection: "row", gap: 16, justifyContent: "space-between", marginTop: 32, paddingTop: 24 },
  rateLabel: { color: "#91a8b8", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  rate: { color: "#ffffff", fontSize: 22, fontWeight: "800", marginTop: 3 },
  bookButton: { backgroundColor: "#56d6c9", borderRadius: 16, justifyContent: "center", minHeight: 52, paddingHorizontal: 18 },
  bookButtonText: { color: "#061827", fontSize: 15, fontWeight: "800" },
});

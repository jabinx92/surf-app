import { creatorTitle, hourlyRate, type Creator } from "@/data/creators";
import ProfileAvatar from "@/components/profile-avatar";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/app-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";
import { TopBar } from "@/components/ui/top-bar";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";
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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
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
    return <View style={styles.centered}><ActivityIndicator color={theme.colors.accent} /></View>;
  }
  if (!creator) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Creator not found</Text>
        <AppButton onPress={() => router.back()} variant="secondary">Go back</AppButton>
      </View>
    );
  }

  const portfolioLinks = creator.portfolio_urls?.length ? creator.portfolio_urls : [creator.portfolio_url];
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;
  const heroImage = portfolioMedia.find((media) => media.media_type === "image")?.public_url;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        <TopBar back />
        <PhotoPlaceholder accessibilityLabel={`Surf photo by ${creator.display_name}`} source={heroImage} style={[styles.hero, isWide && styles.heroWide]} />
        <View style={styles.avatar}>
          <ProfileAvatar color={creator.avatar_color} imageUrl={creator.avatar_url} name={creator.display_name} size={88} />
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name}>{creator.display_name}</Text>
          {creator.is_verified ? <IconSymbol color={theme.colors.accentText} name="checkmark.seal.fill" size={22} /> : null}
        </View>
        <Text style={styles.meta}>{creatorTitle(creator.services)} · {creator.city} · travels {creator.travel_miles} mi</Text>
        <View style={styles.ratingRow}>
          <IconSymbol color={theme.colors.star} name="star.fill" size={16} />
          <Text style={styles.ratingValue}>{averageRating ? averageRating.toFixed(1) : "New"}</Text>
          <Text style={styles.ratingCount}>{reviews.length ? `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"} from booked sessions` : "No reviews yet"}</Text>
        </View>

        <Text style={styles.bio}>{creator.bio || "Surf sessions captured with a local eye and a focus on the moments that matter."}</Text>

        {(portfolioMedia.length > 0 || isOwner) ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent work</Text>
              {isOwner ? <Text style={styles.sectionHelp}>{isUploadingMedia ? "Uploading…" : `${portfolioMedia.length} of 6 added`}</Text> : null}
            </View>
            <View style={styles.mediaGrid}>
              {Array.from({ length: isOwner ? 6 : portfolioMedia.length }, (_, position) => {
                const media = portfolioMedia.find((item) => item.position === position);
                return media ? (
                  <Pressable accessibilityLabel={media.media_type === "video" ? "Open portfolio video" : "Open portfolio image"} accessibilityRole="button" key={media.id} onPress={() => void Linking.openURL(media.public_url)} style={styles.mediaTile}>
                    {media.media_type === "image" ? <Image source={{ uri: media.public_url }} style={styles.mediaImage} /> : <View style={styles.videoTile}><IconSymbol color={theme.colors.text} name="play.fill" size={28} /></View>}
                    {isOwner ? (
                      <Pressable accessibilityLabel="Remove portfolio media" accessibilityRole="button" onPress={(event) => { event.stopPropagation(); void removePortfolioMedia(media); }} style={styles.removeMedia}>
                        <IconSymbol color="#ffffff" name="xmark" size={16} />
                      </Pressable>
                    ) : null}
                  </Pressable>
                ) : (
                  <Pressable accessibilityLabel={`Add portfolio media ${position + 1}`} accessibilityRole="button" disabled={isUploadingMedia} key={`empty-${position}`} onPress={() => void addPortfolioMedia(position)} style={styles.emptyMediaTile}>
                    <IconSymbol color={theme.colors.textMuted} name="plus" size={24} />
                    <Text style={styles.addMediaText}>Add photo or video</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {creator.equipment_setup ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gear</Text>
            <Text selectable style={styles.body}>{creator.equipment_setup}</Text>
          </View>
        ) : null}

        <View style={styles.linkRow}>
          {portfolioLinks.map((portfolioUrl, index) => (
            <AppButton key={portfolioUrl} onPress={() => void openPortfolio(portfolioUrl)} variant="secondary">
              {portfolioLinks.length > 1 ? `Portfolio ${index + 1}` : "Full portfolio"}
            </AppButton>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.length === 0 ? <Text style={styles.muted}>No reviews yet. Reviews come only from booked sessions.</Text> : reviews.map((review) => (
            <View key={review.id} style={styles.review}>
              <View style={styles.reviewTop}>
                <Text accessibilityLabel={`${review.rating} out of 5 stars`} style={styles.reviewStars}>{"★".repeat(review.rating)}<Text style={styles.reviewStarsEmpty}>{"★".repeat(5 - review.rating)}</Text></Text>
                <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</Text>
              </View>
              {review.comment ? <Text selectable style={styles.body}>{review.comment}</Text> : <Text style={styles.muted}>Rating only</Text>}
            </View>
          ))}
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/report", params: { creatorId: creator.id } })} style={styles.reportButton}>
          <Text style={styles.reportText}>Report this profile</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.bookBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={[styles.bookBarInner, isWide && styles.contentWide]}>
          <View>
            <Text style={styles.rate}>{hourlyRate(creator)}</Text>
            <Text style={styles.rateHint}>starting rate</Text>
          </View>
          <AppButton onPress={() => router.push({ pathname: "/book", params: { creatorId: creator.id, ...(spot ? { spot } : {}) } })} size="lg">Request to book</AppButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radius } = theme;
  return StyleSheet.create({
    screen: { backgroundColor: colors.background, flex: 1 },
    content: { alignSelf: "center", maxWidth: 680, paddingBottom: 32, paddingHorizontal: 20, width: "100%" },
    contentWide: { maxWidth: 900 },
    centered: { alignItems: "center", backgroundColor: colors.background, flex: 1, gap: 16, justifyContent: "center", padding: 24 },
    notFound: { ...theme.heading, color: colors.text, fontSize: 24 },
    hero: { aspectRatio: 16 / 10, marginTop: 4, width: "100%" },
    heroWide: { aspectRatio: 21 / 9 },
    avatar: { alignSelf: "flex-start", borderColor: colors.background, borderRadius: 50, borderWidth: 5, marginLeft: 12, marginTop: -48 },
    nameRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 10 },
    name: { ...theme.display, color: colors.text, flexShrink: 1, fontSize: 34, lineHeight: 38 },
    meta: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 6 },
    ratingRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 10 },
    ratingValue: { color: colors.text, fontSize: 15, fontWeight: "800" },
    ratingCount: { color: colors.textMuted, fontSize: 14 },
    bio: { color: colors.text, fontSize: 17, lineHeight: 26, marginTop: 22 },
    section: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: 28, paddingTop: 22 },
    sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
    sectionTitle: { ...theme.heading, color: colors.text, fontSize: 19, marginBottom: 12 },
    sectionHelp: { color: colors.textFaint, fontSize: 13, marginBottom: 12 },
    body: { color: colors.text, fontSize: 15, lineHeight: 23 },
    muted: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
    mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    mediaTile: { aspectRatio: 1, backgroundColor: colors.surface, borderCurve: "continuous", borderRadius: radius.md, flexBasis: "31%", flexGrow: 1, maxWidth: 220, overflow: "hidden" },
    mediaImage: { height: "100%", width: "100%" },
    videoTile: { alignItems: "center", backgroundColor: colors.surfaceAlt, flex: 1, justifyContent: "center" },
    emptyMediaTile: { alignItems: "center", aspectRatio: 1, borderColor: colors.borderStrong, borderCurve: "continuous", borderRadius: radius.md, borderStyle: "dashed", borderWidth: 1, flexBasis: "31%", flexGrow: 1, gap: 4, justifyContent: "center", maxWidth: 220, padding: 8 },
    addMediaText: { color: colors.textMuted, fontSize: 12, fontWeight: "600", textAlign: "center" },
    removeMedia: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 14, height: 28, justifyContent: "center", position: "absolute", right: 6, top: 6, width: 28 },
    linkRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 24 },
    review: { borderBottomColor: colors.border, borderBottomWidth: 1, gap: 6, paddingVertical: 14 },
    reviewTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
    reviewStars: { color: colors.star, fontSize: 15, letterSpacing: 1 },
    reviewStarsEmpty: { color: colors.border },
    reviewDate: { color: colors.textFaint, fontSize: 12 },
    reportButton: { alignSelf: "flex-start", justifyContent: "center", marginTop: 20, minHeight: 44 },
    reportText: { color: colors.textFaint, fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
    bookBar: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12 },
    bookBarInner: { alignItems: "center", alignSelf: "center", flexDirection: "row", gap: 16, justifyContent: "space-between", maxWidth: 680, width: "100%" },
    rate: { color: colors.text, fontSize: 22, fontVariant: ["tabular-nums"], fontWeight: "800" },
    rateHint: { color: colors.textMuted, fontSize: 13 },
  });
}

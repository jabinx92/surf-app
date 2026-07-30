import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type CreatorProfile = {
  avatar_url: string | null;
  bio: string;
  display_name: string;
  id: string;
  portfolio_url: string;
  portfolio_urls: string[];
};

const avatarExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function ProfileSettingsScreen() {
  const [userId, setUserId] = useState("");
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      router.replace("/sign-in");
      return;
    }

    setUserId(data.user.id);
    const metadata = data.user.user_metadata ?? {};
    const { data: creator, error: creatorError } = await supabase
      .from("creator_profiles")
      .select("id, display_name, bio, portfolio_url, portfolio_urls, avatar_url")
      .eq("owner_id", data.user.id)
      .maybeSingle();

    if (creatorError) setMessage(creatorError.message);
    const nextCreator = creator as CreatorProfile | null;
    setCreatorProfile(nextCreator);
    setDisplayName(nextCreator?.display_name ?? metadata.display_name ?? "");
    setBio(nextCreator?.bio ?? metadata.bio ?? "");
    const savedLinks = nextCreator?.portfolio_urls?.length
      ? nextCreator.portfolio_urls
      : metadata.portfolio_urls?.length
        ? metadata.portfolio_urls
        : [nextCreator?.portfolio_url ?? metadata.portfolio_url ?? ""];
    setPortfolioLinks(savedLinks.slice(0, 5));
    setAvatarUrl(nextCreator?.avatar_url ?? metadata.avatar_url ?? "");
    setIsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void loadProfile(); }, [loadProfile]));

  function updatePortfolioLink(index: number, value: string) {
    setPortfolioLinks((current) => current.map((link, linkIndex) => linkIndex === index ? value : link));
  }

  function addPortfolioLink() {
    if (portfolioLinks.length >= 5) return;
    setPortfolioLinks((current) => [...current, ""]);
  }

  function removePortfolioLink(index: number) {
    if (creatorProfile && portfolioLinks.length === 1) {
      setMessage("Creators must keep at least one portfolio link.");
      setIsSuccess(false);
      return;
    }
    setPortfolioLinks((current) => current.filter((_, linkIndex) => linkIndex !== index));
  }

  async function choosePhoto() {
    setMessage("");
    setIsSuccess(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      setMessage("Choose an image smaller than 5 MB.");
      return;
    }

    const contentType = asset.mimeType ?? "image/jpeg";
    const extension = avatarExtensions[contentType];
    if (!extension) {
      setMessage("Choose a JPG, PNG, or WebP image.");
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch(asset.uri);
      if (!response.ok) throw new Error("We could not read that image.");
      const imageData = await response.arrayBuffer();
      const storagePath = `${userId}/avatar.${extension}`;
      const { error } = await supabase.storage.from("profile-avatars").upload(storagePath, imageData, { contentType, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("profile-avatars").getPublicUrl(storagePath);
      setAvatarUrl(`${data.publicUrl}?v=${Date.now()}`);
      setMessage("Photo uploaded. Save your profile to publish it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not upload that photo.");
    } finally {
      setIsUploading(false);
    }
  }

  async function saveProfile() {
    const nextName = displayName.trim();
    const nextBio = bio.trim();
    const nextPortfolioLinks = portfolioLinks.map((link) => {
      const trimmedLink = link.trim();
      return trimmedLink && !/^https?:\/\//i.test(trimmedLink) ? `https://${trimmedLink}` : trimmedLink;
    });
    setMessage("");
    setIsSuccess(false);

    if (nextName.length < 2 || nextName.length > 80) {
      setMessage("Display name must be between 2 and 80 characters.");
      return;
    }
    if (nextBio.length > 500) {
      setMessage("Description must be 500 characters or fewer.");
      return;
    }
    if (nextPortfolioLinks.some((link) => !link)) {
      setMessage("Fill in each portfolio link or remove the empty row.");
      return;
    }
    if (creatorProfile && nextPortfolioLinks.length === 0) {
      setMessage("Creators must keep at least one portfolio link.");
      return;
    }
    if (nextPortfolioLinks.some((link) => !/^https?:\/\//i.test(link) || link.length > 500)) {
      setMessage("Each portfolio link must be a valid web address under 500 characters.");
      return;
    }
    setIsSaving(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl || null, bio: nextBio, display_name: nextName, portfolio_url: nextPortfolioLinks[0] ?? "", portfolio_urls: nextPortfolioLinks },
      });
      if (authError) throw authError;

      if (creatorProfile) {
        const { error: creatorError } = await supabase
          .from("creator_profiles")
          .update({ avatar_url: avatarUrl || null, bio: nextBio, display_name: nextName, portfolio_url: nextPortfolioLinks[0], portfolio_urls: nextPortfolioLinks })
          .eq("id", creatorProfile.id);
        if (creatorError) throw creatorError;
      }

      setDisplayName(nextName);
      setBio(nextBio);
      setPortfolioLinks(nextPortfolioLinks.length ? nextPortfolioLinks : [""]);
      setMessage(creatorProfile ? "Your public creator profile is updated." : "Your account profile is updated.");
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not save your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
      <Text style={styles.eyebrow}>PROFILE SETTINGS</Text>
      <Text style={styles.title}>{creatorProfile ? "Edit your creator profile." : "Make your account yours."}</Text>
      <Text selectable style={styles.subtitle}>{creatorProfile ? "These details appear on your public WaveLens creator page." : "Your profile is saved to your account. Creator details become public only after approval."}</Text>

      {isLoading ? <View style={styles.loading}><ActivityIndicator color="#56d6c9" /></View> : (
        <View style={styles.form}>
          <View style={styles.avatarSection}>
            {avatarUrl ? <Image accessibilityLabel="Profile picture preview" contentFit="cover" source={avatarUrl} style={styles.avatar} transition={180} /> : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase() || "W"}</Text></View>}
            <Pressable accessibilityRole="button" disabled={isUploading} onPress={() => void choosePhoto()} style={styles.photoButton}><Text style={styles.photoButtonText}>{isUploading ? "Uploading..." : avatarUrl ? "Change photo" : "Add photo"}</Text></Pressable>
            <Text selectable style={styles.photoHelp}>JPG, PNG, or WebP · maximum 5 MB</Text>
          </View>

          <Text style={styles.label}>Display name</Text>
          <TextInput accessibilityLabel="Display name" maxLength={80} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor="#718997" style={styles.input} value={displayName} />

          <Text style={styles.label}>Description</Text>
          <TextInput accessibilityLabel="Profile description" maxLength={500} multiline onChangeText={setBio} placeholder="Tell surfers a little about yourself." placeholderTextColor="#718997" style={[styles.input, styles.bioInput]} textAlignVertical="top" value={bio} />
          <Text selectable style={styles.characterCount}>{bio.length}/500</Text>

          <View style={styles.portfolioHeader}>
            <Text style={styles.label}>Portfolio links</Text>
            <Text selectable style={styles.linkLimit}>{portfolioLinks.length}/5</Text>
          </View>
          <View style={styles.portfolioList}>
            {portfolioLinks.map((link, index) => (
              <View key={`portfolio-${index}`} style={styles.portfolioRow}>
                <TextInput accessibilityLabel={`Portfolio link ${index + 1}`} autoCapitalize="none" autoCorrect={false} keyboardType="url" onChangeText={(value) => updatePortfolioLink(index, value)} placeholder="instagram.com/yourname" placeholderTextColor="#718997" style={[styles.input, styles.portfolioInput]} value={link} />
                <Pressable accessibilityLabel={`Remove portfolio link ${index + 1}`} accessibilityRole="button" onPress={() => removePortfolioLink(index)} style={styles.removeLinkButton}><Text style={styles.removeLinkText}>−</Text></Pressable>
              </View>
            ))}
          </View>
          <Pressable accessibilityRole="button" disabled={portfolioLinks.length >= 5} onPress={addPortfolioLink} style={[styles.addLinkButton, portfolioLinks.length >= 5 && styles.disabled]}><Text style={styles.addLinkText}>+ Add portfolio link</Text></Pressable>

          {message ? <View accessibilityRole={isSuccess ? undefined : "alert"} style={[styles.message, isSuccess && styles.successMessage]}><Text selectable style={[styles.messageText, isSuccess && styles.successMessageText]}>{message}</Text></View> : null}
          <Pressable accessibilityRole="button" disabled={isSaving || isUploading} onPress={() => void saveProfile()} style={[styles.saveButton, (isSaving || isUploading) && styles.disabled]}><Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save profile"}</Text></Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { alignSelf: "center", backgroundColor: "#061827", flexGrow: 1, maxWidth: 680, padding: 20, paddingBottom: 48, width: "100%" },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backButtonText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginTop: 16 },
  title: { color: "#ffffff", fontSize: 38, fontWeight: "800", letterSpacing: -1.3, lineHeight: 43, marginTop: 10 },
  subtitle: { color: "#b9c9d6", fontSize: 16, lineHeight: 24, marginTop: 12 },
  loading: { alignItems: "center", paddingTop: 80 },
  form: { marginTop: 28 },
  avatarSection: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 22, borderWidth: 1, padding: 22 },
  avatar: { borderRadius: 54, height: 108, width: 108 },
  avatarFallback: { alignItems: "center", backgroundColor: "rgba(86,214,201,0.16)", borderColor: "rgba(86,214,201,0.32)", borderRadius: 54, borderWidth: 1, height: 108, justifyContent: "center", width: 108 },
  avatarInitial: { color: "#56d6c9", fontSize: 42, fontWeight: "900" },
  photoButton: { alignItems: "center", borderColor: "rgba(255,255,255,0.2)", borderRadius: 14, borderWidth: 1, justifyContent: "center", marginTop: 16, minHeight: 44, paddingHorizontal: 18 },
  photoButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  photoHelp: { color: "#698596", fontSize: 12, marginTop: 9 },
  label: { color: "#e8f2f5", fontSize: 14, fontWeight: "700", marginBottom: 9, marginTop: 20 },
  input: { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.15)", borderCurve: "continuous", borderRadius: 14, borderWidth: 1, color: "#ffffff", fontSize: 16, minHeight: 54, paddingHorizontal: 15 },
  bioInput: { minHeight: 120, paddingTop: 14 },
  characterCount: { color: "#698596", fontSize: 12, marginTop: 6, textAlign: "right" },
  portfolioHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  linkLimit: { color: "#698596", fontSize: 12, marginBottom: 9 },
  portfolioList: { gap: 10 },
  portfolioRow: { alignItems: "center", flexDirection: "row", gap: 9 },
  portfolioInput: { flex: 1 },
  removeLinkButton: { alignItems: "center", borderColor: "rgba(245,163,163,0.35)", borderRadius: 14, borderWidth: 1, height: 48, justifyContent: "center", width: 48 },
  removeLinkText: { color: "#f5a3a3", fontSize: 24, fontWeight: "700" },
  addLinkButton: { alignItems: "center", borderColor: "rgba(86,214,201,0.3)", borderRadius: 14, borderWidth: 1, justifyContent: "center", marginTop: 10, minHeight: 46 },
  addLinkText: { color: "#7ce0d6", fontSize: 14, fontWeight: "800" },
  message: { backgroundColor: "rgba(255,177,92,0.1)", borderColor: "rgba(255,177,92,0.32)", borderRadius: 14, borderWidth: 1, marginTop: 22, padding: 14 },
  messageText: { color: "#ffd4a3", fontSize: 14, lineHeight: 20 },
  successMessage: { backgroundColor: "rgba(86,214,201,0.1)", borderColor: "rgba(86,214,201,0.3)" },
  successMessageText: { color: "#bff8f1" },
  saveButton: { alignItems: "center", backgroundColor: "#56d6c9", borderCurve: "continuous", borderRadius: 16, justifyContent: "center", marginTop: 22, minHeight: 56 },
  saveButtonText: { color: "#061827", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.6 },
});

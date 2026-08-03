import { supabase } from "@/lib/supabase";
import ProfileAvatar, { avatarColors, defaultAvatarColor } from "@/components/profile-avatar";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import FeedbackPressable from "@/components/feedback-pressable";

type CreatorProfile = {
  avatar_color: string;
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

const hasNativePhotoEditor = process.env.EXPO_OS === "ios" || process.env.EXPO_OS === "android";

function normalizePortfolioUrl(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue && !/^https?:\/\//i.test(trimmedValue) ? `https://${trimmedValue}` : trimmedValue;
}

function getPortfolioUrlError(value: string) {
  const normalizedUrl = normalizePortfolioUrl(value);
  if (!normalizedUrl) return "Enter a portfolio URL or remove this row.";
  if (normalizedUrl.length > 500) return "URL must be 500 characters or fewer.";

  try {
    const parsedUrl = new URL(normalizedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const isPrivateAddress =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

    if (!['http:', 'https:'].includes(parsedUrl.protocol) || !hostname.includes(".") || isPrivateAddress) {
      return "Must be a valid public website URL.";
    }
  } catch {
    return "Must be a valid URL, such as instagram.com/yourname.";
  }

  return "";
}

export default function ProfileSettingsScreen() {
  const [userId, setUserId] = useState("");
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);
  const [portfolioErrors, setPortfolioErrors] = useState<string[]>([""]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(defaultAvatarColor);
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
      .select("id, display_name, bio, portfolio_url, portfolio_urls, avatar_url, avatar_color")
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
    setPortfolioErrors(savedLinks.slice(0, 5).map(() => ""));
    setAvatarUrl(nextCreator?.avatar_url ?? metadata.avatar_url ?? "");
    setAvatarColor(nextCreator?.avatar_color ?? metadata.avatar_color ?? defaultAvatarColor);
    setIsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void loadProfile(); }, [loadProfile]));

  function updatePortfolioLink(index: number, value: string) {
    setPortfolioLinks((current) => current.map((link, linkIndex) => linkIndex === index ? value : link));
    setPortfolioErrors((current) => current.map((error, errorIndex) => errorIndex === index ? "" : error));
  }

  function validatePortfolioLink(index: number) {
    setPortfolioErrors((current) => current.map((error, errorIndex) => errorIndex === index ? getPortfolioUrlError(portfolioLinks[index] ?? "") : error));
  }

  function addPortfolioLink() {
    if (portfolioLinks.length >= 5) return;
    setPortfolioLinks((current) => [...current, ""]);
    setPortfolioErrors((current) => [...current, ""]);
  }

  function removePortfolioLink(index: number) {
    if (creatorProfile && portfolioLinks.length === 1) {
      setMessage("Creators must keep at least one portfolio link.");
      setIsSuccess(false);
      return;
    }
    setPortfolioLinks((current) => current.filter((_, linkIndex) => linkIndex !== index));
    setPortfolioErrors((current) => current.filter((_, errorIndex) => errorIndex !== index));
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

  async function removePhoto() {
    setMessage("");
    setIsSuccess(false);
    setIsUploading(true);
    try {
      const { data: files, error: listError } = await supabase.storage.from("profile-avatars").list(userId);
      if (listError) throw listError;
      const paths = (files ?? []).map((file) => `${userId}/${file.name}`);
      if (paths.length) {
        const { error: removeError } = await supabase.storage.from("profile-avatars").remove(paths);
        if (removeError) throw removeError;
      }
      setAvatarUrl("");
      setMessage("Photo removed. Choose a color, then save your profile.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not remove that photo.");
    } finally {
      setIsUploading(false);
    }
  }

  async function saveProfile() {
    const nextName = displayName.trim();
    const nextBio = bio.trim();
    const nextPortfolioLinks = portfolioLinks.map(normalizePortfolioUrl);
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
    const nextPortfolioErrors = portfolioLinks.map(getPortfolioUrlError);
    setPortfolioErrors(nextPortfolioErrors);
    if (nextPortfolioErrors.some(Boolean)) {
      setMessage("Fix the highlighted portfolio link before saving.");
      return;
    }
    if (creatorProfile && nextPortfolioLinks.length === 0) {
      setMessage("Creators must keep at least one portfolio link.");
      return;
    }
    setIsSaving(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_color: avatarColor, avatar_url: avatarUrl || null, bio: nextBio, display_name: nextName, portfolio_url: nextPortfolioLinks[0] ?? "", portfolio_urls: nextPortfolioLinks },
      });
      if (authError) throw authError;

      if (creatorProfile) {
        const { error: creatorError } = await supabase
          .from("creator_profiles")
          .update({ avatar_color: avatarColor, avatar_url: avatarUrl || null, bio: nextBio, display_name: nextName, portfolio_url: nextPortfolioLinks[0], portfolio_urls: nextPortfolioLinks })
          .eq("id", creatorProfile.id);
        if (creatorError) throw creatorError;
      }

      setDisplayName(nextName);
      setBio(nextBio);
      setPortfolioLinks(nextPortfolioLinks.length ? nextPortfolioLinks : [""]);
      router.replace("/account?notice=profile-saved");
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
            <ProfileAvatar color={avatarColor} imageUrl={avatarUrl} name={displayName} size={108} />
            <View style={styles.photoActions}>
              <Pressable accessibilityRole="button" disabled={isUploading} onPress={() => void choosePhoto()} style={styles.photoButton}><Text style={styles.photoButtonText}>{isUploading ? "Working..." : hasNativePhotoEditor ? avatarUrl ? "Change & crop photo" : "Choose & crop photo" : avatarUrl ? "Change photo" : "Add photo"}</Text></Pressable>
              {avatarUrl ? <Pressable accessibilityRole="button" disabled={isUploading} onPress={() => void removePhoto()} style={styles.removePhotoButton}><Text style={styles.removePhotoText}>Remove photo</Text></Pressable> : null}
            </View>
            <Text selectable style={styles.photoHelp}>{hasNativePhotoEditor ? "After choosing, pinch to zoom and position your photo." : "JPG, PNG, or WebP · maximum 5 MB"}</Text>
            <Text style={styles.colorLabel}>{avatarUrl ? "Fallback color" : "Avatar color"}</Text>
            <View accessibilityRole="radiogroup" style={styles.colorGrid}>
              {avatarColors.map((option) => {
                const selected = avatarColor === option.value;
                return (
                  <Pressable
                    accessibilityLabel={`${option.label} avatar color`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={option.value}
                    onPress={() => setAvatarColor(option.value)}
                    style={[styles.colorOption, { backgroundColor: option.value }, selected && styles.colorOptionSelected]}
                  >
                    {selected ? <Text style={styles.colorCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
            {avatarUrl ? <Text selectable style={styles.colorHelp}>This color appears if your photo is removed or unavailable.</Text> : null}
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
              <View key={`portfolio-${index}`} style={styles.portfolioField}>
                <View style={styles.portfolioRow}>
                  <TextInput accessibilityHint={portfolioErrors[index] || undefined} accessibilityLabel={`Portfolio link ${index + 1}`} autoCapitalize="none" autoCorrect={false} keyboardType="url" onBlur={() => validatePortfolioLink(index)} onChangeText={(value) => updatePortfolioLink(index, value)} placeholder="instagram.com/yourname" placeholderTextColor="#718997" style={[styles.input, styles.portfolioInput, portfolioErrors[index] && styles.inputError]} value={link} />
                  <Pressable accessibilityLabel={`Remove portfolio link ${index + 1}`} accessibilityRole="button" onPress={() => removePortfolioLink(index)} style={styles.removeLinkButton}><Text style={styles.removeLinkText}>−</Text></Pressable>
                </View>
                {portfolioErrors[index] ? <Text accessibilityLiveRegion="polite" style={styles.fieldError}>{portfolioErrors[index]}</Text> : null}
              </View>
            ))}
          </View>
          <Pressable accessibilityRole="button" disabled={portfolioLinks.length >= 5} onPress={addPortfolioLink} style={[styles.addLinkButton, portfolioLinks.length >= 5 && styles.disabled]}><Text style={styles.addLinkText}>+ Add portfolio link</Text></Pressable>

          {message ? <View accessibilityRole={isSuccess ? undefined : "alert"} style={[styles.message, isSuccess && styles.successMessage]}><Text selectable style={[styles.messageText, isSuccess && styles.successMessageText]}>{message}</Text></View> : null}
          <FeedbackPressable accessibilityRole="button" disabled={isSaving || isUploading} haptic="light" onPress={() => void saveProfile()} style={[styles.saveButton, (isSaving || isUploading) && styles.disabled]}><Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save profile"}</Text></FeedbackPressable>
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
  photoActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 16 },
  photoButton: { alignItems: "center", borderColor: "rgba(255,255,255,0.2)", borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 18 },
  removePhotoButton: { alignItems: "center", borderColor: "rgba(245,163,163,0.35)", borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 18 },
  removePhotoText: { color: "#f5a3a3", fontSize: 14, fontWeight: "800" },
  photoButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  photoHelp: { color: "#698596", fontSize: 12, marginTop: 9 },
  colorLabel: { color: "#e8f2f5", fontSize: 13, fontWeight: "800", marginTop: 22 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 12, maxWidth: 330 },
  colorOption: { alignItems: "center", borderColor: "transparent", borderRadius: 23, borderWidth: 3, height: 46, justifyContent: "center", width: 46 },
  colorOptionSelected: { borderColor: "#ffffff" },
  colorCheck: { color: "#ffffff", fontSize: 20, fontWeight: "900" },
  colorHelp: { color: "#698596", fontSize: 12, marginTop: 10, textAlign: "center" },
  label: { color: "#e8f2f5", fontSize: 14, fontWeight: "700", marginBottom: 9, marginTop: 20 },
  input: { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.15)", borderCurve: "continuous", borderRadius: 14, borderWidth: 1, color: "#ffffff", fontSize: 16, minHeight: 54, paddingHorizontal: 15 },
  bioInput: { minHeight: 120, paddingTop: 14 },
  characterCount: { color: "#698596", fontSize: 12, marginTop: 6, textAlign: "right" },
  portfolioHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  linkLimit: { color: "#698596", fontSize: 12, marginBottom: 9 },
  portfolioList: { gap: 10 },
  portfolioField: { gap: 6 },
  portfolioRow: { alignItems: "center", flexDirection: "row", gap: 9 },
  portfolioInput: { flex: 1 },
  inputError: { borderColor: "#f97066" },
  fieldError: { color: "#fda29b", fontSize: 13, lineHeight: 18, paddingLeft: 4 },
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

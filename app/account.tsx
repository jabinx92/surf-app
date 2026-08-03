import { supabase } from "@/lib/supabase";
import ProfileAvatar, { defaultAvatarColor } from "@/components/profile-avatar";
import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

type CreatorStatus = "approved" | "pending" | "none";

export default function AccountScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const { notice } = useLocalSearchParams<{ notice?: string }>();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("WaveLens user");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState(defaultAvatarColor);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [creatorStatus, setCreatorStatus] = useState<CreatorStatus>("none");
  const [unreadCount, setUnreadCount] = useState(0);

  const loadAccount = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getUser();
    setEmail(data.user?.email ?? null);
    if (data.user) {
      const metadata = data.user.user_metadata ?? {};
      setDisplayName(metadata.display_name ?? data.user.email?.split("@")[0] ?? "WaveLens user");
      setAvatarUrl(metadata.avatar_url ?? null);
      setAvatarColor(metadata.avatar_color ?? defaultAvatarColor);
      const [adminResult, creatorResult, applicationResult, notificationResult] = await Promise.all([
        supabase.rpc("is_wavelens_admin"),
        supabase.from("creator_profiles").select("id").eq("owner_id", data.user.id).maybeSingle(),
        supabase.from("creator_applications").select("status").eq("applicant_id", data.user.id).maybeSingle(),
        supabase.from("user_notifications").select("id", { count: "exact", head: true }).is("read_at", null),
      ]);
      setIsAdmin(Boolean(adminResult.data));
      setCreatorStatus(creatorResult.data ? "approved" : applicationResult.data?.status === "pending" ? "pending" : "none");
      setUnreadCount(notificationResult.error ? 0 : (notificationResult.count ?? 0));
    } else {
      setIsAdmin(false);
      setCreatorStatus("none");
      setUnreadCount(0);
    }
    setIsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void loadAccount(); }, [loadAccount]));

  async function signOut() {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);
    if (error) {
      Alert.alert("Could not sign out", error.message);
      return;
    }
    router.replace("/");
  }

  function requestDeletion() {
    Alert.alert(
      "Delete your WaveLens account?",
      "This permanently removes your account, creator profile, and booking data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: () => void deleteAccount() },
      ],
    );
  }

  async function deleteAccount() {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error || !data?.deleted) throw error ?? new Error("The deletion service did not confirm completion.");
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      Alert.alert("Account deleted", "Your WaveLens account and associated booking data were deleted.");
      router.replace("/");
    } catch (error) {
      Alert.alert("Could not delete account", error instanceof Error ? error.message : "Please try again or contact support.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.screen, isWide && styles.screenWide]} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
      <View style={styles.pageHeader}>
        <Text style={styles.eyebrow}>YOUR WAVELENS</Text>
        <Text style={[styles.title, isWide && styles.titleWide]}>Account</Text>
        <Text style={styles.subtitle}>Manage your bookings, creator tools, and account settings.</Text>
      </View>
      {isLoading ? (
        <View style={styles.state}><ActivityIndicator color="#56d6c9" /></View>
      ) : email ? (
        <View style={[styles.content, isWide && styles.contentWide]}>
          {notice === "profile-saved" ? (
            <View accessibilityRole="alert" style={[styles.reportConfirmation, isWide && styles.fullWidth]}>
              <Text style={styles.reportConfirmationTitle}>✓ Profile saved</Text>
              <Text selectable style={styles.reportConfirmationText}>Your changes have been saved successfully.</Text>
            </View>
          ) : notice === "report-sent" ? (
            <View accessibilityRole="alert" style={[styles.reportConfirmation, isWide && styles.fullWidth]}>
              <Text style={styles.reportConfirmationTitle}>✓ Report sent</Text>
              <Text selectable style={styles.reportConfirmationText}>Thank you for letting us know. A WaveLens admin will review the report and look into it further.</Text>
            </View>
          ) : null}
          <View style={styles.mainColumn}>
            <Text style={styles.sectionLabel}>YOUR ACTIVITY</Text>
            <View style={[styles.actionGrid, isWide && styles.actionGridWide]}>
              <ActionCard description="View upcoming sessions and request updates." isWide={isWide} onPress={() => router.push("/requests")} title="Booking requests" />
              <ActionCard badgeCount={unreadCount} description="See the latest activity on your account." isWide={isWide} onPress={() => router.push("/notifications")} title="Notifications" />
            </View>
            <Text style={styles.sectionLabel}>CREATOR TOOLS</Text>
            <View style={[styles.actionGrid, isWide && styles.actionGridWide]}>
              <ActionCard description="Update your photo, bio, and portfolio links." isWide={isWide} onPress={() => router.push("/profile-settings")} title="Edit profile" />
              <ActionCard description="Review and manage incoming session requests." isWide={isWide} onPress={() => router.push("/creator-requests")} title="Creator dashboard" />
              <ActionCard description="Set the days and times you are available." isWide={isWide} onPress={() => router.push("/availability")} title="Availability" />
              {isAdmin ? <ActionCard admin description="Review applications and safety reports." isWide={isWide} onPress={() => router.push("/admin")} title="Admin approvals" /> : null}
            </View>
          </View>
          <View style={[styles.sideColumn, isWide && styles.sideColumnWide]}>
            <View style={styles.emailCard}>
              <ProfileAvatar color={avatarColor} imageUrl={avatarUrl} name={displayName} size={72} />
              <View style={styles.identityText}><Text style={styles.emailLabel}>SIGNED IN AS</Text><Text selectable style={styles.identityName}>{displayName}</Text><Text selectable style={styles.email}>{email}</Text></View>
            </View>
            {creatorStatus === "approved" ? (
              <View accessibilityLabel="Creator application approved" style={styles.creatorStatusCard}>
                <Text style={styles.creatorStatusBadge}>✓ APPROVED CREATOR</Text>
                <Text selectable style={styles.creatorStatusText}>Your creator application is already approved. Manage your public profile, availability, and incoming requests from the tools on this page.</Text>
                <View style={styles.disabledCta}><Text style={styles.disabledCtaText}>Already approved</Text></View>
              </View>
            ) : creatorStatus === "pending" ? (
              <Pressable accessibilityRole="button" onPress={() => router.push("/creator-application-status")} style={styles.creatorStatusCard}>
                <Text style={styles.pendingStatusBadge}>APPLICATION PENDING</Text>
                <Text selectable style={styles.creatorStatusText}>Your creator application is being reviewed. Open it to check the latest status.</Text>
                <View style={styles.disabledCta}><Text style={styles.disabledCtaText}>View application status</Text></View>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => router.push("/become-a-creator")} style={styles.secondaryButton}><Text style={styles.secondaryText}>Apply as a creator</Text></Pressable>
            )}
            <View style={styles.accountLinks}>
              <Pressable accessibilityRole="link" onPress={() => router.push("/privacy")} style={styles.privacyButton}><Text style={styles.privacyText}>Privacy policy</Text></Pressable>
              <Pressable accessibilityRole="link" onPress={() => router.push("/support" as Href)} style={styles.privacyButton}><Text style={styles.privacyText}>Help and support</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={isSigningOut || isDeleting} onPress={() => void signOut()} style={styles.signOutButton}><Text style={styles.signOutText}>{isSigningOut ? "Signing out..." : "Sign out"}</Text></Pressable>
            </View>
            <View style={styles.dangerZone}><Text style={styles.dangerTitle}>Delete account</Text><Text selectable style={styles.dangerText}>Permanently delete your account, creator profile, and booking data.</Text><Pressable accessibilityRole="button" disabled={isDeleting || isSigningOut} onPress={requestDeletion} style={[styles.deleteButton, isDeleting && styles.disabledButton]}><Text style={styles.deleteText}>{isDeleting ? "Deleting account..." : "Delete account"}</Text></Pressable></View>
          </View>
        </View>
      ) : (
        <View style={styles.state}><Text style={styles.stateTitle}>You are not signed in</Text><Text style={styles.stateText}>Sign in or create an account to send and manage booking requests.</Text><Pressable accessibilityRole="button" onPress={() => router.replace("/sign-in")} style={styles.primaryButton}><Text style={styles.primaryText}>Go to sign in</Text></Pressable></View>
      )}
    </ScrollView>
  );
}

function ActionCard({ admin = false, badgeCount = 0, description, isWide, onPress, title }: { admin?: boolean; badgeCount?: number; description: string; isWide: boolean; onPress: () => void; title: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionCard, isWide && styles.actionCardWide, admin && styles.adminCard, pressed && styles.buttonPressed]}>
      {badgeCount > 0 ? <View accessibilityLabel={`${badgeCount} unread notifications`} style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text></View> : null}
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
      <Text style={styles.actionArrow}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { alignSelf: "center", backgroundColor: "#061827", flexGrow: 1, maxWidth: 680, padding: 20, paddingBottom: 44, width: "100%" },
  screenWide: { maxWidth: 1180, paddingBottom: 64, paddingHorizontal: 40 },
  backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backButtonText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  pageHeader: { paddingTop: 16 },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: "#ffffff", fontSize: 38, fontWeight: "800", letterSpacing: -1.3, marginTop: 10 },
  titleWide: { fontSize: 50, letterSpacing: -2 },
  subtitle: { color: "#91a8b8", fontSize: 16, lineHeight: 23, marginTop: 10 },
  content: { gap: 24, marginTop: 32 },
  contentWide: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: 32 },
  fullWidth: { flexBasis: "100%" },
  mainColumn: { flex: 1, gap: 14, minWidth: 0 },
  sideColumn: { gap: 14 },
  sideColumnWide: { flexBasis: 330, flexShrink: 0 },
  sectionLabel: { color: "#91a8b8", fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginTop: 4 },
  actionGrid: { gap: 12 },
  actionGridWide: { flexDirection: "row", flexWrap: "wrap" },
  actionCard: { backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, minHeight: 104, paddingHorizontal: 16, paddingVertical: 13 },
  actionCardWide: { flexBasis: "47%", flexGrow: 1 },
  notificationBadge: { alignItems: "center", backgroundColor: "#ef4444", borderColor: "#061827", borderRadius: 999, borderWidth: 2, justifyContent: "center", minHeight: 26, minWidth: 26, paddingHorizontal: 6, position: "absolute", right: 12, top: 12, zIndex: 1 },
  notificationBadgeText: { color: "#ffffff", fontSize: 12, fontVariant: ["tabular-nums"], fontWeight: "900" },
  actionTitle: { color: "#ffffff", fontSize: 17, fontWeight: "900" },
  actionDescription: { color: "#91a8b8", fontSize: 14, lineHeight: 19, marginTop: 5, paddingRight: 28 },
  actionArrow: { color: "#56d6c9", fontSize: 20, fontWeight: "700", marginTop: 5 },
  adminCard: { borderColor: "rgba(86,214,201,0.28)" },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  emailCard: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.13)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 14, padding: 17 },
  identityText: { flex: 1 },
  identityName: { color: "#ffffff", fontSize: 18, fontWeight: "900", marginTop: 5 },
  emailLabel: { color: "#91a8b8", fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  email: { color: "#91a8b8", fontSize: 13, marginTop: 3 },
  reportConfirmation: { backgroundColor: "rgba(86,214,201,0.1)", borderColor: "rgba(86,214,201,0.3)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, gap: 6, padding: 17 },
  reportConfirmationTitle: { color: "#7ce0d6", fontSize: 16, fontWeight: "900" },
  reportConfirmationText: { color: "#d9e5ec", fontSize: 14, lineHeight: 20 },
  state: { alignItems: "center", gap: 14, paddingHorizontal: 22, paddingTop: 90 },
  stateTitle: { color: "#ffffff", fontSize: 22, fontWeight: "800" },
  stateText: { color: "#b9c9d6", fontSize: 16, lineHeight: 23, textAlign: "center" },
  primaryButton: { alignItems: "center", backgroundColor: "#56d6c9", borderCurve: "continuous", borderRadius: 16, justifyContent: "center", minHeight: 54, paddingHorizontal: 18 },
  primaryText: { color: "#061827", fontSize: 16, fontWeight: "800" },
  secondaryButton: { alignItems: "center", borderColor: "rgba(255,255,255,0.2)", borderCurve: "continuous", borderRadius: 16, borderWidth: 1, justifyContent: "center", minHeight: 54, paddingHorizontal: 18 },
  secondaryText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  creatorStatusCard: { backgroundColor: "rgba(86,214,201,0.07)", borderColor: "rgba(86,214,201,0.2)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, gap: 9, padding: 17 },
  creatorStatusBadge: { color: "#7ce0d6", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  pendingStatusBadge: { color: "#ffd4a3", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  creatorStatusText: { color: "#b9c9d6", fontSize: 14, lineHeight: 20 },
  disabledCta: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 13, borderWidth: 1, justifyContent: "center", marginTop: 3, minHeight: 43, opacity: 0.55 },
  disabledCtaText: { color: "#d9e5ec", fontSize: 14, fontWeight: "800" },
  accountLinks: { backgroundColor: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.08)", borderRadius: 18, borderWidth: 1, padding: 8 },
  signOutButton: { alignItems: "center", justifyContent: "center", minHeight: 44 },
  signOutText: { color: "#f5a3a3", fontSize: 15, fontWeight: "800" },
  privacyButton: { alignItems: "center", justifyContent: "center", minHeight: 40 },
  privacyText: { color: "#91a8b8", fontSize: 14, fontWeight: "700" },
  dangerZone: { borderColor: "rgba(240,112,112,0.35)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, padding: 17 },
  dangerTitle: { color: "#ffffff", fontSize: 17, fontWeight: "800" },
  dangerText: { color: "#b9c9d6", fontSize: 14, lineHeight: 20, marginTop: 7 },
  deleteButton: { alignItems: "center", borderColor: "rgba(240,112,112,0.7)", borderCurve: "continuous", borderRadius: 13, borderWidth: 1, justifyContent: "center", marginTop: 16, minHeight: 45, paddingHorizontal: 14 },
  disabledButton: { opacity: 0.6 },
  deleteText: { color: "#f5a3a3", fontSize: 14, fontWeight: "800" },
});

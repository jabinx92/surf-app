import { supabase } from "@/lib/supabase";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type CreatorRequest = { id: string; service_type: string; session_date: string; session_hours: number; surf_spot: string; notes: string; contact_details: string; status: "pending" | "accepted" | "declined" | "cancelled" };

export default function CreatorRequestsScreen() {
  const [requests, setRequests] = useState<CreatorRequest[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const loadRequests = useCallback(async () => {
    setIsLoading(true); setMessage("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) { setMessage("Sign in to see requests for your creator profile."); return; }
      const { data: profile, error: profileError } = await supabase.from("creator_profiles").select("id, is_listed").eq("owner_id", userData.user.id).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) { setMessage("Your application is not approved yet. We will email you after your creator profile is ready."); return; }
      const { data, error } = await supabase.from("booking_requests").select("id, service_type, session_date, session_hours, surf_spot, notes, contact_details, status").eq("creator_profile_id", profile.id).order("created_at", { ascending: false });
      if (error) throw error;
      setRequests((data ?? []) as CreatorRequest[]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load creator requests."); }
    finally { setIsLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void loadRequests(); }, [loadRequests]));
  async function updateRequest(id: string, status: "accepted" | "declined") { const { error } = await supabase.from("booking_requests").update({ status }).eq("id", id); if (error) { Alert.alert("Could not update request", error.message); return; } void loadRequests(); }
  return <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic"><StatusBar style="light" /><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable><Text style={styles.eyebrow}>CREATOR DASHBOARD</Text><Text style={styles.title}>Incoming requests</Text><Text style={styles.subtitle}>Review and reply to surfers who want to book you.</Text>{isLoading ? <View style={styles.state}><ActivityIndicator color="#56d6c9" /></View> : message ? <View style={styles.state}><Text style={styles.stateText}>{message}</Text></View> : requests.length === 0 ? <View style={styles.state}><Text style={styles.stateText}>No new requests yet.</Text></View> : <View style={styles.list}>{requests.map((request) => <View key={request.id} style={styles.card}><Text style={styles.cardTitle}>{request.service_type} · {request.session_hours} {request.session_hours === 1 ? "hour" : "hours"} · {request.session_date}</Text><Text style={styles.spot}>{request.surf_spot}</Text>{request.notes ? <Text style={styles.notes}>{request.notes}</Text> : null}<Text style={styles.contact}>Reply: {request.contact_details}</Text>{request.status === "pending" ? <View style={styles.actions}><Pressable accessibilityRole="button" onPress={() => void updateRequest(request.id, "declined")} style={styles.declineButton}><Text style={styles.declineText}>Decline</Text></Pressable><Pressable accessibilityRole="button" onPress={() => void updateRequest(request.id, "accepted")} style={styles.acceptButton}><Text style={styles.acceptText}>Accept</Text></Pressable></View> : <Text style={styles.status}>{request.status}</Text>}</View>)}</View>}</ScrollView>;
}
const styles = StyleSheet.create({ screen: { backgroundColor: "#061827", flexGrow: 1, padding: 20, paddingBottom: 44 }, backButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: 24 }, backButtonText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" }, eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginTop: 16 }, title: { color: "#ffffff", fontSize: 38, fontWeight: "800", letterSpacing: -1.3, marginTop: 10 }, subtitle: { color: "#b9c9d6", fontSize: 16, lineHeight: 23, marginTop: 10 }, state: { alignItems: "center", paddingHorizontal: 20, paddingTop: 96 }, stateText: { color: "#b9c9d6", fontSize: 16, lineHeight: 23, textAlign: "center" }, list: { gap: 12, marginTop: 30 }, card: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.13)", borderRadius: 18, borderWidth: 1, padding: 17 }, cardTitle: { color: "#ffffff", fontSize: 18, fontWeight: "800" }, spot: { color: "#7ce0d6", fontSize: 14, fontWeight: "800", marginTop: 8 }, notes: { color: "#b9c9d6", fontSize: 15, lineHeight: 22, marginTop: 9 }, contact: { color: "#7ce0d6", fontSize: 14, fontWeight: "700", marginTop: 12 }, actions: { flexDirection: "row", gap: 10, marginTop: 18 }, declineButton: { alignItems: "center", borderColor: "rgba(255,255,255,0.25)", borderRadius: 12, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 46 }, declineText: { color: "#ffffff", fontWeight: "800" }, acceptButton: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 12, flex: 1, justifyContent: "center", minHeight: 46 }, acceptText: { color: "#061827", fontWeight: "800" }, status: { color: "#7ce0d6", fontSize: 14, fontWeight: "800", marginTop: 16, textTransform: "capitalize" } });

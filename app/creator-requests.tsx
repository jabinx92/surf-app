import { supabase } from "@/lib/supabase";
import FeedbackPressable from "@/components/feedback-pressable";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
type CreatorRequest = {
  id: string;
  service_type: string;
  session_date: string;
  session_hours: number;
  surf_spot: string;
  notes: string;
  contact_details: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "completed";
};
export default function CreatorRequestsScreen() {
  const [requests, setRequests] = useState<CreatorRequest[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setMessage("Sign in to see requests for your creator profile.");
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("owner_id", userData.user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) {
        setMessage("Your application is not approved yet.");
        return;
      }
      const { data, error } = await supabase
        .from("booking_requests")
        .select(
          "id, service_type, session_date, session_hours, surf_spot, notes, contact_details, status",
        )
        .eq("creator_profile_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRequests((data ?? []) as CreatorRequest[]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load creator requests.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );
  async function updateRequest(
    id: string,
    status: "accepted" | "declined" | "completed",
  ) {
    const { error } = await supabase
      .from("booking_requests")
      .update({ status })
      .eq("id", id);
    if (error) {
      Alert.alert("Could not update request", error.message);
      return;
    }
    if (process.env.EXPO_OS === "ios") {
      void Haptics.notificationAsync(
        status === "accepted" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );
    }
    void loadRequests();
  }
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <StatusBar style="light" />
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.eyebrow}>CREATOR DASHBOARD</Text>
      <Text style={styles.title}>Incoming requests</Text>
      <Text style={styles.subtitle}>
        Review requests, coordinate sessions, and mark delivered work complete.
      </Text>
      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#56d6c9" />
        </View>
      ) : message ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>{message}</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>No new requests yet.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {requests.map((request) => (
            <View key={request.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {request.service_type} · {request.session_hours}{" "}
                {request.session_hours === 1 ? "hour" : "hours"} ·{" "}
                {request.session_date}
              </Text>
              <Text style={styles.spot}>{request.surf_spot}</Text>
              {request.notes ? (
                <Text style={styles.notes}>{request.notes}</Text>
              ) : null}
              <Text style={styles.contact}>
                Reply: {request.contact_details}
              </Text>
              {request.status === "pending" ? (
                <View style={styles.actions}>
                  <FeedbackPressable
                    haptic="none"
                    onPress={() => void updateRequest(request.id, "declined")}
                    style={styles.decline}
                    wrapperStyle={styles.actionButtonWrapper}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </FeedbackPressable>
                  <FeedbackPressable
                    haptic="none"
                    onPress={() => void updateRequest(request.id, "accepted")}
                    style={styles.accept}
                    wrapperStyle={styles.actionButtonWrapper}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </FeedbackPressable>
                </View>
              ) : (
                <Text style={styles.status}>{request.status}</Text>
              )}
              <View style={styles.tools}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/gallery/[bookingId]",
                      params: { bookingId: request.id },
                    })
                  }
                  style={styles.completeButton}
                >
                  <Text style={styles.completeText}>Delivery gallery</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/messages/[bookingId]",
                      params: { bookingId: request.id },
                    })
                  }
                  style={styles.messageButton}
                >
                  <Text style={styles.messageText}>Messages</Text>
                </Pressable>
                {request.status === "accepted" ? (
                  <Pressable
                    onPress={() => void updateRequest(request.id, "completed")}
                    style={styles.completeButton}
                  >
                    <Text style={styles.completeText}>Mark completed</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/report",
                      params: { bookingId: request.id },
                    })
                  }
                  style={styles.report}
                >
                  <Text style={styles.reportText}>Report</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#061827",
    flexGrow: 1,
    padding: 20,
    paddingBottom: 44,
  },
  back: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44 },
  backText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  eyebrow: {
    color: "#7ce0d6",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 16,
  },
  title: { color: "#fff", fontSize: 38, fontWeight: "900", marginTop: 10 },
  subtitle: { color: "#b9c9d6", fontSize: 16, lineHeight: 23, marginTop: 10 },
  state: { alignItems: "center", paddingTop: 90 },
  stateText: { color: "#b9c9d6", fontSize: 16, textAlign: "center" },
  list: { gap: 13, marginTop: 28 },
  card: {
    backgroundColor: "rgba(255,255,255,.06)",
    borderColor: "rgba(255,255,255,.13)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 17,
  },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  spot: { color: "#7ce0d6", fontSize: 14, fontWeight: "800", marginTop: 8 },
  notes: { color: "#b9c9d6", fontSize: 15, lineHeight: 22, marginTop: 9 },
  contact: { color: "#7ce0d6", fontSize: 14, fontWeight: "700", marginTop: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  actionButtonWrapper: { flex: 1 },
  decline: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,.25)",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  declineText: { color: "#fff", fontWeight: "800" },
  accept: {
    alignItems: "center",
    backgroundColor: "#56d6c9",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  acceptText: { color: "#061827", fontWeight: "900" },
  status: {
    color: "#7ce0d6",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 16,
    textTransform: "capitalize",
  },
  tools: {
    alignItems: "center",
    borderTopColor: "rgba(255,255,255,.1)",
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
    paddingTop: 13,
  },
  messageButton: {
    backgroundColor: "#1d4259",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  messageText: { color: "#fff", fontWeight: "800" },
  completeButton: {
    backgroundColor: "#56d6c9",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  completeText: { color: "#061827", fontWeight: "900" },
  report: { padding: 10 },
  reportText: { color: "#91a8b8", fontSize: 13, fontWeight: "700" },
});

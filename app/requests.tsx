import { supabase } from "@/lib/supabase";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { formatSessionDate, formatSessionTime } from "@/utils/session-time";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type BookingRequest = {
  id: string;
  creator_profile_id: string;
  creator_display_name: string | null;
  service_type: string;
  session_date: string;
  session_start_time: string | null;
  session_hours: number;
  surf_spot: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "completed";
  completed_at: string | null;
  creator_reviews: { id: string }[] | null;
};

const reviewIsDue = (request: BookingRequest) =>
  request.status === "completed" &&
  Boolean(request.completed_at) &&
  Date.now() - new Date(request.completed_at as string).getTime() >= 24 * 60 * 60 * 1000 &&
  (request.creator_reviews?.length ?? 0) === 0;

export default function RequestsScreen() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setMessage("Sign in to see your booking requests.");
        setRequests([]);
        return;
      }
      const { data, error } = await supabase
        .from("booking_requests")
        .select(
          "id, creator_profile_id, creator_display_name, service_type, session_date, session_start_time, session_hours, surf_spot, status, completed_at, creator_reviews(id)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRequests((data ?? []) as BookingRequest[]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load your booking requests.",
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
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
    >
      <StatusBar style="light" />
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.eyebrow}>YOUR SESSIONS</Text>
      <Text style={styles.title}>Booking requests</Text>
      <Text style={styles.subtitle}>
        Track bookings, messages, and reviews in one place.
      </Text>
      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#56d6c9" />
        </View>
      ) : message ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>{message}</Text>
          <Pressable
            onPress={() => router.push("/sign-in")}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.emptyTitle}>No requests yet</Text>
          <Text style={styles.stateText}>
            Find a creator near your next surf session to get started.
          </Text>
          <Pressable
            onPress={() => router.push("/location")}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Find a creator</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {requests.map((request) => (
            <View key={request.id} style={styles.card}>
              <Pressable
                accessibilityHint="Opens this session's details and booking actions"
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/session/[bookingId]", params: { bookingId: request.id } })}
                style={({ pressed }) => [styles.cardHeader, pressed && styles.buttonPressed]}
              >
                <View style={styles.cardMain}>
                  <Text style={styles.creatorName}>
                    Booking with {request.creator_display_name ?? "creator unavailable"}
                  </Text>
                  <Text style={styles.schedule}>
                    {formatSessionDate(request.session_date)} at {formatSessionTime(request.session_start_time)} · {request.surf_spot}
                  </Text>
                  <Text style={styles.sessionInfo}>
                    {request.service_type} · {request.session_hours}{" "}
                    {request.session_hours === 1 ? "hour" : "hours"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.status,
                    request.status === "accepted" ||
                    request.status === "completed"
                      ? styles.accepted
                      : request.status === "declined" ||
                          request.status === "cancelled"
                        ? styles.declined
                        : styles.pending,
                  ]}
                >
                  <Text style={styles.statusText}>{request.status}</Text>
                </View>
              </Pressable>
              {reviewIsDue(request) ? (
                <View style={styles.reminder}>
                  <Text style={styles.reminderEyebrow}>ONE QUICK FAVOR</Text>
                  <Text style={styles.reminderTitle}>
                    How was your session with {request.creator_display_name ?? "your creator"}?
                  </Text>
                  <Text style={styles.reminderBody}>
                    Your photos are in. Help other surfers book confidently by sharing how it went.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: "/review/[bookingId]",
                        params: { bookingId: request.id, creatorId: request.creator_profile_id },
                      })
                    }
                    style={({ pressed }) => [styles.reminderButton, pressed && styles.buttonPressed]}
                  >
                    <Text style={styles.reminderButtonText}>Leave a review</Text>
                  </Pressable>
                </View>
              ) : null}
              <View style={styles.actions}>
                <Pressable
                  onPress={() => router.push({ pathname: "/session/[bookingId]", params: { bookingId: request.id } })}
                  style={styles.action}
                >
                  <Text style={styles.actionText}>View session</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/gallery/[bookingId]",
                      params: { bookingId: request.id },
                    })
                  }
                  style={styles.review}
                >
                  <Text style={styles.reviewText}>Delivery gallery</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/messages/[bookingId]",
                      params: { bookingId: request.id },
                    })
                  }
                  style={styles.action}
                >
                  <Text style={styles.actionText}>Messages</Text>
                </Pressable>
                {request.status === "completed" && !reviewIsDue(request) ? (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/review/[bookingId]",
                        params: {
                          bookingId: request.id,
                          creatorId: request.creator_profile_id,
                        },
                      })
                    }
                    style={styles.review}
                  >
                    <Text style={styles.reviewText}>Leave a review</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/report",
                      params: {
                        bookingId: request.id,
                        creatorId: request.creator_profile_id,
                      },
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
    alignSelf: "center",
    backgroundColor: "#061827",
    flexGrow: 1,
    maxWidth: 680,
    padding: 20,
    paddingBottom: 44,
    width: "100%",
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
  state: { alignItems: "center", gap: 14, paddingTop: 90 },
  stateText: { color: "#b9c9d6", fontSize: 16, textAlign: "center" },
  emptyTitle: { color: "#fff", fontSize: 23, fontWeight: "900" },
  primary: {
    backgroundColor: "#56d6c9",
    borderRadius: 15,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  primaryText: { color: "#061827", fontWeight: "900" },
  list: { gap: 12, marginTop: 28 },
  card: {
    backgroundColor: "rgba(255,255,255,.06)",
    borderColor: "rgba(255,255,255,.13)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 17,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  reminder: {
    backgroundColor: "#0d3b45",
    borderColor: "rgba(124,224,214,.35)",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 17,
    padding: 17,
  },
  reminderEyebrow: { color: "#7ce0d6", fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  reminderTitle: { color: "#fff", fontSize: 20, fontWeight: "900", lineHeight: 26, marginTop: 8 },
  reminderBody: { color: "#c5d9df", fontSize: 14, lineHeight: 21, marginTop: 7 },
  reminderButton: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 12, marginTop: 15, paddingVertical: 13 },
  reminderButtonText: { color: "#061827", fontSize: 15, fontWeight: "900" },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  cardMain: { flex: 1 },
  creatorName: { color: "#fff", fontSize: 18, fontWeight: "900" },
  schedule: { color: "#7ce0d6", fontSize: 14, fontWeight: "800", lineHeight: 20, marginTop: 7 },
  sessionInfo: { color: "#b9c9d6", fontSize: 14, marginTop: 6 },
  status: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pending: { backgroundColor: "rgba(245,184,65,.18)" },
  accepted: { backgroundColor: "rgba(86,214,201,.16)" },
  declined: { backgroundColor: "rgba(240,112,112,.16)" },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  actions: {
    alignItems: "center",
    borderTopColor: "rgba(255,255,255,.1)",
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 16,
    paddingTop: 14,
  },
  action: {
    backgroundColor: "#1d4259",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  actionText: { color: "#fff", fontWeight: "800" },
  review: {
    backgroundColor: "#56d6c9",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  reviewText: { color: "#061827", fontWeight: "900" },
  report: { paddingHorizontal: 8, paddingVertical: 10 },
  reportText: { color: "#91a8b8", fontSize: 13, fontWeight: "700" },
});

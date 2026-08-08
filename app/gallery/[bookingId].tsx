import { supabase } from "@/lib/supabase";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type DeliveryStatus =
  | "awaiting_uploads"
  | "preview_ready"
  | "changes_requested"
  | "final_ready"
  | "delivered";
type DeliveryNote = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export default function DeliveryGalleryScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [userId, setUserId] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const [status, setStatus] = useState<DeliveryStatus>("awaiting_uploads");
  const [previewUrl, setPreviewUrl] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"preview" | "final" | null>(null);
  const [message, setMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionMessageType, setActionMessageType] = useState<
    "error" | "success"
  >("success");
  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/sign-in");
        return;
      }
      setUserId(userData.user.id);
      const [
        { data: booking, error: bookingError },
        { data: creatorAccess, error: creatorError },
        { data: noteRows, error: notesError },
      ] = await Promise.all([
        supabase
          .from("booking_requests")
          .select(
            "delivery_status, preview_gallery_url, final_gallery_url, delivery_message",
          )
          .eq("id", bookingId)
          .single(),
        supabase.rpc("is_booking_creator", { booking_uuid: bookingId }),
        supabase
          .from("booking_delivery_notes")
          .select("id, author_id, body, created_at")
          .eq("booking_request_id", bookingId)
          .order("created_at"),
      ]);
      if (bookingError) throw bookingError;
      if (creatorError) throw creatorError;
      if (notesError) throw notesError;
      setIsCreator(Boolean(creatorAccess));
      setStatus(booking.delivery_status as DeliveryStatus);
      setPreviewUrl(booking.preview_gallery_url ?? "");
      setFinalUrl(booking.final_gallery_url ?? "");
      setDeliveryMessage(booking.delivery_message ?? "");
      setNotes((noteRows ?? []) as DeliveryNote[]);
    } catch (error) {
      setMessage(
        typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
          ? error.message
          : "Could not load delivery details.",
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  function validUrl(value: string) {
    return /^https?:\/\//i.test(value.trim());
  }
  async function saveLink(kind: "preview" | "final") {
    const url = (kind === "preview" ? previewUrl : finalUrl).trim();
    setActionMessage("");
    if (!validUrl(url)) {
      setActionMessageType("error");
      setActionMessage(
        "Enter a full gallery link beginning with http:// or https://.",
      );
      return;
    }
    setSaving(kind);
    const updates =
      kind === "preview"
        ? {
            preview_gallery_url: url,
            delivery_message: deliveryMessage.trim(),
            delivery_status: "preview_ready",
          }
        : {
            final_gallery_url: url,
            delivery_message: deliveryMessage.trim(),
            delivery_status: "final_ready",
          };
    const { error } = await supabase
      .from("booking_requests")
      .update(updates)
      .eq("id", bookingId);
    setSaving(null);
    if (error) {
      setActionMessageType("error");
      setActionMessage(error.message);
    } else {
      setActionMessageType("success");
      setActionMessage(
        kind === "preview"
          ? "Preview gallery shared. The customer can open it now."
          : "Final delivery shared. The customer can open and download it now.",
      );
      void load();
    }
  }
  async function addNote() {
    const body = noteDraft.trim();
    if (!body) return;
    const { error } = await supabase
      .from("booking_delivery_notes")
      .insert({ booking_request_id: bookingId, author_id: userId, body });
    if (error) {
      Alert.alert("Could not add note", error.message);
      return;
    }
    setNoteDraft("");
    if (!isCreator)
      await supabase
        .from("booking_requests")
        .update({ delivery_status: "changes_requested" })
        .eq("id", bookingId);
    void load();
  }
  async function updateStatus(next: DeliveryStatus) {
    const { error } = await supabase
      .from("booking_requests")
      .update({ delivery_status: next })
      .eq("id", bookingId);
    if (error) Alert.alert("Could not update delivery", error.message);
    else void load();
  }
  async function openGallery(url: string) {
    if (!validUrl(url)) {
      Alert.alert(
        "Gallery unavailable",
        "The creator has not shared this gallery yet.",
      );
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Could not open gallery",
        "Check the link or try again later.",
      );
    }
  }
  const statusLabel = status.replaceAll("_", " ");
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar style="light" />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.back}
      >
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.eyebrow}>MEDIA DELIVERY</Text>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Session delivery</Text>
        <View style={styles.status}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>
        {isCreator
          ? "Share links from SmugMug, Dropbox, Google Drive, Pixieset, or your preferred gallery service."
          : "Open preview and final galleries, then leave editing notes here in WaveLens."}
      </Text>
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#56d6c9" />
        </View>
      ) : message ? (
        <View style={styles.state}>
          <Text style={styles.muted}>{message}</Text>
        </View>
      ) : (
        <>
          {actionMessage ? (
            <View
              accessibilityLiveRegion="polite"
              style={
                actionMessageType === "success"
                  ? styles.successBanner
                  : styles.errorBanner
              }
            >
              <Text
                style={
                  actionMessageType === "success"
                    ? styles.successBannerText
                    : styles.errorBannerText
                }
              >
                {actionMessage}
              </Text>
            </View>
          ) : null}
          <View style={styles.deliveryCard}>
            <View style={styles.number}>
              <Text style={styles.numberText}>1</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Preview gallery</Text>
              <Text style={styles.cardDescription}>
                {previewUrl
                  ? "The preview gallery is ready to review."
                  : "Waiting for a preview link."}
              </Text>
              {isCreator ? (
                <>
                  <TextInput
                    accessibilityLabel="Preview gallery URL"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    value={previewUrl}
                    onChangeText={setPreviewUrl}
                    placeholder="https://smugmug.com/gallery/..."
                    placeholderTextColor="#698596"
                    style={styles.input}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={saving !== null}
                    onPress={() => void saveLink("preview")}
                    style={styles.primary}
                  >
                    <Text style={styles.primaryText}>
                      {saving === "preview" ? "Sharing..." : "Share preview link"}
                    </Text>
                  </Pressable>
                </>
              ) : previewUrl ? (
                <Pressable
                  onPress={() => void openGallery(previewUrl)}
                  style={styles.primary}
                >
                  <Text style={styles.primaryText}>Open preview gallery</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <View style={styles.deliveryCard}>
            <View style={styles.number}>
              <Text style={styles.numberText}>2</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Final delivery</Text>
              <Text style={styles.cardDescription}>
                {finalUrl
                  ? "The final gallery is ready to view and download."
                  : "Final files will appear here after edits."}
              </Text>
              {isCreator ? (
                <>
                  <TextInput
                    accessibilityLabel="Final gallery URL"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    value={finalUrl}
                    onChangeText={setFinalUrl}
                    placeholder="https://dropbox.com/s/..."
                    placeholderTextColor="#698596"
                    style={styles.input}
                  />
                  <TextInput
                    accessibilityLabel="Delivery message"
                    multiline
                    maxLength={1000}
                    value={deliveryMessage}
                    onChangeText={setDeliveryMessage}
                    placeholder="Password, expiration date, download instructions..."
                    placeholderTextColor="#698596"
                    style={[styles.input, styles.messageInput]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={saving !== null}
                    onPress={() => void saveLink("final")}
                    style={styles.primary}
                  >
                    <Text style={styles.primaryText}>
                      {saving === "final" ? "Sharing..." : "Share final delivery"}
                    </Text>
                  </Pressable>
                </>
              ) : finalUrl ? (
                <>
                  <Pressable
                    onPress={() => void openGallery(finalUrl)}
                    style={styles.primary}
                  >
                    <Text style={styles.primaryText}>Open final gallery</Text>
                  </Pressable>
                  {deliveryMessage ? (
                    <Text selectable style={styles.deliveryMessage}>
                      {deliveryMessage}
                    </Text>
                  ) : null}
                </>
              ) : null}
            </View>
          </View>
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>EDITING NOTES</Text>
            {notes.length === 0 ? (
              <Text style={styles.mutedLeft}>No editing notes yet.</Text>
            ) : (
              <View style={styles.notes}>
                {notes.map((note) => (
                  <View key={note.id} style={styles.note}>
                    <Text style={styles.noteAuthor}>
                      {note.author_id === userId
                        ? "You"
                        : "Booking participant"}
                    </Text>
                    <Text selectable style={styles.noteBody}>
                      {note.body}
                    </Text>
                    <Text style={styles.noteTime}>
                      {new Date(note.created_at).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.composer}>
              <TextInput
                accessibilityLabel="Editing note"
                multiline
                value={noteDraft}
                onChangeText={setNoteDraft}
                placeholder="Describe crops, color changes, favorite moments..."
                placeholderTextColor="#698596"
                style={styles.noteInput}
              />
              <Pressable
                onPress={() => void addNote()}
                style={styles.noteButton}
              >
                <Text style={styles.noteButtonText}>Add note</Text>
              </Pressable>
            </View>
          </View>
          {!isCreator && status === "preview_ready" ? (
            <Pressable
              onPress={() => void updateStatus("changes_requested")}
              style={styles.secondary}
            >
              <Text style={styles.secondaryText}>Request changes</Text>
            </Pressable>
          ) : null}
          {!isCreator && status === "final_ready" ? (
            <Pressable
              onPress={() => void updateStatus("delivered")}
              style={styles.primary}
            >
              <Text style={styles.primaryText}>Confirm delivery complete</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: "center",
    backgroundColor: "#061827",
    flexGrow: 1,
    maxWidth: 760,
    padding: 20,
    paddingBottom: 60,
    width: "100%",
  },
  back: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44 },
  backText: { color: "#d9e5ec", fontSize: 16 },
  eyebrow: {
    color: "#7ce0d6",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 16,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  title: { color: "#fff", fontSize: 38, fontWeight: "900" },
  status: {
    backgroundColor: "rgba(86,214,201,.13)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusText: {
    color: "#7ce0d6",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  subtitle: { color: "#b9c9d6", fontSize: 16, lineHeight: 23, marginTop: 10 },
  state: { alignItems: "center", paddingTop: 80 },
  muted: { color: "#91a8b8", fontSize: 15, textAlign: "center" },
  mutedLeft: { color: "#698596", fontSize: 14 },
  successBanner: {
    backgroundColor: "rgba(86,214,201,.12)",
    borderColor: "rgba(86,214,201,.4)",
    borderRadius: 13,
    borderWidth: 1,
    marginTop: 18,
    padding: 13,
  },
  successBannerText: { color: "#8ff0e7", fontSize: 14, fontWeight: "700" },
  errorBanner: {
    backgroundColor: "rgba(248,113,113,.1)",
    borderColor: "rgba(248,113,113,.4)",
    borderRadius: 13,
    borderWidth: 1,
    marginTop: 18,
    padding: 13,
  },
  errorBannerText: { color: "#fca5a5", fontSize: 14, fontWeight: "700" },
  deliveryCard: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,.055)",
    borderColor: "rgba(255,255,255,.12)",
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginTop: 22,
    padding: 17,
  },
  number: {
    alignItems: "center",
    backgroundColor: "#1d4259",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  numberText: { color: "#7ce0d6", fontWeight: "900" },
  cardContent: { flex: 1 },
  cardTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  cardDescription: {
    color: "#91a8b8",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  input: {
    backgroundColor: "rgba(255,255,255,.06)",
    borderColor: "rgba(255,255,255,.14)",
    borderRadius: 13,
    borderWidth: 1,
    color: "#fff",
    fontSize: 15,
    marginTop: 14,
    minHeight: 50,
    paddingHorizontal: 13,
  },
  messageInput: { minHeight: 90, paddingTop: 13, textAlignVertical: "top" },
  primary: {
    alignItems: "center",
    backgroundColor: "#56d6c9",
    borderRadius: 13,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 48,
    paddingHorizontal: 17,
  },
  primaryText: { color: "#061827", fontWeight: "900" },
  secondary: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,.22)",
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 17,
  },
  secondaryText: { color: "#fff", fontWeight: "800" },
  deliveryMessage: {
    backgroundColor: "rgba(86,214,201,.07)",
    borderRadius: 11,
    color: "#d9e5ec",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    padding: 12,
  },
  notesSection: {
    borderTopColor: "rgba(255,255,255,.12)",
    borderTopWidth: 1,
    marginTop: 28,
    paddingTop: 22,
  },
  notesTitle: {
    color: "#91a8b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  notes: { gap: 9 },
  note: {
    backgroundColor: "rgba(255,255,255,.045)",
    borderRadius: 12,
    padding: 12,
  },
  noteAuthor: { color: "#7ce0d6", fontSize: 10, fontWeight: "900" },
  noteBody: { color: "#d9e5ec", fontSize: 14, lineHeight: 20, marginTop: 5 },
  noteTime: { color: "#698596", fontSize: 10, marginTop: 6 },
  composer: { gap: 9, marginTop: 14 },
  noteInput: {
    backgroundColor: "rgba(255,255,255,.06)",
    borderColor: "rgba(255,255,255,.13)",
    borderRadius: 13,
    borderWidth: 1,
    color: "#fff",
    minHeight: 90,
    padding: 13,
    textAlignVertical: "top",
  },
  noteButton: {
    alignItems: "center",
    backgroundColor: "#1d4259",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 45,
  },
  noteButtonText: { color: "#fff", fontWeight: "800" },
});

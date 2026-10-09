import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type BookingDraft = {
  contactDetails: string;
  creatorId: string;
  notes: string;
  serviceType: "Photography" | "Video" | "Drone";
  sessionDate: string;
  sessionHours: 1 | 2 | 3 | 4;
  sessionStartTime: string;
  spot: string;
};

const bookingDraftKey = (creatorId: string) => `wavelens-booking-draft:${creatorId}`;

async function readValue(key: string) {
  if (Platform.OS === "web") {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeValue(key: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveBookingDraft(draft: BookingDraft) {
  await writeValue(bookingDraftKey(draft.creatorId), JSON.stringify(draft));
}

export async function loadBookingDraft(creatorId: string) {
  const savedDraft = await readValue(bookingDraftKey(creatorId));
  if (!savedDraft) return null;
  try {
    return JSON.parse(savedDraft) as BookingDraft;
  } catch {
    await removeValue(bookingDraftKey(creatorId));
    return null;
  }
}

export async function clearBookingDraft(creatorId: string) {
  await removeValue(bookingDraftKey(creatorId));
}

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import { supabase } from "@/lib/supabase";

export async function enableBookingPushReminders() {
  if (process.env.EXPO_OS === "web") {
    throw new Error("Push reminders become available in the installed iOS or Android app.");
  }
  if (!Device.isDevice) {
    throw new Error("Use a physical phone to enable push reminders.");
  }

  if (process.env.EXPO_OS === "android") {
    await Notifications.setNotificationChannelAsync("booking-reminders", {
      name: "Booking reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.granted
    ? currentPermission
    : await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Allow notifications in your phone settings to receive booking reminders.");
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error("WaveLens push notifications are not configured yet.");
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const { error } = await supabase.rpc("register_push_device", {
    device_platform: process.env.EXPO_OS,
    device_timezone: timezone,
    push_token: token,
  });
  if (error) throw error;
}

export async function disableBookingPushReminders() {
  const { error } = await supabase.rpc("disable_push_devices");
  if (error) throw error;
}

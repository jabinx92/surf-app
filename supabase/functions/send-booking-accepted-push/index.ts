// @ts-nocheck - Supabase Edge Runtime file.
import { createClient } from "npm:@supabase/supabase-js@2";

const headers = { "Content-Type": "application/json" };
const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { headers, status });

Deno.serve(async (request) => {
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("authorization");
  if (!authorization) return respond({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
  });
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return respond({ error: "Unauthorized" }, 401);

  const { bookingId } = await request.json().catch(() => ({}));
  if (typeof bookingId !== "string") return respond({ error: "A booking ID is required" }, 400);

  const { data: booking, error: bookingError } = await admin
    .from("booking_requests")
    .select("id, customer_id, creator_display_name, status, payment_status, creator_profiles(owner_id)")
    .eq("id", bookingId)
    .maybeSingle();
  if (bookingError) return respond({ error: bookingError.message }, 500);
  if (!booking) return respond({ error: "Booking not found" }, 404);

  const creator = Array.isArray(booking.creator_profiles)
    ? booking.creator_profiles[0]
    : booking.creator_profiles;
  if (creator?.owner_id !== user.id) return respond({ error: "Only this booking's creator can send the alert" }, 403);
  if (booking.status !== "accepted" || booking.payment_status === "paid") {
    return respond({ sent: 0, skipped: true });
  }

  const { data: devices, error: deviceError } = await admin
    .from("push_notification_devices")
    .select("expo_push_token")
    .eq("user_id", booking.customer_id)
    .eq("enabled", true);
  if (deviceError) return respond({ error: deviceError.message }, 500);

  let sent = 0;
  for (const device of devices ?? []) {
    const { data: existing } = await admin
      .from("booking_acceptance_push_deliveries")
      .select("booking_request_id")
      .eq("expo_push_token", device.expo_push_token)
      .eq("booking_request_id", booking.id)
      .maybeSingle();
    if (existing) continue;

    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify({
        to: device.expo_push_token,
        sound: "default",
        channelId: "booking-reminders",
        title: `${booking.creator_display_name ?? "Your photographer"} accepted your booking`,
        body: "Your session is confirmed. Open WaveLens now to complete payment.",
        data: { url: `/session/${booking.id}`, bookingId: booking.id },
      }),
    });
    const pushResult = await pushResponse.json().catch(() => null);
    const ticket = Array.isArray(pushResult?.data) ? pushResult.data[0] : pushResult?.data;
    if (pushResponse.ok && ticket?.status !== "error") {
      await admin.from("booking_acceptance_push_deliveries").insert({
        expo_push_token: device.expo_push_token,
        booking_request_id: booking.id,
      });
      sent += 1;
    }
  }

  return respond({ sent, registeredDevices: devices?.length ?? 0 });
});


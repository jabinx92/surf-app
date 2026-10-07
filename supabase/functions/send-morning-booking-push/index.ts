import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = { "Content-Type": "application/json" };

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get("BOOKING_PUSH_CRON_SECRET");
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: devices, error: deviceError } = await supabase.from("push_notification_devices").select("user_id, expo_push_token, timezone").eq("enabled", true);
  if (deviceError) return new Response(JSON.stringify({ error: deviceError.message }), { status: 500, headers: jsonHeaders });

  let sent = 0;
  for (const device of devices ?? []) {
    const localParts = new Intl.DateTimeFormat("en-CA", { timeZone: device.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const part = (type: string) => localParts.find((item) => item.type === type)?.value ?? "";
    if (part("hour") !== "07") continue;
    const localDate = `${part("year")}-${part("month")}-${part("day")}`;

    const tomorrowParts = new Intl.DateTimeFormat("en-CA", { timeZone: device.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const tomorrowPart = (type: string) => tomorrowParts.find((item) => item.type === type)?.value ?? "";
    const tomorrowDate = `${tomorrowPart("year")}-${tomorrowPart("month")}-${tomorrowPart("day")}`;

    const { data: bookings } = await supabase.from("booking_requests")
      .select("id, customer_id, creator_display_name, service_type, session_date, session_start_time, surf_spot, creator_profiles(owner_id)")
      .eq("status", "accepted").eq("payment_status", "paid").in("session_date", [localDate, tomorrowDate]);

    for (const booking of bookings ?? []) {
      const creatorProfile = Array.isArray(booking.creator_profiles) ? booking.creator_profiles[0] : booking.creator_profiles;
      const isCustomer = booking.customer_id === device.user_id;
      const isCreator = creatorProfile?.owner_id === device.user_id;
      if (!isCustomer && !isCreator) continue;
      const isDayBefore = booking.session_date === tomorrowDate;
      if (isDayBefore && !isCreator) continue;
      const { data: existing } = await supabase.from("booking_push_deliveries").select("booking_request_id").eq("expo_push_token", device.expo_push_token).eq("booking_request_id", booking.id).eq("reminder_date", localDate).maybeSingle();
      if (existing) continue;

      const time = booking.session_start_time?.slice(0, 5) ?? "today";
      const title = isDayBefore
        ? "WaveLens session tomorrow"
        : isCustomer
          ? `Session with ${booking.creator_display_name ?? "your creator"} today`
          : "You have a WaveLens session today";
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST", headers: jsonHeaders,
        body: JSON.stringify({ to: device.expo_push_token, sound: "default", channelId: "booking-reminders", title, body: `${booking.service_type} at ${time} · ${booking.surf_spot}${isDayBefore ? ". Get ready to fulfill this appointment." : ""}`, data: { url: `/session/${booking.id}`, bookingId: booking.id } }),
      });
      if (response.ok) {
        await supabase.from("booking_push_deliveries").insert({ expo_push_token: device.expo_push_token, booking_request_id: booking.id, reminder_date: localDate });
        sent += 1;
      }
    }
  }
  return new Response(JSON.stringify({ checkedDevices: devices?.length ?? 0, sent }), { headers: jsonHeaders });
});

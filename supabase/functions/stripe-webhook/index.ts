// @ts-nocheck - Supabase Edge Runtime file.
import { createSupabaseContext } from "npm:@supabase/server";
import Stripe from "npm:stripe@^22";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const cryptoProvider = Stripe.createSubtleCryptoProvider();

async function notifyCreatorOfPayment(supabaseAdmin: any, bookingId: string) {
  const { data: booking } = await supabaseAdmin
    .from("booking_requests")
    .select("id, service_type, session_date, surf_spot, creator_profiles(owner_id)")
    .eq("id", bookingId)
    .maybeSingle();
  const creator = Array.isArray(booking?.creator_profiles)
    ? booking.creator_profiles[0]
    : booking?.creator_profiles;
  if (!booking || !creator?.owner_id) return;

  const { data: devices } = await supabaseAdmin
    .from("push_notification_devices")
    .select("expo_push_token")
    .eq("user_id", creator.owner_id)
    .eq("enabled", true);

  for (const device of devices ?? []) {
    const { data: existing } = await supabaseAdmin
      .from("creator_payment_push_deliveries")
      .select("booking_request_id")
      .eq("expo_push_token", device.expo_push_token)
      .eq("booking_request_id", booking.id)
      .maybeSingle();
    if (existing) continue;

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: device.expo_push_token,
        sound: "default",
        channelId: "booking-reminders",
        title: "Your WaveLens booking has been paid",
        body: `${booking.service_type} at ${booking.surf_spot} is confirmed for ${booking.session_date}.`,
        data: { url: `/session/${booking.id}`, bookingId: booking.id },
      }),
    });
    if (response.ok) {
      await supabaseAdmin.from("creator_payment_push_deliveries").insert({
        expo_push_token: device.expo_push_token,
        booking_request_id: booking.id,
      });
    }
  }
}

export default {
  fetch: async (request: Request) => {
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const signature = request.headers.get("stripe-signature") ?? "";
    const body = await request.text();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
        undefined,
        cryptoProvider,
      );
    } catch (error) {
      console.error("Stripe signature verification failed", error);
      return new Response("Bad signature", { status: 400 });
    }

    const { data: context, error: contextError } = await createSupabaseContext(request, { auth: "none" });
    if (contextError || !context) return new Response("Server configuration error", { status: 500 });

    if (["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled"].includes(event.type)) {
      const intent = event.data.object as Stripe.PaymentIntent;
      const bookingId = intent.metadata.booking_request_id;
      if (bookingId) {
        const paid = event.type === "payment_intent.succeeded";
        const status = paid ? "paid" : "failed";
        await context.supabaseAdmin.from("booking_payments").update({
          status,
          failure_message: paid ? null : intent.last_payment_error?.message ?? "Payment was not completed",
          updated_at: new Date().toISOString(),
        }).eq("stripe_payment_intent_id", intent.id);
        await context.supabaseAdmin.from("booking_requests").update({
          payment_status: status,
          paid_at: paid ? new Date().toISOString() : null,
        }).eq("id", bookingId);
        if (paid) await notifyCreatorOfPayment(context.supabaseAdmin, bookingId);
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      if (charge.refunded && typeof charge.payment_intent === "string") {
        const { data: payment } = await context.supabaseAdmin.from("booking_payments")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("stripe_payment_intent_id", charge.payment_intent)
          .select("booking_request_id")
          .maybeSingle();
        if (payment) await context.supabaseAdmin.from("booking_requests").update({ payment_status: "refunded" }).eq("id", payment.booking_request_id);
      }
    }

    return Response.json({ received: true });
  },
};


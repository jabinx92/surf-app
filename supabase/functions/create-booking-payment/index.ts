// @ts-nocheck - Supabase Edge Runtime file.
import { createSupabaseContext } from "npm:@supabase/server";
import Stripe from "npm:stripe@^22";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const stripe = new Stripe(stripeSecretKey);
const platformFeeBps = Number(Deno.env.get("STRIPE_PLATFORM_FEE_BPS") ?? "1000");
const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};
const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { headers: corsHeaders, status });

async function recipientTransfersReady(accountId: string) {
  const response = await fetch(
    `https://api.stripe.com/v2/core/accounts/${accountId}?include[0]=configuration.recipient`,
    { headers: { Authorization: `Bearer ${stripeSecretKey}`, "Stripe-Version": "2026-09-30.preview" } },
  );
  const account = await response.json();
  if (!response.ok) throw new Error(account?.error?.message ?? "Could not load connected account");
  return account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active";
}

export default {
  fetch: async (request: Request) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const { data: context, error: contextError } = await createSupabaseContext(request, { auth: "user" });
    if (contextError || !context) return json({ error: "Unauthorized" }, 401);
    const { data: { user } } = await context.supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { bookingId } = await request.json().catch(() => ({}));
    if (typeof bookingId !== "string") return json({ error: "A booking ID is required" }, 400);

    const { data: booking, error: bookingError } = await context.supabaseAdmin
      .from("booking_requests")
      .select("id, customer_id, creator_profile_id, amount_cents, status, payment_status, booking_payments(stripe_payment_intent_id), creator_profiles(creator_payout_accounts(stripe_account_id))")
      .eq("id", bookingId)
      .maybeSingle();
    if (bookingError) return json({ error: "Could not load booking" }, 500);
    if (!booking || booking.customer_id !== user.id) return json({ error: "Booking not found" }, 404);
    if (booking.status !== "accepted") return json({ error: "The creator must accept this booking before payment" }, 409);
    if (booking.payment_status === "paid") return json({ error: "This booking is already paid" }, 409);

    const creator = Array.isArray(booking.creator_profiles) ? booking.creator_profiles[0] : booking.creator_profiles;
    const payoutAccount = Array.isArray(creator?.creator_payout_accounts) ? creator.creator_payout_accounts[0] : creator?.creator_payout_accounts;
    if (!payoutAccount?.stripe_account_id) return json({ error: "The creator has not set up payouts yet" }, 409);

    try {
      if (!await recipientTransfersReady(payoutAccount.stripe_account_id)) {
        return json({ error: "The creator must finish Stripe verification before accepting payment" }, 409);
      }

      const amountCents = Number(booking.amount_cents);
      if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return json({ error: "This booking does not have a valid price" }, 409);
      const feeCents = Math.round(amountCents * platformFeeBps / 10000);
      const previousPaymentId = booking.booking_payments?.[0]?.stripe_payment_intent_id;
      let intent = previousPaymentId ? await stripe.paymentIntents.retrieve(previousPaymentId) : null;

      if (intent?.status === "succeeded") {
        await context.supabaseAdmin.from("booking_requests").update({ payment_status: "paid", paid_at: new Date().toISOString() }).eq("id", booking.id);
        return json({ error: "This booking is already paid" }, 409);
      }
      if (intent?.status === "canceled") return json({ error: "This payment was cancelled. Contact WaveLens support to start a new payment." }, 409);

      if (!intent) {
        intent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: "usd",
          automatic_payment_methods: { enabled: true },
          application_fee_amount: feeCents,
          transfer_data: { destination: payoutAccount.stripe_account_id },
          metadata: { booking_request_id: booking.id, creator_profile_id: booking.creator_profile_id },
        }, { idempotencyKey: `booking-${booking.id}-payment-v1` });
      }

      await context.supabaseAdmin.from("booking_requests").update({
        amount_cents: amountCents,
        platform_fee_cents: feeCents,
        currency: "usd",
        payment_status: "processing",
      }).eq("id", booking.id);
      await context.supabaseAdmin.from("booking_payments").upsert({
        booking_request_id: booking.id,
        stripe_payment_intent_id: intent.id,
        amount_cents: amountCents,
        platform_fee_cents: feeCents,
        currency: "usd",
        status: "processing",
        failure_message: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "booking_request_id" });

      return json({ clientSecret: intent.client_secret, amountCents, currency: "usd" });
    } catch (error) {
      console.error("Booking payment creation failed", error);
      return json({ error: "Could not prepare payment" }, 500);
    }
  },
};


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Content-Type": "application/json" };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function emailMarkup(creatorName: string, reviewUrl: string) {
  const safeName = escapeHtml(creatorName);
  const safeUrl = escapeHtml(reviewUrl);
  return `<!doctype html><html><body style="margin:0;background:#061827;font-family:Arial,sans-serif;color:#fff">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#061827;padding:36px 16px"><tr><td align="center">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#10293a;border:1px solid #294757;border-radius:22px;overflow:hidden">
  <tr><td style="height:8px;background:#56d6c9"></td></tr><tr><td style="padding:38px">
  <p style="margin:0 0 20px;color:#7ce0d6;font-size:12px;font-weight:700;letter-spacing:1.5px">WAVELENS</p>
  <h1 style="margin:0 0 14px;font-size:30px;line-height:1.2">How was your session with ${safeName}?</h1>
  <p style="margin:0 0 28px;color:#c6d4dd;font-size:17px;line-height:1.6">Your photos are in. A quick review helps your creator grow and helps other surfers book with confidence.</p>
  <a href="${safeUrl}" style="display:inline-block;background:#56d6c9;color:#061827;text-decoration:none;font-weight:800;padding:15px 22px;border-radius:12px">Leave a review</a>
  <p style="margin:28px 0 0;color:#78909f;font-size:13px;line-height:1.5">It only takes a minute. You will not receive another reminder for this booking.</p>
  </td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get("REVIEW_REMINDER_CRON_SECRET");
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("REVIEW_REMINDER_FROM_EMAIL");
  const publicAppUrl = Deno.env.get("PUBLIC_APP_URL") ?? "https://wavelens.expo.app";
  const supabase = createClient(supabaseUrl, serviceKey);
  const dueBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings, error } = await supabase
    .from("booking_requests")
    .select("id, customer_id, creator_profile_id, creator_display_name")
    .eq("status", "completed")
    .lte("completed_at", dueBefore)
    .limit(50);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });

  let notificationsSent = 0;
  let emailsSent = 0;
  for (const booking of bookings ?? []) {
    const { data: review } = await supabase.from("creator_reviews").select("id").eq("booking_request_id", booking.id).maybeSingle();
    if (review) continue;

    const { data: delivery } = await supabase.from("review_reminder_deliveries").select("in_app_sent_at, email_sent_at").eq("booking_request_id", booking.id).maybeSingle();
    const creatorName = booking.creator_display_name ?? "your creator";

    if (!delivery?.in_app_sent_at) {
      const { error: notificationError } = await supabase.from("user_notifications").insert({
        user_id: booking.customer_id,
        title: `How was your session with ${creatorName}?`,
        body: "Your photos are in. Leave a quick review to help other surfers book with confidence.",
        kind: "system",
        booking_request_id: booking.id,
      });
      if (!notificationError) {
        await supabase.from("review_reminder_deliveries").upsert({ booking_request_id: booking.id, in_app_sent_at: new Date().toISOString() });
        notificationsSent += 1;
      }
    }

    if (!delivery?.email_sent_at && resendKey && fromEmail) {
      const { data: authData } = await supabase.auth.admin.getUserById(booking.customer_id);
      const recipient = authData.user?.email;
      if (!recipient) continue;
      const reviewUrl = `${publicAppUrl}/review/${booking.id}?creatorId=${booking.creator_profile_id}`;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: [recipient], subject: `How was your session with ${creatorName}?`, html: emailMarkup(creatorName, reviewUrl) }),
      });
      if (response.ok) {
        await supabase.from("review_reminder_deliveries").upsert({ booking_request_id: booking.id, email_sent_at: new Date().toISOString() });
        emailsSent += 1;
      }
    }
  }

  return new Response(JSON.stringify({ checked: bookings?.length ?? 0, notificationsSent, emailsSent, emailConfigured: Boolean(resendKey && fromEmail) }), { headers });
});

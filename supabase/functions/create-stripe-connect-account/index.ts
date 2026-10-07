// @ts-nocheck - Supabase Edge Runtime file.
import { createSupabaseContext } from "npm:@supabase/server";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const stripeVersion = "2026-09-30.preview";
const siteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://wavelens.expo.app";
const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};
const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { headers: corsHeaders, status });

async function stripeV2(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/json",
      "Stripe-Version": stripeVersion,
      ...init.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message ?? "Stripe request failed");
  return body;
}

function transfersReady(account: any) {
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

    const { data: profile, error: profileError } = await context.supabaseAdmin
      .from("creator_profiles")
      .select("id, display_name, creator_payout_accounts(stripe_account_id)")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (profileError) return json({ error: "Could not load creator profile" }, 500);
    if (!profile) return json({ error: "An approved creator profile is required" }, 403);

    try {
      const payoutAccount = Array.isArray(profile.creator_payout_accounts) ? profile.creator_payout_accounts[0] : profile.creator_payout_accounts;
      let accountId = payoutAccount?.stripe_account_id;
      if (!accountId) {
        const account = await stripeV2("/v2/core/accounts", {
          method: "POST",
          body: JSON.stringify({
            contact_email: user.email,
            display_name: profile.display_name,
            dashboard: "express",
            identity: { country: "us" },
            defaults: {
              responsibilities: {
                fees_collector: "application",
                losses_collector: "application",
              },
            },
            configuration: {
              recipient: {
                capabilities: {
                  stripe_balance: { stripe_transfers: { requested: true } },
                },
              },
            },
            include: ["configuration.recipient", "identity", "requirements"],
          }),
        });
        accountId = account.id;
      }

      const account = await stripeV2(`/v2/core/accounts/${accountId}?include[0]=configuration.recipient&include[1]=requirements`);
      const ready = transfersReady(account);
      await context.supabaseAdmin.from("creator_payout_accounts").upsert({
        creator_profile_id: profile.id,
        stripe_account_id: accountId,
        charges_enabled: ready,
        payouts_enabled: ready,
        details_submitted: ready,
        updated_at: new Date().toISOString(),
      }, { onConflict: "creator_profile_id" });

      if (ready) {
        return json({ ready: true });
      }

      const link = await stripeV2("/v2/core/account_links", {
        method: "POST",
        body: JSON.stringify({
          account: accountId,
          use_case: {
            type: "account_onboarding",
            account_onboarding: {
              refresh_url: `${siteUrl}/account?stripe=refresh`,
              return_url: `${siteUrl}/account?stripe=return`,
            },
          },
        }),
      });
      return json({ ready: false, url: link.url });
    } catch (error) {
      console.error("Stripe Connect onboarding failed", error);
      return json({ error: "Could not start Stripe payout setup" }, 500);
    }
  },
};


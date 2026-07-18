// @ts-nocheck - this runs in Supabase's Deno Edge Runtime, not the Expo TypeScript runtime.
import { createSupabaseContext } from "npm:@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { headers: corsHeaders, status });
}

export default {
  fetch: async (request: Request) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const { data: context, error: contextError } = await createSupabaseContext(request, { auth: "user" });
    if (contextError || !context) return json({ error: "Unauthorized" }, contextError?.status ?? 401);

    const { data: { user }, error: userError } = await context.supabase.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: creatorProfile, error: profileError } = await context.supabaseAdmin
      .from("creator_profiles")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (profileError) return json({ error: "Could not prepare account deletion" }, 500);

    if (creatorProfile) {
      const { error: requestsError } = await context.supabaseAdmin
        .from("booking_requests")
        .delete()
        .eq("creator_profile_id", creatorProfile.id);
      if (requestsError) return json({ error: "Could not remove creator booking data" }, 500);
    }

    const { error: deleteError } = await context.supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) return json({ error: "Could not delete account" }, 500);

    return json({ deleted: true });
  },
};

// @ts-nocheck - Supabase Edge Runtime file.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};
const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { headers: corsHeaders, status });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const input = await request.json().catch(() => ({}));
  const action = input.action;
  let endpoint = "";
  let cacheKey = "";

  if (action === "search") {
    const query = typeof input.query === "string" ? input.query.trim().slice(0, 80) : "";
    if (query.length < 2) return respond({ spots: [], source: "surfmap" });
    endpoint = `/v1/spots?q=${encodeURIComponent(query)}&limit=10`;
    cacheKey = `search:${query.toLocaleLowerCase()}`;
  } else if (action === "nearby") {
    const lat = Number(input.latitude);
    const lng = Number(input.longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return respond({ error: "Valid coordinates are required" }, 400);
    }
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    endpoint = `/v1/spots/nearby?lat=${roundedLat}&lng=${roundedLng}&radius=100&limit=20`;
    cacheKey = `nearby:${roundedLat}:${roundedLng}`;
  } else {
    return respond({ error: "Unknown action" }, 400);
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: cached } = await admin.from("surf_map_cache")
    .select("payload")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (cached?.payload) return respond({ spots: cached.payload, source: "surfmap", cached: true });

  const apiKey = Deno.env.get("SURFMAP_API_KEY");
  if (!apiKey) return respond({ error: "SurfMap is not configured" }, 503);

  const response = await fetch(`https://api.surf-map.com${endpoint}`, {
    headers: { "X-API-Key": apiKey },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(result)) {
    return respond({ error: result?.error?.message ?? "SurfMap is temporarily unavailable" }, response.status || 502);
  }

  await admin.from("surf_map_cache").upsert({
    cache_key: cacheKey,
    payload: result,
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  });
  return respond({ spots: result, source: "surfmap", cached: false });
});

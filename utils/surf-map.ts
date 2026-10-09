import { supabase } from "@/lib/supabase";

export type SurfMapSpot = {
  id: string;
  name: string;
  aka?: string;
  country: string;
  region: string | null;
  lat: number;
  lng: number;
  distanceKm?: number;
};

async function invokeSurfMap(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("surf-map-spots", { body });
  if (error || !Array.isArray(data?.spots)) throw new Error(data?.error ?? error?.message ?? "Surf spots are unavailable");
  return data as { spots: SurfMapSpot[]; source: "surfmap"; cached?: boolean };
}

export const searchSurfMapSpots = (query: string) => invokeSurfMap({ action: "search", query });
export const findNearbySurfMapSpots = (latitude: number, longitude: number) =>
  invokeSurfMap({ action: "nearby", latitude, longitude });

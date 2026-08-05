import { createClient, processLock } from "@supabase/supabase-js";
import NodeWebSocket from "ws";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
  realtime:
    typeof globalThis.WebSocket === "undefined"
      ? { transport: NodeWebSocket as unknown as typeof globalThis.WebSocket }
      : undefined,
});

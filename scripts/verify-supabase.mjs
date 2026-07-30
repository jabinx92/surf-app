import { readFile } from "node:fs/promises";

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

const localEnv = parseEnv(await readFile(new URL("../.env.local", import.meta.url), "utf8"));
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? localEnv.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? localEnv.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY");
}

const apiHeaders = {
  apikey: publishableKey,
  Authorization: `Bearer ${publishableKey}`,
};

async function request(path, options = {}) {
  return fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: { ...apiHeaders, ...options.headers },
  });
}

async function expectStatus(name, response, expectedStatuses) {
  if (!expectedStatuses.includes(response.status)) {
    const body = await response.text();
    throw new Error(`${name}: expected HTTP ${expectedStatuses.join(" or ")}, received ${response.status}: ${body}`);
  }

  console.log(`PASS ${name} (${response.status})`);
}

await expectStatus(
  "public creator directory is reachable",
  await request("/rest/v1/creator_profiles?select=id&limit=1"),
  [200],
);

for (const table of ["booking_requests", "creator_applications", "user_notifications"]) {
  const response = await request(`/rest/v1/${table}?select=*&limit=1`);
  await expectStatus(`${table} rejects or hides anonymous reads`, response, [200, 401, 403]);

  if (response.status === 200) {
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length !== 0) {
      throw new Error(`${table}: anonymous access returned private rows`);
    }
  }
}

await expectStatus(
  "anonymous booking creation is blocked",
  await request("/rest/v1/booking_requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({}),
  }),
  [400, 401, 403],
);

await expectStatus(
  "account deletion requires a signed-in user",
  await request("/functions/v1/delete-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }),
  [401],
);

console.log("Supabase Phase 3 checks passed.");

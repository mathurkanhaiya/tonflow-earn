import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/** Service-role client. Server-only: every TonFlow table is locked down and
 * reachable exclusively through validated server functions / server routes. */
export function db(): SupabaseClient {
  if (!cached) {
    const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) throw new Error("Supabase server environment is not configured");
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export const ADMIN_TELEGRAM_ID = 2139807311;
export const BOT_USERNAME = "TonFlowPayBot";
export const MINI_APP_URL = "https://t.me/TonFlowPayBot/app";
export const PAYOUT_CHANNEL = "@TonFlowPayouts";

export function refLink(telegramId: number | string) {
  return `${MINI_APP_URL}?startapp=${telegramId}`;
}

export function ton(value: unknown, digits = 4): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(digits).replace(/\.?0+$/, "") || "0";
}

export function explorerUrl(hash: string) {
  return `https://tonviewer.com/transaction/${hash}`;
}

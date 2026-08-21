import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

const WIENER_SUPABASE_URL = "https://hvyrairuogiljplmsuat.supabase.co";

function tonflowTable(name: string): string {
  return name.startsWith("tonflow_") ? name : `tonflow_${name}`;
}

function isolateTonFlowClient(client: SupabaseClient): SupabaseClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (name: string) => target.from(tonflowTable(name));
      }
      if (prop === "rpc") {
        return (fn: string, args?: Record<string, unknown>, options?: Record<string, unknown>) =>
          target.rpc(fn === "credit_user" ? "tonflow_credit_user" : fn, args, options as never);
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as SupabaseClient;
}

/** Service-role client. Server-only. TonFlow runs on the shared WIENER FARM
 * Supabase project, with every table/RPC call namespaced to tonflow_* resources. */
export function db(): SupabaseClient {
  if (!cached) {
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    const raw = createClient(WIENER_SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    cached = isolateTonFlowClient(raw);
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

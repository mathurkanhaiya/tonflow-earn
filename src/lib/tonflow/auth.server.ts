import { ADMIN_TELEGRAM_ID, db } from "./db.server";
import { isLangCode } from "./i18n";

export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

export type TonFlowUser = {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  language: string;
  balance: number;
  total_earned: number;
  referral_earned: number;
  ads_watched: number;
  tasks_completed: number;
  spin_tickets: number;
  referred_by: number | null;
  referral_verified: boolean;
  is_banned: boolean;
  notifications_enabled: boolean;
  last_daily_reward_at: string | null;
  last_free_spin_at: string | null;
  language_chosen: boolean;
  created_at: string;
};

const encoder = new TextEncoder();

async function hmac(keyData: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyData as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(message));
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(input)));
}

/** Validates Telegram Mini App initData (HMAC-SHA256 per Telegram spec). */
export async function verifyInitData(initData: string): Promise<TgUser | null> {
  const botToken = process.env["TELEGRAM_BOT_TOKEN"];
  if (!botToken || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  params.delete("signature");

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const secret = await hmac(encoder.encode("WebAppData"), botToken);
  const computed = toHex(await hmac(secret, dataCheckString));
  if (computed !== hash) return null;

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > 60 * 60 * 24) return null;

  const rawUser = params.get("user");
  if (!rawUser) return null;
  try {
    const user = JSON.parse(rawUser) as TgUser;
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

const DEV_USER: TgUser = {
  id: 999000001,
  first_name: "Preview",
  last_name: "User",
  username: "preview_user",
  language_code: "en",
};

function devFallbackAllowed() {
  return process.env["NODE_ENV"] !== "production";
}

export type AuthPayload = {
  initData?: string | undefined;
  startParam?: string | null | undefined;
  deviceHash?: string | null | undefined;
  devTelegramId?: number | null | undefined;
};

/** Resolves (and provisions) the TonFlow account for the caller. */
export async function requireUser(payload: AuthPayload): Promise<TonFlowUser> {
  let tg = await verifyInitData(payload.initData ?? "");
  if (!tg) {
    if (!devFallbackAllowed()) throw new Error("UNAUTHORIZED");
    tg = payload.devTelegramId
      ? { ...DEV_USER, id: payload.devTelegramId, username: `preview_${payload.devTelegramId}` }
      : DEV_USER;
  }

  const client = db();
  const { data: existing } = await client
    .from("tonflow_users")
    .select("*")
    .eq("telegram_id", tg.id)
    .maybeSingle();

  if (existing) {
    const user = existing as unknown as TonFlowUser;
    if (user.is_banned) throw new Error("BANNED");
    const patch: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
    if (tg.username && tg.username !== user.username) patch["username"] = tg.username;
    if (tg.photo_url && tg.photo_url !== user.photo_url) patch["photo_url"] = tg.photo_url;
    if (payload.deviceHash && !user["referred_by"] && !("device_hash" in patch))
      patch["device_hash"] = await sha256Hex(payload.deviceHash);
    await client.from("tonflow_users").update(patch).eq("id", user.id);
    return { ...user, ...(patch as Partial<TonFlowUser>) };
  }

  return createUser(tg, payload);
}

async function createUser(tg: TgUser, payload: AuthPayload): Promise<TonFlowUser> {
  const client = db();
  const deviceHash = payload.deviceHash ? await sha256Hex(payload.deviceHash) : null;

  const { data: inserted, error } = await client
    .from("tonflow_users")
    .insert({
      telegram_id: tg.id,
      username: tg.username ?? null,
      first_name: tg.first_name ?? null,
      last_name: tg.last_name ?? null,
      photo_url: tg.photo_url ?? null,
      language: isLangCode(tg.language_code) ? tg.language_code : "en",
      device_hash: deviceHash,
    })
    .select("*")
    .single();

  if (error || !inserted) {
    const { data: retry } = await client
      .from("tonflow_users")
      .select("*")
      .eq("telegram_id", tg.id)
      .maybeSingle();
    if (retry) return retry as unknown as TonFlowUser;
    throw new Error(error?.message ?? "USER_CREATE_FAILED");
  }

  const user = inserted as unknown as TonFlowUser;
  const { attachReferral, notifyAdminNewUser } = await import("./referral.server");
  await attachReferral(user, payload.startParam ?? null, deviceHash);
  await notifyAdminNewUser(user);
  const { data: fresh } = await client
    .from("tonflow_users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (fresh as unknown as TonFlowUser) ?? user;
}

export function isAdmin(telegramId: number | undefined | null) {
  return Number(telegramId) === ADMIN_TELEGRAM_ID;
}

export async function requireAdmin(payload: AuthPayload): Promise<TonFlowUser> {
  const user = await requireUser(payload);
  if (!isAdmin(user.telegram_id)) throw new Error("FORBIDDEN");
  return user;
}

export async function logAdmin(
  adminTelegramId: number,
  action: string,
  targetUserId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  await db().from("admin_logs").insert({
    admin_telegram_id: adminTelegramId,
    action,
    target_user_id: targetUserId ?? null,
    metadata,
  });
}

import { MINI_APP_URL } from "./db.server";

const API = "https://api.telegram.org";

function token(): string {
  const t = process.env["TELEGRAM_BOT_TOKEN"];
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return t;
}

export type InlineButton = { text: string; url?: string; callback_data?: string };

export async function callTelegram<T = unknown>(
  method: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; result?: T; description?: string }> {
  const res = await fetch(`${API}/bot${token()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({ ok: false, description: "invalid json" }))) as {
    ok: boolean;
    result?: T;
    description?: string;
  };
  if (!json.ok) console.error(`Telegram ${method} failed [${res.status}]: ${json.description}`);
  return json;
}

export async function sendMessage(
  chatId: number | string,
  text: string,
  buttons?: InlineButton[][],
  photoUrl?: string,
) {
  const base: Record<string, unknown> = {
    chat_id: chatId,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (buttons?.length) base["reply_markup"] = { inline_keyboard: buttons };
  if (photoUrl) return callTelegram("sendPhoto", { ...base, photo: photoUrl, caption: text });
  return callTelegram("sendMessage", { ...base, text });
}

export function earnButton(label = "💎 Earn TON"): InlineButton[][] {
  return [[{ text: label, url: MINI_APP_URL }]];
}

/** Membership check for channel/group tasks. Never trust the client. */
export async function isChatMember(chat: string, userId: number): Promise<boolean | null> {
  const res = await callTelegram<{ status: string }>("getChatMember", {
    chat_id: chat.startsWith("@") || chat.startsWith("-") ? chat : `@${chat}`,
    user_id: userId,
  });
  if (!res.ok || !res.result) return null;
  return ["creator", "administrator", "member", "restricted"].includes(res.result.status);
}

export async function getUserPhoto(userId: number): Promise<string | null> {
  const photos = await callTelegram<{ total_count: number; photos: { file_id: string }[][] }>(
    "getUserProfilePhotos",
    { user_id: userId, limit: 1 },
  );
  const fileId = photos.result?.photos?.[0]?.[0]?.file_id;
  if (!fileId) return null;
  const file = await callTelegram<{ file_path: string }>("getFile", { file_id: fileId });
  if (!file.result?.file_path) return null;
  return `${API}/file/bot${token()}/${file.result.file_path}`;
}

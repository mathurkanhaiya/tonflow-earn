import { db, ton } from "./db.server";
import { createTranslator, type TKey, type Translator } from "./i18n";
import { sendMessage, earnButton, type InlineButton } from "./telegram.server";

const overrideCache = new Map<string, { at: number; map: Record<string, string> }>();

async function overridesFor(lang: string): Promise<Record<string, string>> {
  const cached = overrideCache.get(lang);
  if (cached && Date.now() - cached.at < 60_000) return cached.map;
  const { data } = await db().from("translations").select("key, value").eq("lang", lang);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key as string] = row.value as string;
  overrideCache.set(lang, { at: Date.now(), map });
  return map;
}

export async function translatorFor(lang: string): Promise<Translator> {
  return createTranslator(lang, await overridesFor(lang));
}

/** Sends a localized notification, honouring the user's notification preference. */
export async function notifyUser(
  user: { id: string; telegram_id: number; language: string; notifications_enabled?: boolean },
  type: string,
  build: (t: Translator) => { text: string; buttons?: InlineButton[][] },
  opts: { force?: boolean; minHoursBetween?: number } = {},
) {
  if (!opts.force && user.notifications_enabled === false) return;

  if (opts.minHoursBetween) {
    const since = new Date(Date.now() - opts.minHoursBetween * 3600_000).toISOString();
    const { count } = await db()
      .from("notification_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", type)
      .gte("created_at", since);
    if ((count ?? 0) > 0) return;
  }

  const t = await translatorFor(user.language);
  const { text, buttons } = build(t);
  const res = await sendMessage(user.telegram_id, text, buttons ?? earnButton(t("bot.btn.earn")));
  await db().from("notification_log").insert({ user_id: user.id, type, metadata: { ok: res.ok } });
}

export function line(label: string, value: string) {
  return `${label}: <b>${value}</b>`;
}

export const tonLine = (t: Translator, key: TKey, amount: unknown) =>
  line(t(key), `${ton(amount)} TON`);

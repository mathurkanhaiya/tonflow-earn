import { ADMIN_TELEGRAM_ID, db, ton } from "./db.server";
import type { TonFlowUser } from "./auth.server";
import { getSetting } from "./settings.server";
import { notifyUser } from "./notify.server";
import { earnButton, sendMessage } from "./telegram.server";

/** Server-assigned referral relationship with anti-fraud checks. */
export async function attachReferral(
  user: TonFlowUser,
  startParam: string | null,
  deviceHash: string | null,
) {
  const raw = (startParam ?? "").replace(/[^0-9]/g, "");
  const referrerTelegramId = Number(raw);
  if (!referrerTelegramId) return;
  if (referrerTelegramId === user.telegram_id) return; // self-referral

  const client = db();
  const settings = await getSetting("referral");

  const { data: referrer } = await client
    .from("tonflow_users")
    .select("id, telegram_id, language, is_banned, device_hash, notifications_enabled")
    .eq("telegram_id", referrerTelegramId)
    .maybeSingle();
  if (!referrer || referrer.is_banned) return;

  let fraud: string | null = null;
  if (settings.block_same_device && deviceHash) {
    if (referrer.device_hash && referrer.device_hash === deviceHash) fraud = "same_device";
    else {
      const { count } = await client
        .from("tonflow_users")
        .select("id", { count: "exact", head: true })
        .eq("device_hash", deviceHash);
      if ((count ?? 0) > 1) fraud = "duplicate_device";
    }
  }

  await client.from("tonflow_users").update({ referred_by: referrerTelegramId }).eq("id", user.id);
  await client
    .from("referrals")
    .insert({ referrer_id: referrer.id, referred_id: user.id, fraud_flag: fraud });

  if (fraud) return;

  await notifyUser(
    referrer as never,
    "referral_new",
    (t) => ({
      text: `<b>${t("bot.ref.new.title")}</b>\n\n${t("bot.ref.new.body", {
        user: user.username ? `@${user.username}` : (user.first_name ?? "A new user"),
        tasks: settings.required_tasks,
        ads: settings.required_ads,
      })}`,
    }),
    {},
  );
}

/** Called after any task/ad completion — promotes the referral when qualified. */
export async function maybeVerifyReferral(user: TonFlowUser) {
  if (user.referral_verified || !user.referred_by) return;
  const settings = await getSetting("referral");
  const client = db();

  const { data: fresh } = await client
    .from("tonflow_users")
    .select("tasks_completed, ads_watched, username, first_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!fresh) return;
  if (
    (fresh.tasks_completed ?? 0) < settings.required_tasks ||
    (fresh.ads_watched ?? 0) < settings.required_ads
  )
    return;

  const { data: rel } = await client
    .from("referrals")
    .select("id, referrer_id, verified, fraud_flag")
    .eq("referred_id", user.id)
    .maybeSingle();
  if (!rel || rel.verified || rel.fraud_flag) return;

  const { data: referrer } = await client
    .from("tonflow_users")
    .select("id, telegram_id, language, is_banned, notifications_enabled")
    .eq("id", rel.referrer_id)
    .maybeSingle();
  if (!referrer || referrer.is_banned) return;

  await client
    .from("referrals")
    .update({ verified: true, verified_at: new Date().toISOString(), reward_paid: settings.reward })
    .eq("id", rel.id)
    .eq("verified", false);
  await client.from("tonflow_users").update({ referral_verified: true }).eq("id", user.id);

  await client.rpc("credit_user", {
    _user_id: referrer.id,
    _amount: settings.reward,
    _type: "referral_reward",
    _description: "Verified referral",
    _metadata: { referred_id: user.id },
  });
  await client
    .from("tonflow_users")
    .update({ referral_earned: await sumReferralEarned(referrer.id) })
    .eq("id", referrer.id);

  await notifyUser(referrer as never, "referral_verified", (t) => ({
    text: `<b>${t("bot.ref.verified.title")}</b>\n\n${t("bot.ref.verified.body", {
      amount: ton(settings.reward),
    })}`,
  }));
}

async function sumReferralEarned(userId: string): Promise<number> {
  const { data } = await db()
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .in("type", ["referral_reward", "referral_commission"]);
  return (data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
}

/** 20% lifetime commission on a referred user's earning. */
export async function payCommission(user: TonFlowUser, amount: number, source: string) {
  if (!user.referred_by || amount <= 0) return;
  const settings = await getSetting("referral");
  const client = db();

  const { data: rel } = await client
    .from("referrals")
    .select("id, referrer_id, verified, fraud_flag, commission_earned")
    .eq("referred_id", user.id)
    .maybeSingle();
  if (!rel || !rel.verified || rel.fraud_flag) return;

  const commission = Number((amount * (settings.commission_percent / 100)).toFixed(9));
  if (commission <= 0) return;

  const { data: referrer } = await client
    .from("tonflow_users")
    .select("id, is_banned")
    .eq("id", rel.referrer_id)
    .maybeSingle();
  if (!referrer || referrer.is_banned) return;

  await client.rpc("credit_user", {
    _user_id: rel.referrer_id,
    _amount: commission,
    _type: "referral_commission",
    _description: `Commission from ${source}`,
    _metadata: { from_user: user.id, source },
  });
  await client
    .from("referrals")
    .update({ commission_earned: Number(rel.commission_earned) + commission })
    .eq("id", rel.id);
  await client
    .from("tonflow_users")
    .update({ referral_earned: await sumReferralEarned(rel.referrer_id) })
    .eq("id", rel.referrer_id);
}

export async function notifyAdminNewUser(user: TonFlowUser) {
  let invitedBy = "None";
  if (user.referred_by) {
    const { data } = await db()
      .from("tonflow_users")
      .select("username, telegram_id")
      .eq("telegram_id", user.referred_by)
      .maybeSingle();
    invitedBy = data?.username ? `@${data.username}` : String(user.referred_by);
  }
  const text = [
    "<b>👤 New User</b>",
    "",
    `Username: ${user.username ? `@${user.username}` : "—"}`,
    `Name: ${[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}`,
    `UID: <code>${user.telegram_id}</code>`,
    `Invited By: ${invitedBy}`,
    `Join Time: ${new Date(user.created_at).toUTCString()}`,
    `Balance: ${ton(user.balance)} TON`,
    "",
    `Referral: ${user.referred_by ? "pending verification" : "organic"}`,
  ].join("\n");
  await sendMessage(ADMIN_TELEGRAM_ID, text, earnButton());
}

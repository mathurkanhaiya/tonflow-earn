import type { TonFlowUser } from "./auth.server";
import { db, ton, PAYOUT_CHANNEL } from "./db.server";
import {
  afterProgress,
  addTickets,
  credit,
  randomInRange,
  reloadUser,
  startOfUtcDay,
} from "./earn.server";
import { computeFee, getSetting } from "./settings.server";
import { notifyUser } from "./notify.server";
import { isChatMember } from "./telegram.server";
import { buildAppState, type AppState } from "./state.server";

export class ActionError extends Error {}

async function finish(userId: string): Promise<AppState> {
  return buildAppState(await reloadUser(userId));
}

/* ------------------------------- ads ------------------------------- */

export async function watchAd(user: TonFlowUser, network: string, nonce: string) {
  const client = db();
  const { data: net } = await client
    .from("ad_networks")
    .select("*")
    .eq("network", network)
    .maybeSingle();
  if (!net || !net.enabled) throw new ActionError("ADS_DISABLED");

  const dayStart = startOfUtcDay();
  const { data: today } = await client
    .from("ad_views")
    .select("id, network, ticket_awarded, created_at")
    .eq("user_id", user.id)
    .gte("created_at", dayStart);
  const rows = today ?? [];

  const watchedThisNetwork = rows.filter((r) => r.network === network).length;
  if (watchedThisNetwork >= Number(net.daily_limit)) throw new ActionError("LIMIT_REACHED");

  const last = rows
    .filter((r) => r.network === network)
    .map((r) => new Date(r.created_at as string).getTime())
    .sort((a, b) => b - a)[0];
  if (last && Date.now() - last < Number(net.cooldown_seconds) * 1000)
    throw new ActionError("COOLDOWN");

  const adsSettings = await getSetting("ads");
  const ticketsToday = rows.filter((r) => r.ticket_awarded).length;
  const ticket =
    ticketsToday < adsSettings.ticket_daily_limit && Math.random() < adsSettings.ticket_chance;

  const reward = randomInRange(Number(net.reward_min), Number(net.reward_max));

  const { error } = await client.from("ad_views").insert({
    user_id: user.id,
    network,
    reward,
    ticket_awarded: ticket,
    nonce,
  });
  if (error) throw new ActionError("DUPLICATE");

  await credit(user, reward, "ad_reward", `Ad reward (${net.title})`, { network }, { commission: true });
  await client
    .from("tonflow_users")
    .update({ ads_watched: user.ads_watched + 1 })
    .eq("id", user.id);
  if (ticket) await addTickets(user.id, 1);
  await afterProgress(user);

  return { reward, ticket, state: await finish(user.id) };
}

/* --------------------------- daily reward --------------------------- */

export async function claimDailyReward(user: TonFlowUser) {
  const settings = await getSetting("daily_reward");
  if (!settings.enabled) throw new ActionError("DISABLED");
  const today = new Date().toISOString().slice(0, 10);
  if (user.last_daily_reward_at && user.last_daily_reward_at.slice(0, 10) === today)
    throw new ActionError("ALREADY_CLAIMED");

  const { data: updated } = await db()
    .from("tonflow_users")
    .update({ last_daily_reward_at: new Date().toISOString() })
    .eq("id", user.id)
    .or(`last_daily_reward_at.is.null,last_daily_reward_at.lt.${today}T00:00:00Z`)
    .select("id");
  if (!updated?.length) throw new ActionError("ALREADY_CLAIMED");

  await credit(user, settings.amount, "daily_reward", "Daily reward", {}, { commission: true });
  return { reward: settings.amount, state: await finish(user.id) };
}

/* ------------------------------ spinner ----------------------------- */

export type SpinType = "free" | "ticket" | "paid";

export async function spin(user: TonFlowUser, type: SpinType) {
  const settings = await getSetting("spinner");
  const client = db();
  const today = new Date().toISOString().slice(0, 10);

  if (type === "free") {
    if (!settings.free_spin_enabled) throw new ActionError("DISABLED");
    const { data: ok } = await client
      .from("tonflow_users")
      .update({ last_free_spin_at: new Date().toISOString() })
      .eq("id", user.id)
      .or(`last_free_spin_at.is.null,last_free_spin_at.lt.${today}T00:00:00Z`)
      .select("id");
    if (!ok?.length) throw new ActionError("FREE_SPIN_USED");
  } else if (type === "ticket") {
    const { data: ok } = await client
      .from("tonflow_users")
      .update({ spin_tickets: user.spin_tickets - 1 })
      .eq("id", user.id)
      .gt("spin_tickets", 0)
      .select("id");
    if (!ok?.length) throw new ActionError("NO_TICKETS");
  } else {
    if (Number(user.balance) < settings.paid_spin_cost) throw new ActionError("INSUFFICIENT");
    await credit(user, -settings.paid_spin_cost, "spin_cost", "Paid spin");
  }

  const rewards = settings.rewards.length ? settings.rewards : [{ amount: 0, weight: 1 }];
  const total = rewards.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  let index = 0;
  for (let i = 0; i < rewards.length; i++) {
    roll -= rewards[i]!.weight;
    if (roll <= 0) {
      index = i;
      break;
    }
  }
  const won = rewards[index]!;
  const jackpot = won.amount >= Math.max(...rewards.map((r) => r.amount)) && won.amount > 0;

  await client.from("spins").insert({
    user_id: user.id,
    spin_type: type,
    reward: won.amount,
    is_jackpot: jackpot,
    segment_index: index,
  });
  if (won.amount > 0)
    await credit(user, won.amount, "spin_reward", "Spin reward", { type }, { commission: true });

  return {
    reward: won.amount,
    jackpot,
    segmentIndex: index,
    state: await finish(user.id),
  };
}

/* ---------------------------- promo codes --------------------------- */

export async function claimPromo(user: TonFlowUser, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new ActionError("PROMO_INVALID");
  const client = db();
  const { data: promo } = await client
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (!promo || !promo.enabled) throw new ActionError("PROMO_INVALID");
  if (promo.expires_at && new Date(promo.expires_at as string) < new Date())
    throw new ActionError("PROMO_INVALID");
  if (Number(promo.used_count) >= Number(promo.usage_limit)) throw new ActionError("PROMO_LIMIT");

  const { count } = await client
    .from("promo_claims")
    .select("id", { count: "exact", head: true })
    .eq("promo_code_id", promo.id)
    .eq("user_id", user.id);
  if ((count ?? 0) >= Number(promo.per_user_limit)) throw new ActionError("PROMO_USED");

  const { error } = await client
    .from("promo_claims")
    .insert({ promo_code_id: promo.id, user_id: user.id, reward: promo.reward });
  if (error) throw new ActionError("PROMO_USED");

  await client
    .from("promo_codes")
    .update({ used_count: Number(promo.used_count) + 1 })
    .eq("id", promo.id);
  await credit(
    user,
    Number(promo.reward),
    "promo_reward",
    `Promo code ${code}`,
    { code },
    { commission: true },
  );

  return { reward: Number(promo.reward), state: await finish(user.id) };
}

/* ------------------------------- tasks ------------------------------ */

export async function verifyTask(user: TonFlowUser, taskId: string) {
  const client = db();
  const { data: task } = await client.from("tasks").select("*").eq("id", taskId).maybeSingle();
  if (!task || !task.enabled || task.status !== "active") throw new ActionError("TASK_UNAVAILABLE");
  if (Number(task.participants) >= Number(task.max_participants))
    throw new ActionError("TASK_FULL");

  const { data: existing } = await client
    .from("task_completions")
    .select("id")
    .eq("user_id", user.id)
    .eq("task_id", taskId)
    .maybeSingle();
  if (existing) throw new ActionError("TASK_DONE");

  if (task.task_type === "telegram_channel" || task.task_type === "telegram_group") {
    if (!task.target_chat) throw new ActionError("TASK_UNAVAILABLE");
    const member = await isChatMember(task.target_chat as string, user.telegram_id);
    if (member !== true) throw new ActionError("NOT_MEMBER");
  }

  const penaltyCheckAt = task.penalty_enabled
    ? new Date(Date.now() + Number(task.penalty_hours) * 3600_000).toISOString()
    : null;

  const { error } = await client.from("task_completions").insert({
    user_id: user.id,
    task_id: taskId,
    reward: task.reward,
    penalty_check_at: penaltyCheckAt,
  });
  if (error) throw new ActionError("TASK_DONE");

  await client
    .from("tasks")
    .update({
      participants: Number(task.participants) + 1,
      spent: Number(task.spent) + Number(task.reward),
      status:
        Number(task.participants) + 1 >= Number(task.max_participants) ? "completed" : "active",
    })
    .eq("id", taskId);
  await client
    .from("tonflow_users")
    .update({ tasks_completed: user.tasks_completed + 1 })
    .eq("id", user.id);
  await credit(
    user,
    Number(task.reward),
    "task_reward",
    `Task: ${task.title}`,
    { task_id: taskId },
    { commission: true },
  );
  await afterProgress(user);

  return { reward: Number(task.reward), state: await finish(user.id) };
}

export async function publishTask(
  user: TonFlowUser,
  input: {
    title: string;
    description: string;
    targetChat: string;
    reward: number;
    maxParticipants: number;
    budget: number;
  },
) {
  const settings = await getSetting("publisher");
  if (!settings.enabled) throw new ActionError("DISABLED");
  if (input.reward < settings.min_reward) throw new ActionError("REWARD_TOO_LOW");
  if (input.maxParticipants < settings.min_participants) throw new ActionError("PARTICIPANTS_LOW");
  if (input.budget < input.reward * input.maxParticipants) throw new ActionError("BUDGET_LOW");

  await db().from("tasks").insert({
    title: input.title.slice(0, 120),
    description: input.description.slice(0, 500),
    task_type: "telegram_channel",
    target_chat: input.targetChat.trim(),
    reward: input.reward,
    max_participants: input.maxParticipants,
    budget: input.budget,
    status: "pending",
    enabled: false,
    is_publisher: true,
    publisher_user_id: user.id,
  });
  return { ok: true };
}

/* ---------------------------- withdrawals --------------------------- */

export async function requestWithdrawal(user: TonFlowUser, amount: number, wallet: string) {
  const settings = await getSetting("withdrawal");
  const addr = wallet.trim();
  if (!/^[A-Za-z0-9_:-]{40,80}$/.test(addr)) throw new ActionError("BAD_WALLET");
  if (!Number.isFinite(amount) || amount < settings.minimum) throw new ActionError("BELOW_MINIMUM");

  const fresh = await reloadUser(user.id);
  if (Number(fresh.balance) < amount) throw new ActionError("INSUFFICIENT");

  const { count } = await db()
    .from("withdrawals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["pending", "processing"]);
  if ((count ?? 0) >= 3) throw new ActionError("TOO_MANY_PENDING");

  const fee = computeFee(amount, settings);
  const net = Number((amount - fee).toFixed(9));

  await credit(fresh, -amount, "withdrawal", "Withdrawal request", { wallet: addr, fee });
  const { data: wd } = await db()
    .from("withdrawals")
    .insert({ user_id: user.id, amount, fee, net_amount: net, wallet: addr })
    .select("*")
    .single();

  await notifyUser(fresh, "withdrawal_submitted", (t) => ({
    text: [
      `<b>${t("bot.wd.submitted")}</b>`,
      "",
      `${t("bot.wd.amount")}: <b>${ton(amount)} TON</b>`,
      `${t("bot.wd.status")}: ${t("wd.status.pending")}`,
    ].join("\n"),
  }));

  return { withdrawal: wd, state: await finish(user.id) };
}

export async function withdrawalHistory(user: TonFlowUser) {
  const { data } = await db()
    .from("withdrawals")
    .select("id, amount, fee, net_amount, wallet, status, tx_hash, created_at, processed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function transactionHistory(user: TonFlowUser) {
  const { data } = await db()
    .from("transactions")
    .select("id, type, amount, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

/* ----------------------------- preferences -------------------------- */

export async function setLanguage(user: TonFlowUser, lang: string) {
  await db()
    .from("tonflow_users")
    .update({ language: lang, language_chosen: true })
    .eq("id", user.id);
  return finish(user.id);
}

export async function setNotifications(user: TonFlowUser, enabled: boolean) {
  await db().from("tonflow_users").update({ notifications_enabled: enabled }).eq("id", user.id);
  return finish(user.id);
}

export const PAYOUT_CHANNEL_HANDLE = PAYOUT_CHANNEL;

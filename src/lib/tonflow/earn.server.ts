import type { TonFlowUser } from "./auth.server";
import { db } from "./db.server";
import { maybeVerifyReferral, payCommission } from "./referral.server";

export function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function randomInRange(min: number, max: number, decimals = 7): number {
  const value = min + Math.random() * Math.max(max - min, 0);
  return Number(value.toFixed(decimals));
}

/** Credits TON atomically, records the transaction, pays referral commission. */
export async function credit(
  user: TonFlowUser,
  amount: number,
  type: string,
  description: string,
  metadata: Record<string, unknown> = {},
  opts: { commission?: boolean } = {},
): Promise<number> {
  const { data, error } = await db().rpc("credit_user", {
    _user_id: user.id,
    _amount: amount,
    _type: type,
    _description: description,
    _metadata: metadata,
  });
  if (error) throw new Error(error.message);
  if (opts.commission && amount > 0) await payCommission(user, amount, type);
  return Number(data);
}

export async function addTickets(userId: string, tickets: number) {
  if (tickets <= 0) return;
  const { data } = await db()
    .from("tonflow_users")
    .select("spin_tickets")
    .eq("id", userId)
    .maybeSingle();
  await db()
    .from("tonflow_users")
    .update({ spin_tickets: (data?.spin_tickets ?? 0) + tickets })
    .eq("id", userId);
}

export type AchievementProgress = {
  key: string;
  achievement_type: string;
  threshold: number;
  tickets: number;
  progress: number;
  claimed: boolean;
};

async function verifiedReferralCount(userId: string) {
  const { count } = await db()
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId)
    .eq("verified", true);
  return count ?? 0;
}

export async function achievementProgress(user: TonFlowUser): Promise<AchievementProgress[]> {
  const client = db();
  const [{ data: list }, { data: claims }, refs, { data: fresh }] = await Promise.all([
    client.from("achievements").select("*").eq("enabled", true).order("threshold"),
    client.from("achievement_claims").select("achievement_id").eq("user_id", user.id),
    verifiedReferralCount(user.id),
    client.from("tonflow_users").select("tasks_completed").eq("id", user.id).maybeSingle(),
  ]);
  const claimed = new Set((claims ?? []).map((c) => c.achievement_id as string));
  return (list ?? []).map((a) => ({
    key: a.key as string,
    achievement_type: a.achievement_type as string,
    threshold: a.threshold as number,
    tickets: a.tickets as number,
    progress: a.achievement_type === "referrals" ? refs : (fresh?.tasks_completed ?? 0),
    claimed: claimed.has(a.id as string),
  }));
}

/** Grants any newly-earned achievement tickets. Server-side only. */
export async function grantAchievements(user: TonFlowUser): Promise<number> {
  const client = db();
  const [{ data: list }, { data: claims }, refs, { data: fresh }] = await Promise.all([
    client.from("achievements").select("*").eq("enabled", true),
    client.from("achievement_claims").select("achievement_id").eq("user_id", user.id),
    verifiedReferralCount(user.id),
    client.from("tonflow_users").select("tasks_completed").eq("id", user.id).maybeSingle(),
  ]);
  const claimed = new Set((claims ?? []).map((c) => c.achievement_id as string));
  let granted = 0;
  for (const a of list ?? []) {
    if (claimed.has(a.id as string)) continue;
    const progress = a.achievement_type === "referrals" ? refs : (fresh?.tasks_completed ?? 0);
    if (progress < Number(a.threshold)) continue;
    const { error } = await client
      .from("achievement_claims")
      .insert({ achievement_id: a.id, user_id: user.id, tickets: a.tickets });
    if (!error) granted += Number(a.tickets);
  }
  if (granted > 0) await addTickets(user.id, granted);
  return granted;
}

export async function afterProgress(user: TonFlowUser) {
  await maybeVerifyReferral(user);
  return grantAchievements(user);
}

export async function reloadUser(userId: string): Promise<TonFlowUser> {
  const { data } = await db().from("tonflow_users").select("*").eq("id", userId).single();
  return data as unknown as TonFlowUser;
}

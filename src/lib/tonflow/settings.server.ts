import { db } from "./db.server";

export type AdsSettings = { ticket_chance: number; ticket_daily_limit: number };
export type DailyRewardSettings = { enabled: boolean; amount: number };
export type ReferralSettings = {
  reward: number;
  commission_percent: number;
  required_tasks: number;
  required_ads: number;
  block_same_device: boolean;
};
export type SpinReward = { amount: number; weight: number };
export type SpinnerSettings = {
  paid_spin_cost: number;
  free_spin_enabled: boolean;
  rewards: SpinReward[];
};
export type WithdrawalSettings = {
  minimum: number;
  tiers: { min: number; fee: number }[];
};
export type NotificationSettings = {
  daily_spin_reminder: boolean;
  new_task_alert: boolean;
  min_hours_between: number;
};
export type PublisherSettings = { enabled: boolean; min_reward: number; min_participants: number };

export type SettingsMap = {
  ads: AdsSettings;
  daily_reward: DailyRewardSettings;
  referral: ReferralSettings;
  spinner: SpinnerSettings;
  withdrawal: WithdrawalSettings;
  notifications: NotificationSettings;
  publisher: PublisherSettings;
};

const DEFAULTS: SettingsMap = {
  ads: { ticket_chance: 0.4, ticket_daily_limit: 15 },
  daily_reward: { enabled: true, amount: 0.0005 },
  referral: {
    reward: 0.005,
    commission_percent: 20,
    required_tasks: 2,
    required_ads: 2,
    block_same_device: true,
  },
  spinner: {
    paid_spin_cost: 0.01,
    free_spin_enabled: true,
    rewards: [
      { amount: 0.0001, weight: 45 },
      { amount: 0, weight: 30 },
      { amount: 0.003, weight: 15 },
      { amount: 0.005, weight: 6 },
      { amount: 0.01, weight: 3 },
      { amount: 0.05, weight: 0.99 },
      { amount: 0.1, weight: 0.01 },
    ],
  },
  withdrawal: {
    minimum: 0.05,
    tiers: [
      { min: 0.05, fee: 0 },
      { min: 0.1, fee: 0.025 },
    ],
  },
  notifications: { daily_spin_reminder: true, new_task_alert: true, min_hours_between: 20 },
  publisher: { enabled: true, min_reward: 0.005, min_participants: 10 },
};

export async function getSetting<K extends keyof SettingsMap>(key: K): Promise<SettingsMap[K]> {
  const { data } = await db().from("app_settings").select("value").eq("key", key).maybeSingle();
  return { ...DEFAULTS[key], ...((data?.value as object | undefined) ?? {}) } as SettingsMap[K];
}

export async function getAllSettings(): Promise<SettingsMap> {
  const { data } = await db().from("app_settings").select("key, value");
  const out = structuredClone(DEFAULTS);
  for (const row of data ?? []) {
    const k = row.key as keyof SettingsMap;
    if (k in out) Object.assign(out[k] as object, row.value as object);
  }
  return out;
}

export async function setSetting<K extends keyof SettingsMap>(
  key: K,
  value: Partial<SettingsMap[K]>,
) {
  const current = await getSetting(key);
  const merged = { ...current, ...value };
  await db()
    .from("app_settings")
    .upsert({ key, value: merged, updated_at: new Date().toISOString() }, { onConflict: "key" });
  return merged;
}

export function computeFee(amount: number, s: WithdrawalSettings): number {
  const tiers = [...(s.tiers ?? [])].sort((a, b) => a.min - b.min);
  let fee = 0;
  for (const t of tiers) if (amount >= t.min) fee = t.fee;
  return Math.min(fee, amount);
}

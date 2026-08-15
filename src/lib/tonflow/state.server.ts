import type { TonFlowUser } from "./auth.server";
import { isAdmin } from "./auth.server";
import { db, refLink } from "./db.server";
import { achievementProgress, startOfUtcDay, type AchievementProgress } from "./earn.server";
import { getAllSettings, type SettingsMap } from "./settings.server";

export type PublicUser = {
  id: string;
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  language: string;
  languageChosen: boolean;
  balance: number;
  totalEarned: number;
  referralEarned: number;
  adsWatched: number;
  tasksCompleted: number;
  spinTickets: number;
  notificationsEnabled: boolean;
  isAdmin: boolean;
  dailyRewardAvailable: boolean;
  freeSpinAvailable: boolean;
  createdAt: string;
};

export type AdNetworkState = {
  network: string;
  title: string;
  enabled: boolean;
  rewardMin: number;
  rewardMax: number;
  dailyLimit: number;
  watchedToday: number;
  cooldownSeconds: number;
  config: Record<string, unknown>;
};

export type TaskState = {
  id: string;
  title: string;
  description: string | null;
  taskType: string;
  targetChat: string | null;
  targetUrl: string | null;
  reward: number;
  participants: number;
  maxParticipants: number;
  penaltyHours: number;
  penaltyAmount: number;
  penaltyEnabled: boolean;
  completed: boolean;
};

export type ActivityItem = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
};

export type ReferralStats = {
  link: string;
  total: number;
  verified: number;
  pending: number;
  earned: number;
  commission: number;
  list: {
    username: string | null;
    firstName: string | null;
    photoUrl: string | null;
    verified: boolean;
    joinedAt: string;
    tasks: number;
    ads: number;
  }[];
};

export type AppState = {
  user: PublicUser;
  settings: {
    referral: SettingsMap["referral"];
    spinner: SettingsMap["spinner"];
    withdrawal: SettingsMap["withdrawal"];
    dailyReward: SettingsMap["daily_reward"];
    ads: SettingsMap["ads"];
    publisher: SettingsMap["publisher"];
  };
  translations: Record<string, string>;
  adNetworks: AdNetworkState[];
  tasks: TaskState[];
  activity: ActivityItem[];
  achievements: AchievementProgress[];
  referral: ReferralStats;
  todayEarnings: number;
  ticketsFromAdsToday: number;
};

function sameUtcDay(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export function toPublicUser(u: TonFlowUser, freeSpinEnabled: boolean): PublicUser {
  return {
    id: u.id,
    telegramId: u.telegram_id,
    username: u.username,
    firstName: u.first_name,
    lastName: u.last_name,
    photoUrl: u.photo_url,
    language: u.language,
    languageChosen: Boolean(u.language_chosen),
    balance: Number(u.balance),
    totalEarned: Number(u.total_earned),
    referralEarned: Number(u.referral_earned),
    adsWatched: u.ads_watched,
    tasksCompleted: u.tasks_completed,
    spinTickets: u.spin_tickets,
    notificationsEnabled: u.notifications_enabled,
    isAdmin: isAdmin(u.telegram_id),
    dailyRewardAvailable: !sameUtcDay(u.last_daily_reward_at),
    freeSpinAvailable: freeSpinEnabled && !sameUtcDay(u.last_free_spin_at),
    createdAt: u.created_at,
  };
}

export async function buildAppState(user: TonFlowUser): Promise<AppState> {
  const client = db();
  const dayStart = startOfUtcDay();
  const settings = await getAllSettings();

  const [
    { data: networks },
    { data: adToday },
    { data: tasks },
    { data: completions },
    { data: activity },
    { data: txToday },
    { data: translations },
    achievements,
    referral,
  ] = await Promise.all([
    client.from("ad_networks").select("*").order("sort_order"),
    client.from("ad_views").select("network, ticket_awarded").eq("user_id", user.id).gte("created_at", dayStart),
    client
      .from("tasks")
      .select("*")
      .eq("enabled", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(60),
    client.from("task_completions").select("task_id").eq("user_id", user.id),
    client
      .from("transactions")
      .select("id, type, amount, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
    client.from("transactions").select("amount").eq("user_id", user.id).gte("created_at", dayStart).gt("amount", 0),
    client.from("translations").select("key, value").eq("lang", user.language),
    achievementProgress(user),
    referralStats(user),
  ]);

  const done = new Set((completions ?? []).map((c) => c.task_id as string));
  const overrides: Record<string, string> = {};
  for (const row of translations ?? []) overrides[row.key as string] = row.value as string;

  return {
    user: toPublicUser(user, settings.spinner.free_spin_enabled),
    settings: {
      referral: settings.referral,
      spinner: settings.spinner,
      withdrawal: settings.withdrawal,
      dailyReward: settings.daily_reward,
      ads: settings.ads,
      publisher: settings.publisher,
    },
    translations: overrides,
    adNetworks: (networks ?? []).map((n) => ({
      network: n.network as string,
      title: n.title as string,
      enabled: n.enabled as boolean,
      rewardMin: Number(n.reward_min),
      rewardMax: Number(n.reward_max),
      dailyLimit: n.daily_limit as number,
      cooldownSeconds: n.cooldown_seconds as number,
      config: (n.config ?? {}) as Record<string, unknown>,
      watchedToday: (adToday ?? []).filter((a) => a.network === n.network).length,
    })),
    tasks: (tasks ?? [])
      .filter((t) => Number(t.participants) < Number(t.max_participants))
      .map((t) => ({
        id: t.id as string,
        title: t.title as string,
        description: t.description as string | null,
        taskType: t.task_type as string,
        targetChat: t.target_chat as string | null,
        targetUrl: t.target_url as string | null,
        reward: Number(t.reward),
        participants: Number(t.participants),
        maxParticipants: Number(t.max_participants),
        penaltyHours: Number(t.penalty_hours),
        penaltyAmount: Number(t.penalty_amount),
        penaltyEnabled: Boolean(t.penalty_enabled),
        completed: done.has(t.id as string),
      })),
    activity: (activity ?? []).map((a) => ({
      id: a.id as string,
      type: a.type as string,
      amount: Number(a.amount),
      description: a.description as string | null,
      createdAt: a.created_at as string,
    })),
    achievements,
    referral,
    todayEarnings: (txToday ?? []).reduce((s, r) => s + Number(r.amount), 0),
    ticketsFromAdsToday: (adToday ?? []).filter((a) => a.ticket_awarded).length,
  };
}

export async function referralStats(user: TonFlowUser): Promise<ReferralStats> {
  const client = db();
  const { data } = await client
    .from("referrals")
    .select(
      "verified, created_at, reward_paid, commission_earned, referred:referred_id (username, first_name, photo_url, tasks_completed, ads_watched)",
    )
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = data ?? [];
  const earned = rows.reduce((s, r) => s + Number(r.reward_paid), 0);
  const commission = rows.reduce((s, r) => s + Number(r.commission_earned), 0);

  return {
    link: refLink(user.telegram_id),
    total: rows.length,
    verified: rows.filter((r) => r.verified).length,
    pending: rows.filter((r) => !r.verified).length,
    earned,
    commission,
    list: rows.map((r) => {
      const rawRef = (r as unknown as { referred?: unknown }).referred;
      const ref = (Array.isArray(rawRef) ? rawRef[0] : rawRef) as Record<string, unknown> | undefined ?? {};
      return {
        username: (ref["username"] as string | null) ?? null,
        firstName: (ref["first_name"] as string | null) ?? null,
        photoUrl: (ref["photo_url"] as string | null) ?? null,
        verified: Boolean(r.verified),
        joinedAt: r.created_at as string,
        tasks: Number(ref["tasks_completed"] ?? 0),
        ads: Number(ref["ads_watched"] ?? 0),
      };
    }),
  };
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Gift, PlayCircle, Sparkles, Ticket, TrendingUp } from "lucide-react";

import { AppShell, GlassCard } from "@/components/tonflow/AppShell";
import { useTonFlow } from "@/components/tonflow/TonFlowProvider";
import { authPayload, formatTon, haptic } from "@/lib/tonflow/client";
import { claimDaily, completeAd, doSpin, redeemPromo } from "@/lib/tonflow/api.functions";
import type { AppState } from "@/lib/tonflow/state.server";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TonFlow — Earn TON from ads, tasks & referrals" },
      {
        name: "description",
        content:
          "TonFlow is a Telegram Mini App where you earn TON by watching ads, completing tasks, spinning the wheel and inviting friends.",
      },
      { property: "og:title", content: "TonFlow — Earn TON in Telegram" },
      {
        property: "og:description",
        content: "Watch ads, complete tasks, spin the TON wheel and withdraw your TON.",
      },
    ],
  }),
  component: HomePage,
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-glass px-3 py-2.5">
      <p className="text-[0.65rem] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

function HomePage() {
  return (
    <AppShell>
      <HomeContent />
    </AppShell>
  );
}

function HomeContent() {
  const { state, t, setState, run } = useTonFlow();
  const [busy, setBusy] = useState<string | null>(null);
  const [promo, setPromo] = useState("");
  const s = state as AppState;

  const apply = (next: AppState | undefined) => next && setState(next);

  async function watch(network: string) {
    setBusy(network);
    haptic("medium");
    const res = await run(() =>
      completeAd({
        data: {
          ...authPayload(),
          network: network as "adsgram" | "monetag" | "gigapub",
          nonce: crypto.randomUUID(),
        },
      }),
    );
    setBusy(null);
    if (res) {
      apply(res.state as AppState);
      toast.success(`+${formatTon(res.reward, 7)} TON`);
      if (res.ticket) toast.success(t("ads.ticketWon"));
    }
  }

  async function daily() {
    setBusy("daily");
    const res = await run(() => claimDaily({ data: authPayload() }));
    setBusy(null);
    if (res) {
      apply(res.state as AppState);
      toast.success(`+${formatTon(res.reward, 7)} TON`);
    }
  }

  async function spin(type: "free" | "ticket" | "paid") {
    setBusy("spin");
    const res = await run(() => doSpin({ data: { ...authPayload(), spinType: type } }));
    setBusy(null);
    if (res) {
      apply(res.state as AppState);
      if (res.jackpot) toast.success(t("spin.jackpot", { amount: formatTon(res.reward, 7) }));
      else if (res.reward > 0) toast.success(t("spin.won", { amount: formatTon(res.reward, 7) }));
      else toast(t("spin.lost"));
    }
  }

  async function claimPromo() {
    if (!promo.trim()) return;
    setBusy("promo");
    const res = await run(() => redeemPromo({ data: { ...authPayload(), code: promo } }));
    setBusy(null);
    if (res) {
      apply(res.state as AppState);
      setPromo("");
      toast.success(t("promo.success", { amount: formatTon(res.reward, 7) }));
    }
  }

  return (
    <div className="space-y-4 pb-2">
      <GlassCard className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{t("home.balance")}</p>
            <p className="text-gradient-ton mt-1 text-4xl font-bold tracking-tight">
              {formatTon(s.user.balance)}
              <span className="ml-1 text-base font-semibold">TON</span>
            </p>
          </div>
          <div className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5">
            <Ticket className="size-4 text-warning" />
            <span className="text-sm font-semibold">{s.user.spinTickets}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label={t("home.totalEarned")} value={`${formatTon(s.user.totalEarned)} TON`} />
          <Stat label={t("home.today")} value={`${formatTon(s.todayEarnings)} TON`} />
          <Stat label={t("home.ads")} value={String(s.user.adsWatched)} />
          <Stat label={t("home.tasksDone")} value={String(s.user.tasksCompleted)} />
          <Stat label={t("home.refEarnings")} value={`${formatTon(s.user.referralEarned)} TON`} />
          <Stat label={t("home.tickets")} value={String(s.user.spinTickets)} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <PlayCircle className="size-5 text-primary" />
          <h2 className="text-sm font-semibold">🎬 {t("home.watchAds")}</h2>
        </div>
        <div className="mt-3 space-y-2">
          {s.adNetworks.map((n) => {
            const left = n.dailyLimit - n.watchedToday;
            return (
              <div key={n.network} className="flex items-center justify-between rounded-2xl bg-glass px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    {formatTon(n.rewardMin, 7)}–{formatTon(n.rewardMax, 7)} TON · {n.watchedToday}/
                    {n.dailyLimit}
                  </p>
                </div>
                <button
                  disabled={!n.enabled || left <= 0 || busy === n.network}
                  onClick={() => void watch(n.network)}
                  className="gradient-ton rounded-xl px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-40"
                >
                  {!n.enabled
                    ? t("ads.disabled")
                    : left <= 0
                      ? t("ads.limitReached")
                      : busy === n.network
                        ? t("ads.loading")
                        : t("ads.watch")}
                </button>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={!s.user.dailyRewardAvailable || busy === "daily"}
          onClick={() => void daily()}
          className="glass flex flex-col items-start gap-2 rounded-3xl p-4 text-left transition-transform active:scale-95 disabled:opacity-50"
        >
          <Gift className="size-6 text-warning" />
          <span className="text-sm font-semibold">🎁 {t("home.dailyReward")}</span>
          <span className="text-[0.65rem] text-muted-foreground">
            {s.user.dailyRewardAvailable ? t("home.claim") : t("home.comeBackTomorrow")}
          </span>
        </button>

        <div className="glass flex flex-col items-start gap-2 rounded-3xl p-4">
          <Sparkles className="size-6 text-accent" />
          <span className="text-sm font-semibold">🎡 {t("home.spin")}</span>
          <div className="flex w-full flex-wrap gap-1.5">
            <button
              disabled={!s.user.freeSpinAvailable || busy === "spin"}
              onClick={() => void spin("free")}
              className="gradient-ton rounded-lg px-2 py-1 text-[0.65rem] font-semibold text-primary-foreground disabled:opacity-40"
            >
              {t("spin.free")}
            </button>
            <button
              disabled={s.user.spinTickets < 1 || busy === "spin"}
              onClick={() => void spin("ticket")}
              className="rounded-lg bg-glass-strong px-2 py-1 text-[0.65rem] font-semibold disabled:opacity-40"
            >
              🎟 {s.user.spinTickets}
            </button>
            <button
              disabled={busy === "spin"}
              onClick={() => void spin("paid")}
              className="gradient-gold rounded-lg px-2 py-1 text-[0.65rem] font-semibold text-warning-foreground disabled:opacity-40"
            >
              {formatTon(s.settings.spinner.paid_spin_cost)} TON
            </button>
          </div>
        </div>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold">🎟 {t("promo.title")}</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={promo}
            onChange={(e) => setPromo(e.target.value.toUpperCase())}
            placeholder={t("promo.placeholder")}
            className="min-w-0 flex-1 rounded-2xl bg-input px-4 py-2.5 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          />
          <button
            disabled={busy === "promo"}
            onClick={() => void claimPromo()}
            className="gradient-ton rounded-2xl px-4 py-2.5 text-xs font-semibold text-primary-foreground active:scale-95 disabled:opacity-40"
          >
            {t("promo.claim")}
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-success" />
          <h2 className="text-sm font-semibold">{t("home.activity")}</h2>
        </div>
        <div className="mt-3 space-y-1.5">
          {s.activity.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">{t("home.noActivity")}</p>
          )}
          {s.activity.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-2xl bg-glass px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{a.description ?? a.type}</p>
                <p className="text-[0.6rem] text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`text-xs font-semibold ${a.amount >= 0 ? "text-success" : "text-destructive"}`}
              >
                {a.amount >= 0 ? "+" : ""}
                {formatTon(a.amount, 7)}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Award, Bell, Globe, Wallet } from "lucide-react";

import { AppShell, GlassCard } from "@/components/tonflow/AppShell";
import { useTonFlow } from "@/components/tonflow/TonFlowProvider";
import { authPayload, formatTon } from "@/lib/tonflow/client";
import { LANGUAGES } from "@/lib/tonflow/i18n";
import { submitWithdrawal, toggleNotifications } from "@/lib/tonflow/api.functions";
import type { AppState } from "@/lib/tonflow/state.server";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "TonFlow Profile — Withdraw TON & manage your account" },
      {
        name: "description",
        content:
          "Track achievements, change language, manage notifications and withdraw your TON balance to your wallet.",
      },
      { property: "og:title", content: "TonFlow Profile" },
      { property: "og:description", content: "Withdraw TON and manage your TonFlow account." },
    ],
  }),
  component: () => (
    <AppShell>
      <ProfileContent />
    </AppShell>
  ),
});

function ProfileContent() {
  const { state, t, setState, run, pickLanguage } = useTonFlow();
  const s = state as AppState;
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState(String(s.settings.withdrawal.minimum));
  const [busy, setBusy] = useState(false);

  async function withdraw() {
    setBusy(true);
    const res = await run(() =>
      submitWithdrawal({
        data: { ...authPayload(), walletAddress: wallet.trim(), amount: Number(amount) },
      }),
    );
    setBusy(false);
    if (res) {
      setState(res.state as AppState);
      toast.success(t("withdraw.submitted"));
      setWallet("");
    }
  }

  async function toggleNotify() {
    const res = await run(() =>
      toggleNotifications({ data: { ...authPayload(), enabled: !s.user.notificationsEnabled } }),
    );
    if (res) setState(res as AppState);
  }

  return (
    <div className="space-y-4">
      <GlassCard className="flex items-center gap-3">
        {s.user.photoUrl ? (
          <img src={s.user.photoUrl} alt="" className="size-14 rounded-full" />
        ) : (
          <div className="gradient-ton flex size-14 items-center justify-center rounded-full text-lg font-bold text-primary-foreground">
            {(s.user.firstName ?? "T").slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">
            {s.user.firstName ?? t("referral.anonymous")}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {s.user.username ? `@${s.user.username}` : `ID ${s.user.telegramId}`}
          </p>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-primary" />
          <h2 className="text-sm font-semibold">💎 {t("withdraw.title")}</h2>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("withdraw.balance")}: {formatTon(s.user.balance)} TON · {t("withdraw.min")}:{" "}
          {formatTon(s.settings.withdrawal.minimum)} TON
        </p>
        <div className="mt-3 space-y-2">
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder={t("withdraw.wallet")}
            className="w-full rounded-2xl bg-input px-4 py-2.5 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          />
          <input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("withdraw.amount")}
            className="w-full rounded-2xl bg-input px-4 py-2.5 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          />
          <button
            disabled={busy}
            onClick={() => void withdraw()}
            className="gradient-ton w-full rounded-2xl px-4 py-3 text-sm font-semibold text-primary-foreground active:scale-95 disabled:opacity-40"
          >
            {t("withdraw.request")}
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <Award className="size-5 text-warning" />
          <h2 className="text-sm font-semibold">🏆 {t("profile.achievements")}</h2>
        </div>
        <div className="mt-3 space-y-2">
          {s.achievements.map((a) => (
            <div key={a.key} className="rounded-2xl bg-glass px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{a.key}</span>
                <span className={a.claimed ? "text-success" : "text-muted-foreground"}>
                  {a.progress}/{a.threshold}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-input">
                <div
                  className="gradient-ton h-full rounded-full"
                  style={{ width: `${Math.min(100, (a.progress / Math.max(1, a.threshold)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <button
          onClick={() => void toggleNotify()}
          className="flex w-full items-center justify-between"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="size-5 text-accent" /> {t("profile.notifications")}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${
              s.user.notificationsEnabled
                ? "gradient-ton text-primary-foreground"
                : "bg-glass-strong text-muted-foreground"
            }`}
          >
            {s.user.notificationsEnabled ? t("common.on") : t("common.off")}
          </span>
        </button>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-primary" />
          <h2 className="text-sm font-semibold">{t("profile.language")}</h2>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => void pickLanguage(l.code)}
              className={`rounded-2xl px-2 py-2 text-[0.65rem] font-medium ${
                s.user.language === l.code
                  ? "gradient-ton text-primary-foreground"
                  : "bg-glass text-muted-foreground"
              }`}
            >
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

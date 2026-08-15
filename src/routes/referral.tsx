import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Share2, Users } from "lucide-react";

import { AppShell, GlassCard } from "@/components/tonflow/AppShell";
import { useTonFlow } from "@/components/tonflow/TonFlowProvider";
import { formatTon, tg } from "@/lib/tonflow/client";
import type { AppState } from "@/lib/tonflow/state.server";

export const Route = createFileRoute("/referral")({
  head: () => ({
    meta: [
      { title: "TonFlow Referrals — Invite friends, earn TON commission" },
      {
        name: "description",
        content:
          "Invite friends to TonFlow and earn TON per verified referral plus lifetime commission on their earnings.",
      },
      { property: "og:title", content: "TonFlow Referrals" },
      {
        property: "og:description",
        content: "Earn TON for every verified friend you invite to TonFlow.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ReferralContent />
    </AppShell>
  ),
});

function ReferralContent() {
  const { state, t } = useTonFlow();
  const s = state as AppState;
  const r = s.referral;

  const share = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(r.link)}&text=${encodeURIComponent(t("referral.shareText"))}`;
    const app = tg();
    if (app?.openTelegramLink) app.openTelegramLink(url);
    else window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-xl font-bold">👥 {t("referral.title")}</h1>

      <GlassCard>
        <p className="text-xs text-muted-foreground">{t("referral.yourLink")}</p>
        <p className="mt-1 truncate text-sm font-medium">{r.link}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              void navigator.clipboard.writeText(r.link);
              toast.success(t("referral.copied"));
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-glass-strong px-3 py-2.5 text-xs font-semibold active:scale-95"
          >
            <Copy className="size-4" /> {t("referral.copy")}
          </button>
          <button
            onClick={share}
            className="gradient-ton flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold text-primary-foreground active:scale-95"
          >
            <Share2 className="size-4" /> {t("referral.share")}
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        {[
          [t("referral.total"), String(r.total)],
          [t("referral.verified"), String(r.verified)],
          [t("referral.pending"), String(r.pending)],
          [t("referral.earned"), `${formatTon(r.earned)} TON`],
        ].map(([label, value]) => (
          <GlassCard key={label} className="py-3">
            <p className="text-[0.65rem] text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-bold">{value}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <p className="text-xs text-muted-foreground">
          {t("referral.rules", {
            amount: formatTon(s.settings.referral.reward),
            percent: String(s.settings.referral.commission_percent),
          })}
        </p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="text-sm font-semibold">{t("referral.list")}</h2>
        </div>
        <div className="mt-3 space-y-1.5">
          {r.list.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">{t("referral.none")}</p>
          )}
          {r.list.map((f, i) => (
            <div
              key={`${f.username ?? "u"}-${i}`}
              className="flex items-center justify-between rounded-2xl bg-glass px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">
                  {f.firstName ?? f.username ?? t("referral.anonymous")}
                </p>
                <p className="text-[0.6rem] text-muted-foreground">
                  {f.tasks} · {f.ads}
                </p>
              </div>
              <span
                className={`text-[0.65rem] font-semibold ${f.verified ? "text-success" : "text-warning"}`}
              >
                {f.verified ? t("referral.verified") : t("referral.pending")}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

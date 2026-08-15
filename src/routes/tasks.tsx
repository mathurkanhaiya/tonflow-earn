import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink } from "lucide-react";

import { AppShell, GlassCard } from "@/components/tonflow/AppShell";
import { useTonFlow } from "@/components/tonflow/TonFlowProvider";
import { authPayload, formatTon, tg } from "@/lib/tonflow/client";
import { submitPublisherTask, verifyTaskFn } from "@/lib/tonflow/api.functions";
import type { AppState } from "@/lib/tonflow/state.server";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "TonFlow Tasks — Complete tasks and earn TON" },
      {
        name: "description",
        content:
          "Join channels, complete community tasks and publisher campaigns to earn TON in TonFlow.",
      },
      { property: "og:title", content: "TonFlow Tasks" },
      { property: "og:description", content: "Complete TON-paying tasks and campaigns in TonFlow." },
    ],
  }),
  component: () => (
    <AppShell>
      <TasksContent />
    </AppShell>
  ),
});

function TasksContent() {
  const { state, t, setState, run } = useTonFlow();
  const s = state as AppState;
  const [busy, setBusy] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetChat: "",
    reward: "0.01",
    maxParticipants: "100",
    budget: "1",
  });

  async function verify(taskId: string) {
    setBusy(taskId);
    const res = await run(() => verifyTaskFn({ data: { ...authPayload(), taskId } }));
    setBusy(null);
    if (res) {
      setState(res.state as AppState);
      toast.success(`+${formatTon(res.reward, 7)} TON`);
    }
  }

  async function publish() {
    setBusy("publish");
    const res = await run(() =>
      submitPublisherTask({
        data: {
          ...authPayload(),
          title: form.title,
          description: form.description,
          targetChat: form.targetChat,
          reward: Number(form.reward),
          maxParticipants: Number(form.maxParticipants),
          budget: Number(form.budget),
        },
      }),
    );
    setBusy(null);
    if (res) {
      setPublishOpen(false);
      toast.success(t("tasks.publishSubmitted"));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-xl font-bold">🎯 {t("tasks.title")}</h1>

      <GlassCard>
        <h2 className="text-sm font-semibold">{t("tasks.permanent")}</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {s.adNetworks.map((n) => (
            <div key={n.network} className="rounded-2xl bg-glass px-3 py-2.5 text-center">
              <p className="text-xs font-medium">{n.title}</p>
              <p className="text-[0.6rem] text-muted-foreground">
                {n.watchedToday}/{n.dailyLimit}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[0.65rem] text-muted-foreground">{t("ads.title")}</p>
      </GlassCard>

      <div className="space-y-3">
        <h2 className="px-1 text-sm font-semibold">{t("tasks.normal")}</h2>
        {s.tasks.length === 0 && (
          <GlassCard className="text-center text-xs text-muted-foreground">
            {t("tasks.none")}
          </GlassCard>
        )}
        {s.tasks.map((task) => (
          <GlassCard key={task.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{task.title}</p>
                {task.description && (
                  <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{task.description}</p>
                )}
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  {t("tasks.participants")}: {task.participants}/{task.maxParticipants}
                </p>
              </div>
              <span className="text-gradient-gold shrink-0 text-sm font-bold">
                {formatTon(task.reward)} TON
              </span>
            </div>
            {task.penaltyEnabled && (
              <p className="mt-2 text-[0.6rem] text-warning">
                {t("tasks.penaltyNote", {
                  hours: task.penaltyHours,
                  amount: formatTon(task.penaltyAmount),
                })}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              {task.completed ? (
                <span className="flex items-center gap-1.5 rounded-xl bg-glass px-3 py-2 text-xs font-semibold text-success">
                  <CheckCircle2 className="size-4" /> {t("tasks.verified")}
                </span>
              ) : (
                <>
                  <button
                    onClick={() => {
                      const url =
                        task.targetUrl ??
                        `https://t.me/${(task.targetChat ?? "").replace(/^@/, "")}`;
                      const app = tg();
                      if (app?.openTelegramLink) app.openTelegramLink(url);
                      else window.open(url, "_blank");
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-glass-strong px-3 py-2 text-xs font-semibold active:scale-95"
                  >
                    <ExternalLink className="size-3.5" /> {t("tasks.complete")}
                  </button>
                  <button
                    disabled={busy === task.id}
                    onClick={() => void verify(task.id)}
                    className="gradient-ton flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-95 disabled:opacity-40"
                  >
                    {t("tasks.verify")}
                  </button>
                </>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {s.settings.publisher.enabled && (
        <GlassCard>
          {!publishOpen ? (
            <button
              onClick={() => setPublishOpen(true)}
              className="gradient-gold w-full rounded-2xl px-4 py-3 text-sm font-semibold text-warning-foreground active:scale-95"
            >
              📢 {t("tasks.publish")}
            </button>
          ) : (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">{t("tasks.publishTitle")}</h2>
              {(
                [
                  ["title", t("tasks.field.title"), "text"],
                  ["description", t("tasks.field.description"), "text"],
                  ["targetChat", t("tasks.field.channel"), "text"],
                  ["reward", t("tasks.field.reward"), "number"],
                  ["maxParticipants", t("tasks.field.participants"), "number"],
                  ["budget", t("tasks.field.budget"), "number"],
                ] as const
              ).map(([field, label, type]) => (
                <input
                  key={field}
                  type={type}
                  placeholder={label}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full rounded-2xl bg-input px-4 py-2.5 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
                />
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setPublishOpen(false)}
                  className="flex-1 rounded-2xl bg-glass-strong px-4 py-2.5 text-xs font-semibold"
                >
                  {t("common.cancel")}
                </button>
                <button
                  disabled={busy === "publish"}
                  onClick={() => void publish()}
                  className="gradient-ton flex-1 rounded-2xl px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                >
                  {t("tasks.submit")}
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

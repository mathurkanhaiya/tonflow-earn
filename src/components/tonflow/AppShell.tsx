import { Link, useLocation } from "@tanstack/react-router";
import { Home, Target, Users, User } from "lucide-react";
import type { ReactNode } from "react";

import { LANGUAGES } from "@/lib/tonflow/i18n";
import { haptic } from "@/lib/tonflow/client";
import { useTonFlow } from "./TonFlowProvider";

const NAV = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/tasks", icon: Target, key: "nav.tasks" },
  { to: "/referral", icon: Users, key: "nav.referral" },
  { to: "/profile", icon: User, key: "nav.profile" },
] as const;

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass rounded-3xl p-4 ${className}`}>{children}</div>;
}

function LanguageGate() {
  const { pickLanguage, t } = useTonFlow();
  return (
    <div className="flex min-h-screen flex-col justify-center px-5 py-10">
      <div className="animate-pop">
        <h1 className="text-gradient-ton text-center text-3xl font-bold">{t("lang.title")}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t("lang.subtitle")}</p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                haptic("medium");
                void pickLanguage(l.code);
              }}
              className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-transform active:scale-95"
            >
              <span className="text-2xl">{l.flag}</span>
              <span className="text-sm font-medium">{l.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, loading, error, t, refresh } = useTonFlow();
  const { pathname } = useLocation();

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass animate-pulse-glow flex size-16 items-center justify-center rounded-full">
          <span className="text-gradient-ton text-2xl font-bold">TF</span>
        </div>
      </div>
    );

  if (error || !state) {
    const unauthorized = error === "UNAUTHORIZED";
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <GlassCard className="w-full max-w-sm text-center">
          <p className="text-sm text-muted-foreground">
            {unauthorized ? t("common.openInTelegram") : t("common.error")}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="gradient-ton mt-4 rounded-xl px-4 py-2 text-xs font-semibold text-primary-foreground active:scale-95"
          >
            Try again
          </button>
        </GlassCard>
      </div>
    );
  }

  if (!state.user.languageChosen) return <LanguageGate />;

  return (
    <div className="min-h-screen">
      <main className="safe-bottom mx-auto w-full max-w-lg px-4 pt-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="glass-strong flex items-center justify-around rounded-3xl px-2 py-2">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => haptic("light")}
                className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[0.68rem] font-medium transition-all ${
                  active
                    ? "gradient-ton text-primary-foreground glow"
                    : "text-muted-foreground active:scale-95"
                }`}
              >
                <Icon className="size-5" strokeWidth={2.2} />
                {t(item.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

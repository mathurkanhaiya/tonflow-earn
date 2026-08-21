import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { authPayload, tg } from "@/lib/tonflow/client";
import { createTranslator } from "@/lib/tonflow/i18n";
import { chooseLanguage, getState } from "@/lib/tonflow/api.functions";
import type { AppState } from "@/lib/tonflow/state.server";

type Ctx = {
  state: AppState | null;
  loading: boolean;
  error: string | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
  refresh: () => Promise<void>;
  setState: (s: AppState) => void;
  pickLanguage: (lang: string) => Promise<void>;
  run: <T>(fn: () => Promise<T>) => Promise<T | null>;
};

const TonFlowContext = createContext<Ctx | null>(null);

function cleanError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "error");
  return message.replace(/^Error:\s*/i, "").trim() || "error";
}

async function waitForTelegramInitData(timeoutMs = 2500): Promise<void> {
  if (typeof window === "undefined") return;

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (tg()?.initData) return;
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
}

export function useTonFlow() {
  const ctx = useContext(TonFlowContext);
  if (!ctx) throw new Error("useTonFlow must be used inside TonFlowProvider");
  return ctx;
}

export function TonFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Telegram may populate WebApp.initData just after hydration on some clients.
      // Avoid sending an empty auth request before the official SDK is ready.
      await waitForTelegramInitData();
      const next = await getState({ data: authPayload() });
      setState(next as AppState);
      setError(null);
    } catch (e) {
      setState(null);
      setError(cleanError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const app = tg();
    app?.ready();
    app?.expand();
    void refresh();
  }, [refresh]);

  const t = useMemo(() => {
    const translator = createTranslator(state?.user.language ?? "en", state?.translations ?? {});
    return (key: string, vars?: Record<string, string | number>) => translator(key, vars);
  }, [state?.user.language, state?.translations]);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch (e) {
      toast.error(cleanError(e));
      return null;
    }
  }, []);

  const pickLanguage = useCallback(
    async (lang: string) => {
      const next = await run(() => chooseLanguage({ data: { ...authPayload(), lang } }));
      if (next) setState(next as AppState);
    },
    [run],
  );

  const value = useMemo<Ctx>(
    () => ({ state, loading, error, t, refresh, setState, pickLanguage, run }),
    [state, loading, error, t, refresh, pickLanguage, run],
  );

  return <TonFlowContext.Provider value={value}>{children}</TonFlowContext.Provider>;
}

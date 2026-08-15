export type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: { start_param?: string; user?: { id: number } };
  ready: () => void;
  expand: () => void;
  openTelegramLink?: (url: string) => void;
  HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void };
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
};

export function tg(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp ?? null;
}

export function haptic(kind: "light" | "medium" | "success" = "light") {
  const app = tg();
  if (!app?.HapticFeedback) return;
  if (kind === "success") app.HapticFeedback.notificationOccurred("success");
  else app.HapticFeedback.impactOccurred(kind);
}

/** Stable-ish per-device fingerprint used only for referral anti-fraud. */
export function deviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  const key = "tonflow_device";
  let saved = localStorage.getItem(key);
  if (!saved) {
    saved = `${navigator.userAgent}|${screen.width}x${screen.height}|${new Date().getTimezoneOffset()}|${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(key, saved);
  }
  return saved;
}

export function authPayload() {
  const app = tg();
  return {
    initData: app?.initData ?? "",
    startParam: app?.initDataUnsafe?.start_param ?? null,
    deviceHash: deviceFingerprint(),
  };
}

export function formatTon(value: number, digits = 4) {
  if (!Number.isFinite(value)) return "0";
  const fixed = value.toFixed(digits);
  return fixed.replace(/\.?0+$/, "") || "0";
}

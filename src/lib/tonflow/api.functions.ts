import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const authInput = {
  initData: z.string().optional(),
  startParam: z.string().nullish(),
  deviceHash: z.string().nullish(),
  devTelegramId: z.number().nullish(),
};

const authSchema = z.object(authInput);

export const getState = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => authSchema.parse(raw))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { buildAppState } = await import("./state.server");
    return buildAppState(await requireUser(data));
  });

export const chooseLanguage = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => authSchema.extend({ lang: z.string().min(2).max(5) }).parse(raw))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { setLanguage } = await import("./actions.server");
    const { isLangCode, DEFAULT_LANG } = await import("./i18n");
    return setLanguage(await requireUser(data), isLangCode(data.lang) ? data.lang : DEFAULT_LANG);
  });

export const toggleNotifications = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => authSchema.extend({ enabled: z.boolean() }).parse(raw))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { setNotifications } = await import("./actions.server");
    return setNotifications(await requireUser(data), data.enabled);
  });

export const completeAd = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    authSchema
      .extend({ network: z.enum(["adsgram", "monetag", "gigapub"]), nonce: z.string().min(8).max(64) })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { watchAd } = await import("./actions.server");
    return watchAd(await requireUser(data), data.network, data.nonce);
  });

export const claimDaily = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => authSchema.parse(raw))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { claimDailyReward } = await import("./actions.server");
    return claimDailyReward(await requireUser(data));
  });

export const doSpin = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    authSchema.extend({ spinType: z.enum(["free", "ticket", "paid"]) }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { spin } = await import("./actions.server");
    return spin(await requireUser(data), data.spinType);
  });

export const redeemPromo = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => authSchema.extend({ code: z.string().min(2).max(40) }).parse(raw))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { claimPromo } = await import("./actions.server");
    return claimPromo(await requireUser(data), data.code);
  });

export const verifyTaskFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => authSchema.extend({ taskId: z.string().uuid() }).parse(raw))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { verifyTask } = await import("./actions.server");
    return verifyTask(await requireUser(data), data.taskId);
  });

export const submitPublisherTask = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    authSchema
      .extend({
        title: z.string().min(3).max(120),
        description: z.string().max(500).default(""),
        targetChat: z.string().min(2).max(80),
        reward: z.number().positive().max(10),
        maxParticipants: z.number().int().positive().max(100000),
        budget: z.number().positive().max(10000),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { publishTask } = await import("./actions.server");
    return publishTask(await requireUser(data), data);
  });

export const submitWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    authSchema
      .extend({ amount: z.number().positive().max(10000), wallet: z.string().min(40).max(80) })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { requestWithdrawal } = await import("./actions.server");
    return requestWithdrawal(await requireUser(data), data.amount, data.wallet);
  });

export const getWithdrawals = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => authSchema.parse(raw))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { withdrawalHistory } = await import("./actions.server");
    return withdrawalHistory(await requireUser(data));
  });

export const getTransactions = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => authSchema.parse(raw))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { transactionHistory } = await import("./actions.server");
    return transactionHistory(await requireUser(data));
  });

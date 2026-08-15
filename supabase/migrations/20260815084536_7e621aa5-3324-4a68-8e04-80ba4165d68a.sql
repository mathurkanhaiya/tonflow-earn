
-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- ============ users ============
CREATE TABLE public.tonflow_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  balance NUMERIC(20,9) NOT NULL DEFAULT 0,
  total_earned NUMERIC(20,9) NOT NULL DEFAULT 0,
  referral_earned NUMERIC(20,9) NOT NULL DEFAULT 0,
  ads_watched INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  spin_tickets INTEGER NOT NULL DEFAULT 0,
  referred_by BIGINT,
  referral_verified BOOLEAN NOT NULL DEFAULT false,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  device_hash TEXT,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  last_daily_reward_at TIMESTAMPTZ,
  last_free_spin_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.tonflow_users TO service_role;
ALTER TABLE public.tonflow_users ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tonflow_users_updated BEFORE UPDATE ON public.tonflow_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_tonflow_users_referred_by ON public.tonflow_users(referred_by);
CREATE INDEX idx_tonflow_users_device ON public.tonflow_users(device_hash);

-- ============ transactions ============
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.tonflow_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC(20,9) NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_user ON public.transactions(user_id, created_at DESC);

-- ============ ad networks ============
CREATE TABLE public.ad_networks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  reward_min NUMERIC(20,9) NOT NULL DEFAULT 0.0003,
  reward_max NUMERIC(20,9) NOT NULL DEFAULT 0.0009,
  daily_limit INTEGER NOT NULL DEFAULT 15,
  cooldown_seconds INTEGER NOT NULL DEFAULT 15,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ad_networks TO service_role;
ALTER TABLE public.ad_networks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_ad_networks_updated BEFORE UPDATE ON public.ad_networks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ad_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.tonflow_users(id) ON DELETE CASCADE,
  network TEXT NOT NULL,
  reward NUMERIC(20,9) NOT NULL DEFAULT 0,
  ticket_awarded BOOLEAN NOT NULL DEFAULT false,
  nonce TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ad_views TO service_role;
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ad_views_user_day ON public.ad_views(user_id, created_at DESC);
CREATE UNIQUE INDEX idx_ad_views_nonce ON public.ad_views(user_id, nonce) WHERE nonce IS NOT NULL;

-- ============ tasks ============
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'telegram_channel',
  target_chat TEXT,
  target_url TEXT,
  reward NUMERIC(20,9) NOT NULL DEFAULT 0.01,
  max_participants INTEGER NOT NULL DEFAULT 1000,
  participants INTEGER NOT NULL DEFAULT 0,
  budget NUMERIC(20,9) NOT NULL DEFAULT 0,
  spent NUMERIC(20,9) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_publisher BOOLEAN NOT NULL DEFAULT false,
  publisher_user_id UUID REFERENCES public.tonflow_users(id) ON DELETE SET NULL,
  penalty_enabled BOOLEAN NOT NULL DEFAULT true,
  penalty_hours INTEGER NOT NULL DEFAULT 72,
  penalty_amount NUMERIC(20,9) NOT NULL DEFAULT 0.01,
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.tonflow_users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reward NUMERIC(20,9) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  penalty_check_at TIMESTAMPTZ,
  left_detected_at TIMESTAMPTZ,
  penalty_applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id)
);
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_task_completions_penalty ON public.task_completions(penalty_check_at) WHERE penalty_applied = false;

-- ============ referrals ============
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.tonflow_users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.tonflow_users(id) ON DELETE CASCADE,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  reward_paid NUMERIC(20,9) NOT NULL DEFAULT 0,
  commission_earned NUMERIC(20,9) NOT NULL DEFAULT 0,
  fraud_flag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referred_id)
);
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);

-- ============ promo codes ============
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  reward NUMERIC(20,9) NOT NULL DEFAULT 0.001,
  usage_limit INTEGER NOT NULL DEFAULT 100,
  per_user_limit INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_promo_codes_updated BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.promo_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.tonflow_users(id) ON DELETE CASCADE,
  reward NUMERIC(20,9) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.promo_claims TO service_role;
ALTER TABLE public.promo_claims ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_promo_claims ON public.promo_claims(promo_code_id, user_id);

-- ============ spins ============
CREATE TABLE public.spins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.tonflow_users(id) ON DELETE CASCADE,
  spin_type TEXT NOT NULL,
  reward NUMERIC(20,9) NOT NULL DEFAULT 0,
  is_jackpot BOOLEAN NOT NULL DEFAULT false,
  segment_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.spins TO service_role;
ALTER TABLE public.spins ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_spins_user ON public.spins(user_id, created_at DESC);

-- ============ achievements ============
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  achievement_type TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  tickets INTEGER NOT NULL DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_achievements_updated BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.achievement_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.tonflow_users(id) ON DELETE CASCADE,
  tickets INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (achievement_id, user_id)
);
GRANT ALL ON public.achievement_claims TO service_role;
ALTER TABLE public.achievement_claims ENABLE ROW LEVEL SECURITY;

-- ============ withdrawals ============
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.tonflow_users(id) ON DELETE CASCADE,
  amount NUMERIC(20,9) NOT NULL,
  fee NUMERIC(20,9) NOT NULL DEFAULT 0,
  net_amount NUMERIC(20,9) NOT NULL,
  wallet TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  admin_note TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_withdrawals_updated BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status, created_at DESC);

-- ============ admin logs / notifications ============
CREATE TABLE public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_telegram_id BIGINT NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.tonflow_users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_logs TO service_role;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notification_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.tonflow_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.notification_log TO service_role;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notification_log_user ON public.notification_log(user_id, type, created_at DESC);

-- ============ settings / translations ============
CREATE TABLE public.app_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lang TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lang, key)
);
GRANT ALL ON public.translations TO service_role;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- ============ atomic balance helper ============
CREATE OR REPLACE FUNCTION public.credit_user(_user_id UUID, _amount NUMERIC, _type TEXT, _description TEXT, _metadata JSONB DEFAULT '{}'::jsonb)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _new_balance NUMERIC;
BEGIN
  UPDATE public.tonflow_users
     SET balance = balance + _amount,
         total_earned = total_earned + GREATEST(_amount, 0)
   WHERE id = _user_id
  RETURNING balance INTO _new_balance;
  IF _new_balance IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;
  IF _new_balance < 0 THEN RAISE EXCEPTION 'insufficient_balance'; END IF;
  INSERT INTO public.transactions(user_id, type, amount, description, metadata)
  VALUES (_user_id, _type, _amount, _description, _metadata);
  RETURN _new_balance;
END; $$;
REVOKE ALL ON FUNCTION public.credit_user(UUID, NUMERIC, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_user(UUID, NUMERIC, TEXT, TEXT, JSONB) TO service_role;

-- ============ seed ============
INSERT INTO public.ad_networks(network, title, sort_order) VALUES
  ('adsgram','Adsgram',1),('monetag','Monetag',2),('gigapub','Gigapub',3);

INSERT INTO public.achievements(key, achievement_type, threshold, tickets) VALUES
  ('tasks_3','tasks',3,1),('tasks_5','tasks',5,1),('tasks_10','tasks',10,1),
  ('refs_2','referrals',2,1),('refs_5','referrals',5,1),('refs_10','referrals',10,1);

INSERT INTO public.app_settings(key, value) VALUES
  ('ads', '{"ticket_chance":0.4,"ticket_daily_limit":15}'::jsonb),
  ('daily_reward', '{"enabled":true,"amount":0.0005}'::jsonb),
  ('referral', '{"reward":0.005,"commission_percent":20,"required_tasks":2,"required_ads":2,"block_same_device":true}'::jsonb),
  ('spinner', '{"paid_spin_cost":0.01,"free_spin_enabled":true,"rewards":[{"amount":0.0001,"weight":45},{"amount":0,"weight":30},{"amount":0.003,"weight":15},{"amount":0.005,"weight":6},{"amount":0.01,"weight":3},{"amount":0.05,"weight":0.99},{"amount":0.1,"weight":0.01}]}'::jsonb),
  ('withdrawal', '{"minimum":0.05,"tiers":[{"min":0.05,"fee":0},{"min":0.1,"fee":0.025}]}'::jsonb),
  ('notifications', '{"daily_spin_reminder":true,"new_task_alert":true,"min_hours_between":20}'::jsonb),
  ('publisher', '{"enabled":true,"min_reward":0.005,"min_participants":10}'::jsonb);

INSERT INTO public.promo_codes(code, reward, usage_limit, per_user_limit) VALUES
  ('TONFLOW', 0.002, 1000, 1);

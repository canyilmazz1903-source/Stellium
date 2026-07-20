-- 003: Server-side notification preference mirror (optional analytics/sync).
-- The device remains the source of truth (AsyncStorage); this table lets
-- preferences survive reinstalls once wired.

CREATE TABLE IF NOT EXISTS public.notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_guidance BOOLEAN DEFAULT FALSE NOT NULL,
  planetary_hours JSONB DEFAULT '{}'::jsonb NOT NULL, -- {"Sun":true,...}
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification prefs" ON public.notification_prefs;
CREATE POLICY "Users manage own notification prefs"
ON public.notification_prefs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_notification_prefs ON public.notification_prefs;
CREATE TRIGGER set_updated_at_notification_prefs
BEFORE UPDATE ON public.notification_prefs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

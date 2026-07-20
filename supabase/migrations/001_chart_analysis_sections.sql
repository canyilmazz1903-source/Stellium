-- 001: AI analysis cache table (H2 fix)
-- The app has been writing/reading this table since v1.2.x, but it was never
-- in the schema — every cache call silently failed, so each report regenerated
-- on every open (cost + latency). Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.chart_analysis_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL,           -- profile UUID, or a composite synastry key 'uid_partnerhash'
  analysis_type TEXT NOT NULL,        -- 'natal' | 'transit' | 'synastry' | 'yildizname' | ...
  section_key TEXT NOT NULL DEFAULT 'full_report',
  content JSONB NOT NULL,
  model_version TEXT,
  valid_until TIMESTAMPTZ,            -- H3 fix: transit expires at local end-of-day; natal = NULL (indefinite)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (profile_id, analysis_type, section_key)
);

ALTER TABLE public.chart_analysis_sections ENABLE ROW LEVEL SECURITY;

-- RLS: a row belongs to the user whose uid the profile_id starts with.
-- (Synastry/transit keys embed the uid as prefix: '<uid>' or '<uid>_suffix'.)
DROP POLICY IF EXISTS "Users read own analysis cache" ON public.chart_analysis_sections;
DROP POLICY IF EXISTS "Users write own analysis cache" ON public.chart_analysis_sections;
DROP POLICY IF EXISTS "Users update own analysis cache" ON public.chart_analysis_sections;
DROP POLICY IF EXISTS "Users delete own analysis cache" ON public.chart_analysis_sections;

CREATE POLICY "Users read own analysis cache"
ON public.chart_analysis_sections FOR SELECT
USING (profile_id LIKE auth.uid()::text || '%');

CREATE POLICY "Users write own analysis cache"
ON public.chart_analysis_sections FOR INSERT
WITH CHECK (profile_id LIKE auth.uid()::text || '%');

CREATE POLICY "Users update own analysis cache"
ON public.chart_analysis_sections FOR UPDATE
USING (profile_id LIKE auth.uid()::text || '%')
WITH CHECK (profile_id LIKE auth.uid()::text || '%');

CREATE POLICY "Users delete own analysis cache"
ON public.chart_analysis_sections FOR DELETE
USING (profile_id LIKE auth.uid()::text || '%');

-- updated_at trigger (reuses the function created by the base schema)
DROP TRIGGER IF EXISTS set_updated_at_analysis ON public.chart_analysis_sections;
CREATE TRIGGER set_updated_at_analysis
BEFORE UPDATE ON public.chart_analysis_sections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

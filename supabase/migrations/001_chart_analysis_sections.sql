-- 001: AI analysis cache table (H2 fix) — IDEMPOTENT & self-healing version.
-- Safe to run on a fresh project AND on a project where the table already
-- exists with a different shape (e.g. profile_id created as UUID, which made
-- the LIKE policy fail with "operator does not exist: uuid ~~ text").
-- Run the whole script in the Supabase SQL Editor.

-- 0) updated_at helper (normally created by the base schema; ensure it exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1) Create the table if missing
CREATE TABLE IF NOT EXISTS public.chart_analysis_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL,           -- profile UUID, or composite key '<uid>_syn_x' / '<uid>_yz_x'
  analysis_type TEXT NOT NULL,        -- 'natal' | 'transit' | 'synastry' | 'yildizname' | ...
  section_key TEXT NOT NULL DEFAULT 'full_report',
  content JSONB NOT NULL,
  model_version TEXT,
  valid_until TIMESTAMPTZ,            -- H3 fix: transit expires end-of-day; natal = NULL
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2) Drop ALL existing policies on the table (whatever their names/types),
--    so the column type can be altered freely below.
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chart_analysis_sections'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.chart_analysis_sections', pol.policyname);
  END LOOP;
END $$;

-- 3) Normalize a pre-existing table's shape:
--    profile_id must be TEXT (composite synastry/yıldızname keys need it)
ALTER TABLE public.chart_analysis_sections
  ALTER COLUMN profile_id TYPE TEXT USING profile_id::text;

ALTER TABLE public.chart_analysis_sections
  ADD COLUMN IF NOT EXISTS analysis_type TEXT NOT NULL DEFAULT 'natal';
ALTER TABLE public.chart_analysis_sections
  ADD COLUMN IF NOT EXISTS content JSONB;
ALTER TABLE public.chart_analysis_sections
  ADD COLUMN IF NOT EXISTS section_key TEXT NOT NULL DEFAULT 'full_report';
ALTER TABLE public.chart_analysis_sections
  ADD COLUMN IF NOT EXISTS model_version TEXT;
ALTER TABLE public.chart_analysis_sections
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE public.chart_analysis_sections
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.chart_analysis_sections
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4) Uniqueness for the app's upsert (onConflict: profile_id,analysis_type,section_key)
CREATE UNIQUE INDEX IF NOT EXISTS chart_analysis_sections_upsert_key
  ON public.chart_analysis_sections (profile_id, analysis_type, section_key);

-- 5) RLS with explicit text casts on BOTH sides (works regardless of history)
ALTER TABLE public.chart_analysis_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own analysis cache"
ON public.chart_analysis_sections FOR SELECT
USING (profile_id::text LIKE (auth.uid())::text || '%');

CREATE POLICY "Users write own analysis cache"
ON public.chart_analysis_sections FOR INSERT
WITH CHECK (profile_id::text LIKE (auth.uid())::text || '%');

CREATE POLICY "Users update own analysis cache"
ON public.chart_analysis_sections FOR UPDATE
USING (profile_id::text LIKE (auth.uid())::text || '%')
WITH CHECK (profile_id::text LIKE (auth.uid())::text || '%');

CREATE POLICY "Users delete own analysis cache"
ON public.chart_analysis_sections FOR DELETE
USING (profile_id::text LIKE (auth.uid())::text || '%');

-- 6) updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_analysis ON public.chart_analysis_sections;
CREATE TRIGGER set_updated_at_analysis
BEFORE UPDATE ON public.chart_analysis_sections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

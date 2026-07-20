-- 002: Saved partner charts (synastry partners, family members...)
-- Lets users keep additional people for repeated synastry runs.

CREATE TABLE IF NOT EXISTS public.saved_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME WITHOUT TIME ZONE,
  birth_place TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT,
  relation_label TEXT,                -- 'partner' | 'aile' | 'arkadaş' | serbest metin
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.saved_charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own saved charts" ON public.saved_charts;
CREATE POLICY "Users manage own saved charts"
ON public.saved_charts FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS set_updated_at_saved_charts ON public.saved_charts;
CREATE TRIGGER set_updated_at_saved_charts
BEFORE UPDATE ON public.saved_charts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

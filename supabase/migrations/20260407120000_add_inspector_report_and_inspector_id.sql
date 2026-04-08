-- 2026-04-07: Add inspector_report JSONB and inspector_id FK
-- Adds a JSONB column to store raw structured inspector submissions
-- and an inspector_id referencing public.profiles(user_id)

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inspections' AND column_name='inspector_report'
  ) THEN
    ALTER TABLE public.inspections ADD COLUMN inspector_report JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inspections' AND column_name='inspector_id'
  ) THEN
    ALTER TABLE public.inspections ADD COLUMN inspector_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='fk_inspections_inspector_id'
  ) THEN
    ALTER TABLE public.inspections ADD CONSTRAINT fk_inspections_inspector_id FOREIGN KEY (inspector_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
  END IF;
END
$$;

COMMIT;

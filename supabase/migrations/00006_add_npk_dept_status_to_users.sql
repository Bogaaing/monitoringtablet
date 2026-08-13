-- Migration 00006: Add NPK, Department, and Status columns to users table

-- 1. Add missing columns to public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS npk TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Add Unique constraint on npk
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_npk_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_npk_key UNIQUE (npk);
  END IF;
END $$;

-- 3. Create index for fast NPK lookups
CREATE INDEX IF NOT EXISTS idx_users_npk ON public.users(npk);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- 4. Update existing default seed users with NPK & Department
UPDATE public.users SET npk = '11130595', department = 'IT & Admin' WHERE email = 'admin@monitoring.com' AND npk IS NULL;
UPDATE public.users SET npk = '33350797', department = 'Inspection' WHERE email = 'pic@monitoring.com' AND npk IS NULL;
UPDATE public.users SET npk = '22240696', department = 'Operations' WHERE email = 'manager@monitoring.com' AND npk IS NULL;

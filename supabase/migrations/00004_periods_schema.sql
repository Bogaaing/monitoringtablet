-- Migration 00004: Inspection Period Management Schema & Seeds

-- 1. Extend INSPECTION_PERIODS Table with Status Column
ALTER TABLE public.inspection_periods
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived'));

-- 2. Indexes for Active Period Queries
CREATE INDEX IF NOT EXISTS idx_periods_status ON public.inspection_periods(status);
CREATE INDEX IF NOT EXISTS idx_periods_year_month ON public.inspection_periods(year, month);

-- 3. Seed Initial Periods Data
INSERT INTO public.inspection_periods (id, name, year, month, start_date, end_date, is_active, status)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'Periode Juli 2026', 2026, 7, '2026-07-01', '2026-07-31', false, 'closed'),
  ('p2000000-0000-0000-0000-000000000002', 'Periode Agustus 2026', 2026, 8, '2026-08-01', '2026-08-31', true, 'active'),
  ('p3000000-0000-0000-0000-000000000003', 'Periode September 2026', 2026, 9, '2026-09-01', '2026-09-30', false, 'draft')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  status = EXCLUDED.status,
  updated_at = now();

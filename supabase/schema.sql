-- ==============================================================================
-- MASTER SUPABASE DATABASE INITIALIZATION SCRIPT (Tablet Monitoring System)
-- Run this complete script in Supabase SQL Editor to set up all tables, bucket & seed data.
-- ==============================================================================

-- 1. Enable Extension pgcrypto for password hashing & UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create TABLES
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tablets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code TEXT UNIQUE NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  brand TEXT DEFAULT 'Samsung',
  model TEXT NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  npk TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'pic' CHECK (role IN ('admin', 'pic', 'manager')),
  department TEXT,
  status TEXT DEFAULT 'active',
  phone TEXT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inspection_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES public.inspection_periods(id) ON DELETE CASCADE NOT NULL,
  tablet_id UUID REFERENCES public.tablets(id) ON DELETE CASCADE NOT NULL,
  pic_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  tablet_condition TEXT DEFAULT 'good',
  charger_condition TEXT DEFAULT 'available',
  case_condition TEXT DEFAULT 'good',
  battery_pct INT DEFAULT 100,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  notes TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Schema Migration for Existing Table
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS tablet_condition TEXT DEFAULT 'good';
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS charger_condition TEXT DEFAULT 'available';
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS case_condition TEXT DEFAULT 'good';
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS battery_pct INT DEFAULT 100;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS gps_lat NUMERIC;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS gps_lng NUMERIC;

CREATE TABLE IF NOT EXISTS public.inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('front', 'back', 'screen', 'accessory')),
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-photos',
  'inspection-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tablets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for app queries
CREATE POLICY "Public Full Access users" ON public.users FOR ALL USING (true);
CREATE POLICY "Public Full Access locations" ON public.locations FOR ALL USING (true);
CREATE POLICY "Public Full Access tablets" ON public.tablets FOR ALL USING (true);
CREATE POLICY "Public Full Access periods" ON public.inspection_periods FOR ALL USING (true);
CREATE POLICY "Public Full Access inspections" ON public.inspections FOR ALL USING (true);
CREATE POLICY "Public Full Access photos" ON public.inspection_photos FOR ALL USING (true);

-- Storage Object Policy
CREATE POLICY "Public Read Storage" ON storage.objects FOR SELECT USING (bucket_id = 'inspection-photos');
CREATE POLICY "Public Write Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inspection-photos');

-- 5. SEED USERS into Supabase Auth & public.users (Using valid hex UUIDs)
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin@monitoring.com', crypt('admin123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Super Admin","role":"admin"}', now(), now(), 'authenticated', 'authenticated'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'pic@monitoring.com', crypt('pic123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Ahmad Rizky (PIC)","role":"pic"}', now(), now(), 'authenticated', 'authenticated'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'manager@monitoring.com', crypt('manager123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Bambang Wijaya (Manager)","role":"manager"}', now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Seed Master Locations
INSERT INTO public.locations (id, code, name, address)
VALUES
  ('11000000-0000-0000-0000-000000000001', 'LOC-GZA', 'Gudang Utama A', 'Kawasan Industri Blok A1 No. 5'),
  ('11000000-0000-0000-0000-000000000002', 'LOC-PCK', 'Area Packing 2', 'Gedung Operasional Lantai 1'),
  ('11000000-0000-0000-0000-000000000003', 'LOC-SEC', 'Pos Security Utama', 'Pintu Gerbang Utama Kawasan')
ON CONFLICT (id) DO NOTHING;

-- Seed Master Tablets
INSERT INTO public.tablets (id, qr_code, serial_number, brand, model, location_id, status)
VALUES
  ('21000000-0000-0000-0000-000000000001', 'QR-TAB-001', 'SN-TAB-9901', 'Samsung', 'Galaxy Tab Active 3', '11000000-0000-0000-0000-000000000001', 'active'),
  ('21000000-0000-0000-0000-000000000002', 'QR-TAB-002', 'SN-TAB-9902', 'Apple', 'iPad 10th Gen', '11000000-0000-0000-0000-000000000002', 'active'),
  ('21000000-0000-0000-0000-000000000003', 'QR-TAB-003', 'SN-TAB-9903', 'Lenovo', 'Tab M10 HD', '11000000-0000-0000-0000-000000000003', 'maintenance')
ON CONFLICT (id) DO NOTHING;

-- Seed Public Users
INSERT INTO public.users (id, auth_id, name, email, role, phone, location_id)
VALUES
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Super Admin System', 'admin@monitoring.com', 'admin', '081234567890', NULL),
  ('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Ahmad Rizky (PIC)', 'pic@monitoring.com', 'pic', '081298765432', '11000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Bambang Wijaya (Manager)', 'manager@monitoring.com', 'manager', '081122334455', NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Inspection Periods
INSERT INTO public.inspection_periods (id, name, year, month, start_date, end_date, is_active, status)
VALUES
  ('31000000-0000-0000-0000-000000000001', 'Periode Juli 2026', 2026, 7, '2026-07-01', '2026-07-31', false, 'closed'),
  ('31000000-0000-0000-0000-000000000002', 'Periode Agustus 2026', 2026, 8, '2026-08-01', '2026-08-31', true, 'active'),
  ('31000000-0000-0000-0000-000000000003', 'Periode September 2026', 2026, 9, '2026-09-01', '2026-09-30', false, 'draft')
ON CONFLICT (id) DO NOTHING;

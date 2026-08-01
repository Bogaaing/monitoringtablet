-- Migration 00003: Master Data Extensions & Seed Data

-- 1. Extend LOCATIONS Table
ALTER TABLE public.locations 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Extend TABLETS Table
ALTER TABLE public.tablets 
  ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'Samsung',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Extend USERS Table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 4. Indexes for Soft Delete & Filtering Performance
CREATE INDEX IF NOT EXISTS idx_locations_deleted ON public.locations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tablets_deleted ON public.tablets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON public.users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(location_id);

-- 5. Seed Initial Master Data
-- Insert Locations
INSERT INTO public.locations (id, code, name, address)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'LOC-GZA', 'Gudang Utama A', 'Kawasan Industri Blok A1 No. 5'),
  ('c2000000-0000-0000-0000-000000000002', 'LOC-PCK', 'Area Packing 2', 'Gedung Operasional Lantai 1'),
  ('c3000000-0000-0000-0000-000000000003', 'LOC-SEC', 'Pos Security Utama', 'Pintu Gerbang Utama Kawasan')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  updated_at = now();

-- Insert Tablets
INSERT INTO public.tablets (id, qr_code, serial_number, brand, model, location_id, status)
VALUES
  ('t1000000-0000-0000-0000-000000000001', 'QR-TAB-001', 'SN-TAB-9901', 'Samsung', 'Galaxy Tab Active 3', 'c1000000-0000-0000-0000-000000000001', 'active'),
  ('t2000000-0000-0000-0000-000000000002', 'QR-TAB-002', 'SN-TAB-9902', 'Apple', 'iPad 10th Gen', 'c2000000-0000-0000-0000-000000000002', 'active'),
  ('t3000000-0000-0000-0000-000000000003', 'QR-TAB-003', 'SN-TAB-9903', 'Lenovo', 'Tab M10 HD', 'c3000000-0000-0000-0000-000000000003', 'maintenance')
ON CONFLICT (qr_code) DO UPDATE SET
  serial_number = EXCLUDED.serial_number,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  location_id = EXCLUDED.location_id,
  status = EXCLUDED.status,
  updated_at = now();

-- Update Seed Users with Assigned Locations
UPDATE public.users SET location_id = 'c1000000-0000-0000-0000-000000000001' WHERE email = 'pic@monitoring.com';
UPDATE public.users SET location_id = 'c1000000-0000-0000-0000-000000000001' WHERE email = 'admin@monitoring.com';

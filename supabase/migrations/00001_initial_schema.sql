-- Migration 00001: Initial Schema for Tablet Monitoring System
-- Based on ERD Specification (05_ERD.md)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'pic', 'manager')),
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLETS TABLE
CREATE TABLE IF NOT EXISTS public.tablets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code TEXT UNIQUE NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INSPECTION_PERIODS TABLE
CREATE TABLE IF NOT EXISTS public.inspection_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES public.inspection_periods(id) ON DELETE CASCADE,
    tablet_id UUID NOT NULL REFERENCES public.tablets(id) ON DELETE CASCADE,
    pic_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. INSPECTION_PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.inspection_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('front', 'back', 'screen', 'accessory')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ACTIVITY_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_tablets_location ON public.tablets(location_id);
CREATE INDEX IF NOT EXISTS idx_tablets_qr ON public.tablets(qr_code);
CREATE INDEX IF NOT EXISTS idx_periods_active ON public.inspection_periods(is_active);
CREATE INDEX IF NOT EXISTS idx_inspections_period ON public.inspections(period_id);
CREATE INDEX IF NOT EXISTS idx_inspections_tablet ON public.inspections(tablet_id);
CREATE INDEX IF NOT EXISTS idx_inspections_pic ON public.inspections(pic_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.inspections(status);
CREATE INDEX IF NOT EXISTS idx_photos_inspection ON public.inspection_photos(inspection_id);

-- TRIGGER FOR UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tablets_updated_at BEFORE UPDATE ON public.tablets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_periods_updated_at BEFORE UPDATE ON public.inspection_periods FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tablets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES (AUTHENTICATED USERS ACCESS)
CREATE POLICY "Authenticated users can view users" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full management on users" ON public.users FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Authenticated users can view locations" ON public.locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full management on locations" ON public.locations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Authenticated users can view tablets" ON public.tablets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full management on tablets" ON public.tablets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Authenticated users can view inspection_periods" ON public.inspection_periods FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full management on inspection_periods" ON public.inspection_periods FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Authenticated users can view inspections" ON public.inspections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "PIC create inspections" ON public.inspections FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role IN ('admin', 'pic'))
);
CREATE POLICY "Manager update inspection approval" ON public.inspections FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Authenticated users can view photos" ON public.inspection_photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "PIC upload photos" ON public.inspection_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users view logs" ON public.activity_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

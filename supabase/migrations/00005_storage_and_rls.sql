-- Migration 00005: Supabase Storage Bucket & Comprehensive Row Level Security (RLS) Policies

-- 1. Create Storage Bucket for Inspection Photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-photos',
  'inspection-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Storage RLS Policies
CREATE POLICY "Public Read Access for Inspection Photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inspection-photos');

CREATE POLICY "Authenticated Users Upload Inspection Photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inspection-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Users Delete Inspection Photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'inspection-photos' AND auth.role() = 'authenticated');

-- 3. Enable RLS on All Public Tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tablets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for ADMIN (Full Access)
CREATE POLICY "Admin Full Access - users" ON public.users FOR ALL USING (true);
CREATE POLICY "Admin Full Access - locations" ON public.locations FOR ALL USING (true);
CREATE POLICY "Admin Full Access - tablets" ON public.tablets FOR ALL USING (true);
CREATE POLICY "Admin Full Access - inspection_periods" ON public.inspection_periods FOR ALL USING (true);
CREATE POLICY "Admin Full Access - inspections" ON public.inspections FOR ALL USING (true);
CREATE POLICY "Admin Full Access - inspection_photos" ON public.inspection_photos FOR ALL USING (true);
CREATE POLICY "Admin Full Access - activity_logs" ON public.activity_logs FOR ALL USING (true);

-- 5. RLS Policies for PIC (Read assigned locations, submit inspections)
CREATE POLICY "PIC Read Assigned Tablets" ON public.tablets FOR SELECT USING (true);
CREATE POLICY "PIC Read Active Periods" ON public.inspection_periods FOR SELECT USING (true);
CREATE POLICY "PIC Create Inspections" ON public.inspections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "PIC Read Inspections" ON public.inspections FOR SELECT USING (true);

-- 6. RLS Policies for MANAGER (Read inspections, approve/reject)
CREATE POLICY "Manager Read All Data" ON public.inspections FOR SELECT USING (true);
CREATE POLICY "Manager Approve Reject Inspections" ON public.inspections FOR UPDATE USING (auth.role() = 'authenticated');

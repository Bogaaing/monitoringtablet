-- Migration 00008: Audit and Helper View for User & Tablet Mapping (Pemetaan User & Tablet)
-- System: TabMonitor (PT. Propan Raya ICC)
-- Menu: Master Penugasan Tablet - Super Admin

-- ==============================================================================
-- 1. RELATIONAL AUDIT DOCUMENTATION
-- ==============================================================================
-- - Master Tablet: `public.tablets`
--   Menyimpan data unit device tablet (id, qr_code, serial_number, brand, model, location_id, status).
-- - Master User: `public.users`
--   Menyimpan identitas pengguna (id, npk, name, email, role, department, location_id, status).
-- - Master Lokasi: `public.locations`
--   Menyimpan lokasi penempatan operasional pabrik/kantor (id, code, name, address).
-- 
-- HUBUNGAN PENUGASAN:
-- Sesuai arsitektur operasional TabMonitor (referensi commit 5f927a2 & pic tasks flow):
-- Tablet ditugaskan dan ditempatkan pada area kerja tertentu via `tablets.location_id`.
-- User PIC (Kepala Regu) ditugaskan mengelola area penempatan via `users.location_id`.
-- Hubungan antara user penanggung jawab dan unit tablet terjalin melalui kesamaan lokasi penugasan:
--   `users.location_id = tablets.location_id`
-- Dengan demikian, tidak diperlukan pembuatan tabel baru atau modifikasi data lama yang berisiko merusak alur inspeksi.

-- ==============================================================================
-- 2. HELPER VIEW: v_user_tablet_mapping
-- ==============================================================================
CREATE OR REPLACE VIEW public.v_user_tablet_mapping AS
SELECT
  t.id AS tablet_id,
  t.qr_code,
  t.serial_number,
  COALESCE(t.brand, 'Samsung') AS brand,
  t.model,
  t.status AS tablet_status,
  t.location_id,
  l.code AS location_code,
  l.name AS location_name,
  u.id AS user_id,
  u.npk AS user_npk,
  u.name AS user_name,
  u.email AS user_email,
  u.role AS user_role,
  u.department AS user_department,
  CASE WHEN u.id IS NOT NULL THEN true ELSE false END AS has_user,
  CASE WHEN t.location_id IS NOT NULL THEN true ELSE false END AS has_location
FROM public.tablets t
LEFT JOIN public.locations l ON t.location_id = l.id AND l.deleted_at IS NULL
LEFT JOIN public.users u ON u.location_id = t.location_id 
  AND u.status = 'active' 
  AND u.deleted_at IS NULL 
  AND u.role = 'pic'
WHERE t.deleted_at IS NULL;

-- Grant permissions for authenticated and service roles
GRANT SELECT ON public.v_user_tablet_mapping TO authenticated;
GRANT SELECT ON public.v_user_tablet_mapping TO service_role;

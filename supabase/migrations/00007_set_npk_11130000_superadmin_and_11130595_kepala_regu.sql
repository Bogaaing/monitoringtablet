-- Migration 00007: Set NPK 11130000 as Super Admin and NPK 11130595 as Kepala Regu (PIC)

-- 1. Ensure NPK 11130000 is the sole active Super Admin
UPDATE public.users
SET
  role = 'admin',
  status = 'active',
  deleted_at = NULL,
  updated_at = NOW()
WHERE npk = '11130000';

-- 2. Ensure NPK 11130595 is Kepala Regu (role 'pic') with Super Admin rights revoked
UPDATE public.users
SET
  role = 'pic',
  status = 'active',
  deleted_at = NULL,
  updated_at = NOW()
WHERE npk = '11130595';

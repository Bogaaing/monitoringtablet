-- Migration 00002: Auth User Sync Trigger & Role Seed Data

-- 1. Function to handle new user insertion from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'pic'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Initial Seed Accounts for Development & Testing
INSERT INTO public.users (id, name, email, role, phone)
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'Super Admin System', 'admin@monitoring.com', 'admin', '081234567890'),
  ('20000000-0000-0000-0000-000000000002', 'Ahmad Rizky (PIC)', 'pic@monitoring.com', 'pic', '081298765432'),
  ('30000000-0000-0000-0000-000000000003', 'Bambang Wijaya (Manager)', 'manager@monitoring.com', 'manager', '081122334455')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now();

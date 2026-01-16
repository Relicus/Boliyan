-- Manually insert the 3 mock users into AUTH.USERS
-- IDs must match the logic in MigrateButton.tsx (padded UUIDs used for u1, u2, u3)

-- 1. Mock User: u1 (Ahmed Ali)
INSERT INTO auth.users (id, aud, role, email, email_confirmed_at)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'authenticated', 
  'authenticated', 
  'u1@demo.com', 
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Mock User: u2 (Sara Khan)
INSERT INTO auth.users (id, aud, role, email, email_confirmed_at)
VALUES (
  '00000000-0000-0000-0000-000000000002', 
  'authenticated', 
  'authenticated', 
  'u2@demo.com', 
  now()
) ON CONFLICT (id) DO NOTHING;

-- 3. Mock User: u3 (Zain Malik)
INSERT INTO auth.users (id, aud, role, email, email_confirmed_at)
VALUES (
  '00000000-0000-0000-0000-000000000003', 
  'authenticated', 
  'authenticated', 
  'u3@demo.com', 
  now()
) ON CONFLICT (id) DO NOTHING;

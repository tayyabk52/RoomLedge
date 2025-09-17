-- Database Cleanup Script
-- Run this if you encounter profile-related issues

-- Check for duplicate profiles
SELECT id, full_name, created_at, COUNT(*) as count
FROM profiles
GROUP BY id, full_name, created_at
HAVING COUNT(*) > 1;

-- Check profiles without corresponding auth users
SELECT p.id, p.full_name
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Check auth users without profiles
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Clean up duplicate profiles (keeps the earliest created one)
DELETE FROM profiles
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at ASC) as rn
    FROM profiles
  ) ranked
  WHERE rn > 1
);

-- Recreate missing profiles for existing auth users
INSERT INTO profiles (id, full_name, avatar_url, created_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Verify the fix
SELECT 'Profiles count:' as check_type, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Auth users count:' as check_type, COUNT(*) as count FROM auth.users;

COMMIT;
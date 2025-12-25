-- ============================================================================
-- LIST ADMIN ACCOUNTS
-- ============================================================================
-- Run this in Supabase SQL Editor to see all admin accounts
-- ============================================================================

-- Check Supabase Auth users (if using Supabase authentication)
-- Note: This may not work if RLS is enabled, run as service_role
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data->>'user_type' as user_type,
    raw_user_meta_data->>'role' as role
FROM auth.users
WHERE 
    email LIKE '%admin%' 
    OR raw_user_meta_data->>'user_type' = 'admin'
    OR raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at DESC;

-- Check custom users table (if you have one)
-- Uncomment and run if you have a users table:
-- SELECT 
--     id,
--     email,
--     tier,
--     created_at,
--     last_login
-- FROM users
-- WHERE tier = 'admin' OR tier = 'ADMIN'
-- ORDER BY created_at DESC;

-- ============================================================================
-- ALTERNATIVE: Check for admin accounts via metadata
-- ============================================================================

-- If admin status is stored in user metadata
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users
WHERE raw_user_meta_data IS NOT NULL
ORDER BY created_at DESC;


-- Fix the INSERT policy for users table to prevent infinite recursion

-- Drop the broken INSERT policy
DROP POLICY IF EXISTS "authenticated_users_insert_own_profile" ON public.users;

-- Create a new INSERT policy with proper WITH CHECK clause
CREATE POLICY "authenticated_users_insert_own_profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Verify the policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd;

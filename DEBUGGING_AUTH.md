# Debugging Authentication Issues

## Current Status

✅ Database tables exist
✅ RLS policies exist
✅ Frontend code updated to use direct INSERT
✅ Supabase credentials configured

❌ Signup/Login still showing infinite loading

---

## How to Debug

### Step 1: Open Browser Console

1. Go to http://localhost:5173
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Keep this open while testing

### Step 2: Try to Sign Up

1. Fill in the signup form with:
   - Full Name: Test User
   - Email: test@example.com
   - Phone: 0123456789
   - Account Type: Vendor
   - Password: password123
   - Confirm Password: password123

2. Click "Sign up"

3. Watch the console for messages like:
   - "Creating user profile for: [user-id]"
   - "Profile created successfully: [profile-data]"
   - "User:", "Profile:", "Loading:" messages
   - Any red error messages

### Step 3: Check for Specific Errors

Look for these specific error messages in the console:

#### Error: "new row violates row-level security policy"
**Solution**: The user ID from Supabase auth doesn't match. This shouldn't happen with our code.

#### Error: "duplicate key value violates unique constraint"
**Solution**: User already exists. Try a different email.

#### Error: "Failed to create user profile"
**Solution**: Check the detailed error in console. May be RLS issue.

#### Error: "Invalid login credentials"
**Solution**: For login - wrong email/password

### Step 4: Check Supabase Dashboard

1. Go to your Supabase Dashboard
2. Click **Authentication** → **Users**
3. Check if users are being created there
4. Click **Table Editor** → **users** table
5. Check if profiles are being created

---

## Common Issues & Solutions

### Issue 1: Button stuck on "Signing in..." / "Creating account..."

**What's happening**: The signup/login request is hanging

**Check**:
1. Open browser Network tab (F12 → Network)
2. Try to sign up
3. Look for failed requests (red color)
4. Click on them to see the error

**Solution**:
- If no network requests appear → JavaScript error (check Console)
- If request is pending forever → Backend/Supabase issue
- If request fails with error → Check the error message

### Issue 2: User created in Auth but not in users table

**What's happening**: Supabase auth user created, but profile insert failed

**Check Supabase Dashboard**:
1. Authentication → Users (should show the user)
2. Table Editor → users (should be empty or not have this user)

**Solution**: RLS policy blocking the insert. Run this in Supabase SQL Editor:

```sql
-- Check if the insert policy exists
SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname = 'Anyone can create user profile';

-- If it doesn't exist, create it:
CREATE POLICY "Anyone can create user profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Issue 3: Profile loads but doesn't redirect

**What's happening**: User and profile exist, but useEffect doesn't redirect

**Check Console**: Should see messages like:
- "User: {user object}"
- "Profile: {profile object}"
- "Loading: false"

**Solution**: The useEffect should trigger. If not, there might be a React rendering issue. Try:
1. Refresh the page (F5)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try in incognito/private window

---

## Manual Test in Supabase SQL Editor

If all else fails, test if you can insert manually:

```sql
-- Get a test user ID (create one in Auth first via the app)
SELECT id, email FROM auth.users LIMIT 1;

-- Try to insert a profile with that ID
INSERT INTO public.users (id, email, full_name, phone, role)
VALUES (
  'paste-user-id-here',
  'test@example.com',
  'Test User',
  '0123456789',
  'customer'
);
```

If this fails, the RLS policy is the problem.
If this works, the frontend code has an issue.

---

## What to Send Me

If it's still not working, send me:

1. **Screenshot of browser console** (F12 → Console tab) after trying to sign up
2. **Screenshot of Network tab** (F12 → Network) showing any failed requests
3. **Error message** shown in the red box on the signup form
4. Screenshot of Supabase **Table Editor → users** table

This will help me pinpoint the exact issue!

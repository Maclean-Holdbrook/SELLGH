# Commission Data Sync Fix

## Problem Identified

**Issue:** Platform commission showed on the main dashboard but not in the withdrawals section, making the "New Withdrawal" button disabled.

**Root Cause:** Data source mismatch:
- **Dashboard**: Calculated commission directly from orders (`totalRevenue * 0.05`) in frontend
- **Withdrawals**: Fetched commission from `commissions` table via backend API

This created a discrepancy where the dashboard showed commission but the withdrawals page showed GHS 0.00.

## Solution Applied

### 1. Unified Data Source ✅

**Changed:** AdminDashboard now fetches platform commission from the same backend API as the withdrawals page.

**File:** `src/pages/admin/AdminDashboard.jsx`

**What changed:**
```javascript
// BEFORE: Frontend calculation only
const platformCommission = totalRevenue * 0.05;

// AFTER: Fetch from backend API (same as withdrawals)
const balanceResponse = await fetch(`${API_URL}/admin/balance`, {
  headers: { Authorization: `Bearer ${token}` }
});
const balanceData = await balanceResponse.json();
if (balanceData.success) {
  platformCommission = balanceData.data.total_commission;
  availableBalance = balanceData.data.available_balance;
}
```

### 2. Added "Available to Withdraw" Card ✅

**Added:** New stat card on dashboard showing exactly how much can be withdrawn right now.

**Benefits:**
- Shows available balance at a glance
- Direct link to withdrawals page
- Matches the same balance shown in withdrawals section

### 3. Improved Dashboard Layout ✅

**Changed:** Split stats into two rows:
- **Row 1:** Basic stats (Vendors, Products, Orders, Pending Approvals)
- **Row 2:** Financial stats (Total Revenue, Platform Commission, Available to Withdraw)

**Visual improvements:**
- Financial cards stand out with colored backgrounds
- Quick links to relevant sections
- Consistent data across all admin pages

## How It Works Now

### Data Flow

1. **Order Payment Webhook** → Creates commission record in database
   ```sql
   INSERT INTO commissions (
     order_id, vendor_id, order_total,
     vendor_amount, platform_commission, status
   )
   ```

2. **Backend API** (`/api/admin/balance`) → Calculates from `commissions` table
   ```javascript
   total_commission = SUM(platform_commission)
   available_balance = total_commission - completed_withdrawals - pending_withdrawals
   ```

3. **Both Dashboard & Withdrawals** → Use same backend API
   - Dashboard shows: Platform Commission + Available Balance
   - Withdrawals shows: Same data in detailed cards
   - **Result:** Numbers always match!

### Commission Record Creation

Commissions are automatically created when:
1. Customer completes payment (Paystack webhook)
2. Payment status = "success"
3. Order status updated to "paid"
4. Commission record inserted for each vendor in the order

**Commission Split:**
- Vendor gets: 95% of their order items
- Platform gets: 5% commission
- Status: `pending` (until vendor is paid out)

## Testing the Fix

### Step 1: Verify Commission Records Exist

```sql
-- Check if commissions are being created
SELECT
  COUNT(*) as total_commissions,
  SUM(platform_commission) as total_platform_commission,
  SUM(CASE WHEN status = 'pending' THEN platform_commission ELSE 0 END) as pending_commission
FROM commissions;
```

### Step 2: Check Dashboard

1. Go to `/sellgh-admin/dashboard`
2. Look at financial stats row (bottom row)
3. You should see:
   - **Total Revenue**: Sum of all paid orders
   - **Platform Commission (5%)**: Total commission earned
   - **Available to Withdraw**: Amount you can withdraw now

### Step 3: Verify Withdrawals Match

1. Click "Withdraw Now →" or go to `/sellgh-admin/withdrawals`
2. Check balance cards:
   - **Total Commission**: Should match dashboard
   - **Available Balance**: Should match dashboard
3. If Available Balance > 0, "New Withdrawal" button should be **green and clickable**

### Step 4: Test Withdrawal

1. Click "New Withdrawal" button
2. Modal should open
3. Fill in withdrawal details
4. Submit → Creates pending withdrawal
5. Dashboard balance should update immediately

## If Commission Still Shows 0

### Possible Causes:

1. **No paid orders yet**
   - Create test orders and mark as paid
   - Or run the test commission script

2. **Commission records not created**
   - Check payment webhook is working
   - Verify `commissions` table exists
   - Check backend logs for errors

3. **API endpoint failing**
   - Check browser console for errors
   - Verify authentication token is valid
   - Check backend is running

### Quick Fix: Add Test Commission

```sql
-- Run this in Supabase SQL Editor
INSERT INTO commissions (
  order_id,
  vendor_id,
  order_total,
  vendor_amount,
  platform_commission,
  status
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM vendors LIMIT 1),
  1000.00,
  950.00,
  50.00,
  'pending'
);
```

Refresh dashboard → Should now show GHS 50.00 commission and available balance.

## Benefits of This Fix

✅ **Consistent Data**: All pages show same commission amounts
✅ **Real-time Updates**: Balance updates when withdrawals are made
✅ **Accurate Tracking**: Based on actual database records, not calculations
✅ **Better UX**: Clear visibility of available funds
✅ **Quick Access**: Direct links from dashboard to withdrawals

## Files Changed

1. `src/pages/admin/AdminDashboard.jsx`
   - Fetch commission from backend API
   - Added available balance card
   - Improved layout with financial stats row
   - Added quick links to withdrawals

## Related Files

- `src/pages/admin/AdminWithdrawals.jsx` - Uses same backend API
- `src/controllers/payoutController.js` - Backend API implementation
- `src/controllers/paymentController.js` - Creates commission records
- `database/create_platform_withdrawals.sql` - Database schema

---

**Status:** ✅ Fixed and Tested
**Date:** December 3, 2025
**Impact:** Dashboard and Withdrawals now show matching commission data

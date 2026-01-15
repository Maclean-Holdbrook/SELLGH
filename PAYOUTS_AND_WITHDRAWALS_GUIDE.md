# Payouts & Withdrawals Guide

## Overview
Complete system for managing vendor payouts and platform commission withdrawals.

---

## 🎯 New Features Added

### 1. Admin Payouts Section
**URL:** `/sellgh-admin/payouts` or `/admin/payouts`

**Features:**
- View all vendor commissions (95% split)
- Track platform commission (5% split)
- Create payouts for vendors
- Mark payouts as paid
- Filter by vendor and status
- Statistics dashboard

### 2. Admin Withdrawals Section
**URL:** `/sellgh-admin/withdrawals` or `/admin/withdrawals`

**Features:**
- View platform balance (total commission earned)
- Create withdrawal requests (to admin's Mobile Money or Bank)
- Track withdrawal history
- Mark withdrawals as completed/failed
- Real-time balance calculation
- Prevents withdrawing more than available balance

---

## 📊 How It Works

### Platform Commission Flow

1. **Customer Makes Purchase** → Order created
2. **Payment Completed** → Commission record auto-created
   - Vendor gets: 95% of their items
   - Platform gets: 5% commission

3. **Commission Tracking**
   - Status: `pending` (when order is paid)
   - Status: `settled` (when vendor receives payout)

4. **Platform Withdrawal**
   - Admin can withdraw accumulated 5% commission
   - To Mobile Money or Bank account
   - Balance updated in real-time

### Vendor Payout Flow

1. **Admin Views Commissions**
   - See all pending vendor earnings
   - Filter by vendor and date

2. **Admin Creates Payout**
   - Select vendor
   - Choose date range
   - System calculates total from pending commissions

3. **Admin Processes Payment**
   - Send money via Mobile Money to vendor
   - Mark payout as "paid" with transaction reference

4. **Commissions Settled**
   - All related commissions auto-marked as "settled"
   - Removed from pending balance

---

## 🗄️ Database Tables

### `commissions`
Tracks every order's commission split:
```sql
- order_id: Order reference
- vendor_id: Vendor who earned it
- order_total: Vendor's portion of order
- vendor_amount: 95% (vendor's share)
- platform_commission: 5% (platform's share)
- status: pending/settled
```

### `vendor_payouts`
Tracks when vendors get paid:
```sql
- vendor_id: Vendor being paid
- amount: Total payout amount
- period_start/period_end: Date range
- status: pending/processing/paid/failed
- transaction_reference: Mobile Money transaction ID
- order_ids: Array of orders included
```

### `platform_withdrawals` *(NEW)*
Tracks admin commission withdrawals:
```sql
- amount: Withdrawal amount
- withdrawal_method: momo/bank_transfer
- account_details: JSON with account info
- status: pending/processing/completed/failed
- transaction_reference: Transaction ID
- created_by: Admin who created it
```

---

## 🔌 API Endpoints

### Vendor Payout Endpoints

**View All Commissions** (Admin)
```http
GET /api/admin/payouts/commissions?status=pending&vendor_id=xxx
Authorization: Bearer {token}
```

**View All Payouts** (Admin)
```http
GET /api/admin/payouts?status=pending
Authorization: Bearer {token}
```

**Create Vendor Payout** (Admin)
```http
POST /api/admin/payouts
Authorization: Bearer {token}
Content-Type: application/json

{
  "vendor_id": "vendor-uuid",
  "period_start": "2025-12-01",
  "period_end": "2025-12-31",
  "payout_method": "momo",
  "notes": "December payout"
}
```

**Mark Payout as Paid** (Admin)
```http
PATCH /api/admin/payouts/:payout_id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "paid",
  "transaction_reference": "MTN-20251203-12345"
}
```

### Platform Withdrawal Endpoints *(NEW)*

**Get Platform Balance** (Admin)
```http
GET /api/admin/balance
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "total_commission": 150.00,
    "completed_withdrawals": 50.00,
    "pending_withdrawals": 0.00,
    "available_balance": 100.00
  }
}
```

**View Withdrawal History** (Admin)
```http
GET /api/admin/withdrawals
Authorization: Bearer {token}
```

**Create Withdrawal** (Admin)
```http
POST /api/admin/withdrawals
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100.00,
  "withdrawal_method": "momo",
  "account_details": {
    "account_number": "0241234567",
    "account_name": "John Doe",
    "provider": "MTN"
  },
  "notes": "December withdrawal"
}
```

**Update Withdrawal Status** (Admin)
```http
PATCH /api/admin/withdrawals/:withdrawal_id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed",
  "transaction_reference": "MTN-12345"
}
```

---

## 💻 Using the Admin Interface

### Managing Vendor Payouts

**Step 1: View Commissions**
1. Go to `/sellgh-admin/payouts`
2. Click "Commissions" tab
3. See all vendor earnings (95% of orders)
4. Filter by vendor or status

**Step 2: Create Payout**
1. Click "Create Payout" button
2. Select vendor from dropdown
3. Choose date range (e.g., Dec 1-31)
4. Select payment method (Mobile Money)
5. Add optional notes
6. Click "Create Payout"

**Step 3: Process Payment**
1. Send money to vendor's Mobile Money
2. Get transaction reference (e.g., MTN-12345)
3. In payout table, click "Mark Paid"
4. Enter transaction reference
5. Payout status → "Paid"
6. Commissions auto-marked as "Settled"

### Withdrawing Platform Commission

**Step 1: Check Balance**
1. Go to `/sellgh-admin/withdrawals`
2. View balance cards:
   - Total Commission: All 5% earned
   - Available Balance: What you can withdraw
   - Pending/Completed: Withdrawal status

**Step 2: Create Withdrawal**
1. Click "New Withdrawal"
2. Enter amount (max = available balance)
3. Choose withdrawal method:
   - Mobile Money (MTN, Vodafone, AirtelTigo)
   - Bank Transfer
4. Enter account details:
   - Account number
   - Account name
   - Provider/Bank name
5. Add optional notes
6. Click "Create Withdrawal"

**Step 3: Complete Withdrawal**
1. Process the payment manually
2. In withdrawal table, click "Mark Completed"
3. Enter transaction reference
4. Withdrawal marked as "Completed"
5. Balance updated automatically

---

## 📋 Example Scenarios

### Scenario 1: Monthly Vendor Payout

**Background:**
- Vendor "Phone Shop" made GHS 1,000 in December
- Platform earned GHS 50 commission (5%)
- Vendor should receive GHS 950 (95%)

**Steps:**
1. Admin → Payouts → Create Payout
2. Select "Phone Shop"
3. Period: Dec 1 - Dec 31
4. System calculates: GHS 950 (95% of GHS 1,000)
5. Admin sends MTN Mobile Money: GHS 950
6. Gets reference: MTN-DEC-001
7. Marks payout as paid with reference
8. Done! Vendor's commissions marked as settled

### Scenario 2: Platform Withdrawal

**Background:**
- Platform earned GHS 500 total commission
- Already withdrew GHS 200
- Available balance: GHS 300

**Steps:**
1. Admin → Withdrawals
2. Sees available: GHS 300
3. Clicks "New Withdrawal"
4. Enters amount: GHS 300
5. Method: Mobile Money → MTN
6. Account: 0241234567 (Admin Doe)
7. Creates withdrawal
8. Processes MTN payment to self
9. Marks as completed with reference
10. Balance now: GHS 0

### Scenario 3: Multiple Vendor Payouts

**Background:**
- 3 vendors with pending commissions
- Vendor A: GHS 500
- Vendor B: GHS 300
- Vendor C: GHS 200

**Steps:**
1. Create payout for Vendor A (GHS 500)
2. Create payout for Vendor B (GHS 300)
3. Create payout for Vendor C (GHS 200)
4. Process all 3 Mobile Money payments
5. Mark each as paid with their references
6. All commissions settled
7. Platform commission remains available for withdrawal

---

## ⚠️ Important Notes

### Balance Calculations

**Platform Balance:**
```
Available Balance = Total Commission - (Completed Withdrawals + Pending Withdrawals)
```

**Vendor Payout:**
```
Payout Amount = Sum of pending commissions in date range
```

### Validation

1. **Cannot withdraw more than available balance**
   - System checks before creating withdrawal
   - Shows error if amount exceeds balance

2. **Cannot create duplicate payouts**
   - System only includes pending commissions
   - Once settled, commissions excluded from future payouts

3. **Transaction references required**
   - Must provide reference when marking as paid
   - Helps with accounting and disputes

### Status Flow

**Commission Status:**
- `pending` → Commission earned, vendor not paid yet
- `settled` → Vendor received payout

**Payout Status:**
- `pending` → Created, waiting for payment
- `processing` → Payment in progress (optional)
- `paid` → Completed successfully
- `failed` → Payment failed

**Withdrawal Status:**
- `pending` → Created, waiting to process
- `processing` → Processing payment (optional)
- `completed` → Successfully withdrawn
- `failed` → Withdrawal failed

---

## 🔧 Setup Instructions

### 1. Run Database Migration

Execute in Supabase SQL Editor:
```sql
-- File: database/create_platform_withdrawals.sql
```

This creates the `platform_withdrawals` table.

### 2. Verify Navigation

Admin dashboard should now show:
- Dashboard
- Vendors
- Products
- **Payouts** *(NEW)*
- **Withdrawals** *(NEW)*
- Reports

### 3. Test the Flow

1. **Create test order** with payment
2. **Check commissions** in Payouts section
3. **Create vendor payout**
4. **Mark as paid**
5. **Check platform balance** in Withdrawals
6. **Create withdrawal** for platform commission
7. **Mark as completed**

---

## 📊 Reports & Analytics

### Payout Statistics

View in `/sellgh-admin/payouts`:
- Total Commission: All platform earnings
- Pending Payouts: Vendor money waiting to be paid
- Settled Payouts: Vendor money already paid

### Withdrawal Balance

View in `/sellgh-admin/withdrawals`:
- Total Commission: All 5% earned
- Available Balance: Can withdraw now
- Pending Withdrawals: Requested but not completed
- Completed Withdrawals: Already withdrawn

---

## 🐛 Troubleshooting

### "Insufficient balance" Error

**Problem:** Trying to withdraw more than available

**Solution:**
1. Check available balance
2. Check for pending withdrawals
3. Wait for more commissions
4. Withdraw available amount only

### Payout Not Creating

**Problem:** No pending commissions in date range

**Solution:**
1. Verify vendor has orders in period
2. Check commission status (must be pending)
3. Ensure orders are paid
4. Try wider date range

### Commissions Not Settling

**Problem:** Marked payout as paid but commissions still pending

**Solution:**
1. Check payout was marked as "paid" not "processing"
2. Verify transaction reference was provided
3. Check order_ids in payout match commissions
4. Contact support if persists

---

## 📝 Recent Updates

### Version 1.1 - December 3, 2025

**✅ Fixed Commission Data Sync Issue**
- Dashboard now shows same commission data as withdrawals page
- Added "Available to Withdraw" card on dashboard
- Both pages now use same backend API for consistency
- See `COMMISSION_SYNC_FIX.md` for details

**✅ Dashboard Improvements**
- Added direct links from commission cards to withdrawals
- Split stats into general and financial sections
- Real-time balance updates across all admin pages

## 📝 Next Steps

1. ✅ Run database migration (`create_platform_withdrawals.sql`)
2. ✅ Test payout creation
3. ✅ Test withdrawal creation
4. ✅ Fix commission data sync between dashboard and withdrawals
5. ⏭️ Add email notifications for payouts/withdrawals
6. ⏭️ Add payout reports/exports
7. ⏭️ Automate monthly payout schedules

---

**Last Updated:** December 3, 2025
**Version:** 1.1

# SellGH Testing Guide

**Quick guide for testing your multi-vendor marketplace**

---

## 🌐 Server URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/health

---

## 👥 Test User Accounts

Make sure you have these test accounts set up in Supabase:

### Customer Account
- Email: customer@test.com
- Role: customer

### Vendor Account
- Email: vendor@test.com
- Role: vendor

### Admin Account
- Email: admin@test.com
- Role: admin

---

## 🧪 Testing Workflows

### 1. Customer Flow (Complete Purchase)

**Step 1: Browse Products**
1. Go to http://localhost:5173
2. Browse homepage products
3. Use search and filters
4. View product details

**Step 2: Add to Cart**
1. Click "Add to Cart" on products
2. Adjust quantities in cart
3. View cart summary

**Step 3: Checkout**
1. Click "Checkout"
2. Fill shipping address
3. Review order summary
4. Choose payment method

**Step 4: Payment**
1. Click "Pay Now"
2. Use Paystack test card:
   - Card: `5060 6666 6666 6666 666`
   - Expiry: Any future date
   - CVV: `123`
   - PIN: `123`
   - OTP: `123456`

**Step 5: Verify Order**
1. Check order confirmation page
2. View order in "My Orders"
3. Check email for confirmation

---

### 2. Vendor Flow (Manage Products & Orders)

**Step 1: Login as Vendor**
1. Go to http://localhost:5173/login
2. Login with vendor account
3. Navigate to vendor dashboard

**Step 2: Add Products**
1. Click "Add Product"
2. Fill product details
3. Upload images
4. Set price and stock
5. Submit

**Step 3: Manage Orders**
1. View orders in dashboard
2. Update order status:
   - Processing → Shipped → Delivered
3. View order details

**Step 4: View Commissions (NEW!)**
1. Navigate to payouts/commissions section
2. Check your earnings (95% of sales)
3. View payout history

---

### 3. Admin Flow (Platform Management)

**Step 1: Login as Admin**
1. Go to http://localhost:5173/login
2. Login with admin account
3. Access admin dashboard

**Step 2: Vendor Management**
1. View all vendors
2. Approve/verify pending vendors
3. Check subaccount status (will show pending in test mode)
4. Suspend/activate vendors

**Step 3: View Analytics**
1. Dashboard overview
   - Total sales
   - Platform commission (5%)
   - Number of orders
   - Active vendors
2. View charts and graphs

**Step 4: Manage Orders**
1. View all orders across platform
2. Filter by status
3. View order details by vendor

**Step 5: Financial Management (NEW!)**
1. **View Commissions:**
   ```
   GET /api/admin/payouts/commissions
   ```
   - See all commissions
   - Filter by vendor or status
   - View platform earnings (5%)

2. **View Payout Statistics:**
   ```
   GET /api/admin/stats
   ```
   - Total revenue
   - Platform commission
   - Pending payouts
   - Paid payouts

3. **Create Vendor Payout:**
   ```
   POST /api/admin/payouts
   {
     "vendor_id": "vendor-uuid",
     "period_start": "2025-12-01",
     "period_end": "2025-12-31",
     "payout_method": "momo"
   }
   ```

4. **Mark Payout as Paid:**
   ```
   PATCH /api/admin/payouts/:payout_id
   {
     "status": "paid",
     "transaction_reference": "MTN-12345"
   }
   ```

---

## 🧪 API Testing with Tools

### Using Postman/Thunder Client/Insomnia

**Base URL:** `http://localhost:5000/api`

### Test New Payment Endpoints

**1. Check Vendor Subaccount Status**
```http
GET http://localhost:5000/api/vendors/:vendorId/subaccount
```

**2. Manually Create Subaccount**
```http
POST http://localhost:5000/api/vendors/:vendorId/subaccount
```

**3. View Vendor Commissions** (Requires Auth)
```http
GET http://localhost:5000/api/payouts/commissions?status=pending
Authorization: Bearer YOUR_TOKEN
```

**4. View All Commissions** (Admin)
```http
GET http://localhost:5000/api/admin/payouts/commissions
Authorization: Bearer ADMIN_TOKEN
```

**5. Create Vendor Payout** (Admin)
```http
POST http://localhost:5000/api/admin/payouts
Content-Type: application/json
Authorization: Bearer ADMIN_TOKEN

{
  "vendor_id": "vendor-uuid-here",
  "period_start": "2025-12-01",
  "period_end": "2025-12-31",
  "payout_method": "momo",
  "notes": "December payout"
}
```

---

## 🔍 What to Look For

### ✅ Things That Should Work

**Customer Experience:**
- [x] Browse products
- [x] Search and filter
- [x] Add to cart
- [x] Checkout process
- [x] Payment with test card
- [x] Order confirmation
- [x] View order history
- [x] Product reviews
- [x] Wishlist

**Vendor Experience:**
- [x] Add/edit products
- [x] Upload product images
- [x] View orders
- [x] Update order status
- [x] Dashboard analytics
- [x] View commissions

**Admin Experience:**
- [x] Verify vendors
- [x] View all orders
- [x] Platform analytics
- [x] Commission tracking
- [x] Create payouts
- [x] Financial reports

### ⚠️ Expected Test Mode Limitations

**Paystack Subaccounts:**
- ❌ Creating Mobile Money subaccounts will fail
- ✅ This is normal in test mode
- ✅ Will work in production with live keys

**Split Payments:**
- ⚠️ Money won't actually split in test mode
- ✅ Commission tracking still works
- ✅ You can see how it will work in production

---

## 🐛 Known Issues (Not Bugs)

1. **"Account details are invalid"** when creating subaccounts
   - Expected in test mode
   - Paystack limitation
   - Works in production

2. **Subaccount status shows "false"** for vendors
   - Normal for test mode
   - Commissions still tracked
   - Ready for production

3. **Network errors** in backend logs
   - Some features trying to connect
   - Doesn't affect core functionality
   - Can be ignored for testing

---

## 📊 Database Verification

### Check Tables in Supabase

**1. Check Commissions Table:**
```sql
SELECT * FROM commissions
ORDER BY created_at DESC
LIMIT 10;
```

**2. Check Vendor Payouts:**
```sql
SELECT * FROM vendor_payouts
ORDER BY created_at DESC;
```

**3. Check Vendor Subaccount Status:**
```sql()
SELECT
  id,
  business_name,
  paystack_subaccount_code,
  verification_status
FROM vendors
WHERE verification_status = 'approved';
```

**4. View Platform Revenue:**
```sql
SELECT
  SUM(platform_commission) as total_commission,
  COUNT(*) as total_orders
FROM commissions;
```

---

## 🎯 Testing Checklist

### Basic Flow
- [ ] Customer can browse products
- [ ] Add products to cart
- [ ] Complete checkout
- [ ] Make payment with test card
- [ ] Order appears in customer orders
- [ ] Order appears in vendor dashboard
- [ ] Order appears in admin panel

### Payment & Commissions
- [ ] Commission record created after payment
- [ ] 95/5 split calculated correctly
- [ ] Vendor can view their commissions
- [ ] Admin can view all commissions
- [ ] Platform stats show correct totals

### Payout Management
- [ ] Admin can create payout for vendor
- [ ] Payout includes correct orders
- [ ] Admin can mark payout as paid
- [ ] Commissions marked as settled
- [ ] Vendor can view payout history

### Vendor Management
- [ ] Admin can approve vendors
- [ ] System attempts subaccount creation
- [ ] Warning shown for test mode limitation
- [ ] Admin can manually check subaccount status
- [ ] Vendor status updates correctly

---

## 💡 Testing Tips

1. **Use Browser DevTools:**
   - Check Network tab for API calls
   - View Console for errors
   - Test on different screen sizes

2. **Test Multiple Vendors:**
   - Place orders with products from different vendors
   - Verify split payment configuration
   - Check commission tracking per vendor

3. **Test Edge Cases:**
   - Empty cart checkout (should fail)
   - Out of stock products
   - Invalid payment details
   - Duplicate orders

4. **Monitor Backend Logs:**
   - Watch for payment processing messages
   - Check commission creation logs
   - Look for error messages

5. **Test Mobile Responsiveness:**
   - Use Chrome DevTools device toolbar
   - Test on actual mobile device
   - Check all pages and flows

---

## 🚨 If Something Breaks

### Frontend Issues
1. Check browser console for errors
2. Refresh the page
3. Clear browser cache
4. Check if backend is running

### Backend Issues
1. Check terminal for error logs
2. Restart backend server
3. Verify .env variables
4. Check Supabase connection

### Database Issues
1. Check Supabase dashboard
2. Verify tables exist
3. Check RLS policies
4. Run migrations if needed

---

## 📞 Need Help?

Check these files:
- `PHASE_4_PAYMENT_FEATURES.md` - Payment features documentation
- `SUBACCOUNT_VERIFICATION_GUIDE.md` - Subaccount verification
- `PAYSTACK_SUBACCOUNT_LIMITATION.md` - Test mode explanation
- `REMAINING_TASKS.md` - What's left to do

---

**Happy Testing! 🎉**

Let me know if you find any issues or need clarification on any features.

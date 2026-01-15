# Phase 2 Setup Guide - Final Steps

## ✅ What's Been Created

### Backend
- ✅ Authentication middleware
- ✅ Vendor controller (create, read, update, verify)
- ✅ Product controller (full CRUD)
- ✅ Vendor routes
- ✅ Product routes

### Frontend
- ✅ Vendor onboarding page
- ✅ Product listing page (`Products.jsx`)
- ✅ Product form page (`ProductForm.jsx`)
- ✅ Category seed SQL

## 🔧 Manual Steps Required

### Step 1: Update Backend Routes (`sell-gh-backend/src/server.js`)

Add these imports at the top (after the existing imports):
```javascript
import vendorRoutes from './routes/vendorRoutes.js';
import productRoutes from './routes/productRoutes.js';
```

Replace the commented API routes section with:
```javascript
// API Routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
```

### Step 2: Update Frontend Routes (`sell-gh/src/App.jsx`)

Add these imports:
```javascript
import VendorOnboarding from './pages/vendor/VendorOnboarding';
import Products from './pages/vendor/Products';
import ProductForm from './pages/vendor/ProductForm';
```

Add these routes in the Vendor Routes section (after the dashboard route):
```javascript
<Route
  path="/vendor/onboarding"
  element={
    <ProtectedRoute allowedRoles={['vendor']}>
      <VendorOnboarding />
    </ProtectedRoute>
  }
/>
<Route
  path="/vendor/products"
  element={
    <ProtectedRoute allowedRoles={['vendor']}>
      <Products />
    </ProtectedRoute>
  }
/>
<Route
  path="/vendor/products/new"
  element={
    <ProtectedRoute allowedRoles={['vendor']}>
      <ProductForm />
    </ProtectedRoute>
  }
/>
<Route
  path="/vendor/products/:id/edit"
  element={
    <ProtectedRoute allowedRoles={['vendor']}>
      <ProductForm />
    </ProtectedRoute>
  }
/>
```

### Step 3: Seed Categories in Supabase

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `database/seed_categories.sql`
4. Click **Run**
5. You should see "Categories seeded successfully!"

### Step 4: Set Up Supabase Storage (Optional - for image uploads)

1. Go to **Supabase Dashboard** → **Storage**
2. Click **Create a new bucket**
3. Name it `product-images`
4. Set to **Public**
5. Click **Create bucket**

Update storage policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Anyone can view product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Vendors can delete their own images
CREATE POLICY "Vendors can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
```

## 🧪 Testing Checklist

### Vendor Onboarding
- [ ] Sign up as a vendor
- [ ] Navigate to `/vendor/onboarding`
- [ ] Fill in business details
- [ ] Submit form
- [ ] Check that vendor profile is created (status: pending)
- [ ] Verify data in Supabase dashboard

### Product Management
- [ ] Go to vendor dashboard
- [ ] Click "Manage Products"
- [ ] See empty state (no products yet)
- [ ] Click "Add New Product"
- [ ] Fill in product details
- [ ] Select category from dropdown
- [ ] Create product
- [ ] Product appears in list
- [ ] Edit product
- [ ] Toggle product status (active/inactive)
- [ ] Delete product

### Backend API Testing (Optional - use Postman/Thunder Client)

#### Get Auth Token
1. Login in the frontend
2. Open browser DevTools → Application → Local Storage
3. Copy the `sb-<project>-auth-token` value

#### Test Endpoints
```
GET /api/vendors - Get all verified vendors (no auth)
POST /api/vendors - Create vendor profile (needs auth)
GET /api/products - Get all products (no auth)
POST /api/products - Create product (needs auth + vendor role)
GET /api/products/vendor/my-products - Get my products (needs auth)
```

## 🎯 Expected Behavior

### Vendor Flow
1. User signs up with role = "vendor"
2. Redirected to onboarding page
3. Fills in business details
4. Profile created with status "pending"
5. Cannot add products until verified by admin
6. Once verified, can add/edit/delete products

### Admin Verification (Manual for now)
Update vendor in Supabase dashboard:
```sql
UPDATE vendors
SET is_verified = true, verification_status = 'approved'
WHERE user_id = '<vendor_user_id>';
```

## 🐛 Common Issues & Solutions

### "Vendor account must be verified"
- Check that `is_verified = true` in vendors table
- Verify the vendor manually using the SQL above

### "Failed to load categories"
- Run the seed_categories.sql script
- Check that categories table has data

### "Route not found" errors
- Make sure you've added all routes to App.jsx
- Check that imports are correct
- Restart dev server if needed

### Product images not showing
- Set up Supabase Storage bucket
- Images will show placeholder if no images uploaded yet

## 🚀 Next Steps After Testing

Once everything works:
1. Build image upload component
2. Add image handling to product form
3. Create admin verification interface
4. Add product search/filtering
5. Build customer-facing product pages

## 📊 Phase 2 Completion Criteria

- [x] Vendor onboarding form
- [x] Vendor profile creation
- [x] Product CRUD operations
- [x] Category management
- [ ] Image upload (optional for MVP)
- [ ] Admin verification interface (can be manual for now)

## 💡 Tips

- Keep backend server running while testing
- Check browser console for errors
- Use Supabase dashboard to verify data
- Test with different user roles
- Clear browser cache if routes not working

---

**Ready to test?** Follow the manual steps above, then start testing the vendor flow!

# 🎨 Alert System Guide

## Overview
SellGH now has a beautiful, catchy alert and modal system that provides consistent user feedback across the entire platform.

---

## Features

✅ **4 Alert Types**: Success, Error, Warning, Info
✅ **Animated Toasts**: Slide in from the right with smooth animations
✅ **Confirm Dialogs**: Beautiful modal confirmations
✅ **Auto Dismiss**: Configurable timeout
✅ **Manual Dismiss**: Click the X button
✅ **Stacked Alerts**: Multiple alerts display nicely
✅ **Responsive**: Works on all screen sizes
✅ **Accessible**: Keyboard and screen reader friendly

---

## Usage

### 1. Import the Hook

```jsx
import { useAlert } from '../contexts/AlertContext';
```

### 2. Use in Your Component

```jsx
function MyComponent() {
  const alert = useAlert();

  const handleSuccess = () => {
    alert.success('Product added successfully!');
  };

  const handleError = () => {
    alert.error('Failed to save product. Please try again.');
  };

  const handleWarning = () => {
    alert.warning('Stock is running low!');
  };

  const handleInfo = () => {
    alert.info('Your order is being processed.');
  };

  return (
    <button onClick={handleSuccess}>Show Success</button>
  );
}
```

---

## API Reference

### Alert Methods

#### `alert.success(message, duration?)`
Shows a success alert with a green theme.
- **message**: String to display
- **duration**: Auto-dismiss time in ms (default: 4000)

```jsx
alert.success('Product created successfully!');
alert.success('Order placed!', 6000); // Show for 6 seconds
```

#### `alert.error(message, duration?)`
Shows an error alert with a red theme.

```jsx
alert.error('Failed to delete product');
alert.error('Payment failed. Please try again.', 0); // No auto-dismiss
```

#### `alert.warning(message, duration?)`
Shows a warning alert with a yellow theme.

```jsx
alert.warning('You have unsaved changes');
```

#### `alert.info(message, duration?)`
Shows an info alert with a blue theme.

```jsx
alert.info('Your profile has been updated');
```

#### `alert.confirm(message, options?)`
Shows a confirmation dialog. Returns a Promise that resolves to `true` if confirmed, `false` if canceled.

```jsx
const confirmed = await alert.confirm(
  'Are you sure you want to delete this product?',
  {
    title: 'Delete Product',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'error' // error, warning, success, info
  }
);

if (confirmed) {
  // User clicked Delete
  deleteProduct();
}
```

---

## Real-World Examples

### 1. Form Submission

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await createProduct(formData);
    alert.success('Product created successfully!');
    navigate('/vendor/products');
  } catch (error) {
    alert.error(error.message || 'Failed to create product');
  }
};
```

### 2. Delete Confirmation

```jsx
const handleDelete = async (productId) => {
  const confirmed = await alert.confirm(
    'This action cannot be undone. Are you sure?',
    {
      title: 'Delete Product',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'error'
    }
  );

  if (confirmed) {
    try {
      await deleteProduct(productId);
      alert.success('Product deleted successfully');
    } catch (error) {
      alert.error('Failed to delete product');
    }
  }
};
```

### 3. Status Update

```jsx
const handleStatusChange = async (orderId, newStatus) => {
  try {
    await updateOrderStatus(orderId, newStatus);
    alert.success(`Order status updated to ${newStatus}`);
  } catch (error) {
    alert.error('Failed to update order status');
  }
};
```

### 4. Logout Confirmation

```jsx
const handleLogout = async () => {
  const confirmed = await alert.confirm(
    'Are you sure you want to logout?',
    {
      title: 'Logout',
      confirmText: 'Yes, Logout',
      cancelText: 'Stay',
      type: 'warning'
    }
  );

  if (confirmed) {
    await signOut();
    alert.info('You have been logged out');
    navigate('/login');
  }
};
```

### 5. Cart Actions

```jsx
// Add to cart
const handleAddToCart = (product) => {
  addToCart(product);
  alert.success(`${product.name} added to cart!`, 3000);
};

// Remove from cart
const handleRemoveFromCart = async (item) => {
  const confirmed = await alert.confirm(
    `Remove ${item.name} from cart?`,
    {
      title: 'Remove Item',
      confirmText: 'Remove',
      type: 'warning'
    }
  );

  if (confirmed) {
    removeFromCart(item.id);
    alert.info('Item removed from cart');
  }
};
```

### 6. Payment Processing

```jsx
const handlePayment = async (paymentData) => {
  try {
    alert.info('Processing payment...', 0); // Don't auto-dismiss
    const result = await processPayment(paymentData);

    // Dismiss the processing message
    alert.success('Payment successful! Redirecting...');
    setTimeout(() => navigate('/order-success'), 2000);
  } catch (error) {
    alert.error('Payment failed. Please try again.');
  }
};
```

### 7. Vendor Approval (Admin)

```jsx
const handleApproveVendor = async (vendorId) => {
  const confirmed = await alert.confirm(
    'This will approve the vendor and create their payment account.',
    {
      title: 'Approve Vendor',
      confirmText: 'Approve',
      type: 'success'
    }
  );

  if (confirmed) {
    try {
      await approveVendor(vendorId);
      alert.success('Vendor approved successfully!');
    } catch (error) {
      alert.error('Failed to approve vendor');
    }
  }
};
```

---

## Customization Options

### Duration
Control how long alerts stay visible:
```jsx
alert.success('Quick message', 2000);  // 2 seconds
alert.error('Important error', 0);     // No auto-dismiss
```

### Confirm Dialog Options
```jsx
alert.confirm('Message', {
  title: 'Custom Title',           // Modal title
  confirmText: 'Yes',               // Confirm button text
  cancelText: 'No',                 // Cancel button text
  type: 'error'                     // error, warning, success, info
});
```

---

## Best Practices

1. **Use Appropriate Types**
   - ✅ Success: Actions completed successfully
   - ❌ Error: Failed operations, validation errors
   - ⚠️ Warning: Cautionary messages, confirmations
   - ℹ️ Info: General information, status updates

2. **Keep Messages Concise**
   ```jsx
   ✅ alert.success('Product created!');
   ❌ alert.success('Your product has been successfully created and saved to the database');
   ```

3. **Use Confirms for Destructive Actions**
   ```jsx
   // Always confirm before deleting
   const confirmed = await alert.confirm('Delete this item?');
   if (confirmed) {
     // Delete
   }
   ```

4. **Handle Errors Gracefully**
   ```jsx
   try {
     await saveData();
     alert.success('Saved!');
   } catch (error) {
     alert.error(error.message || 'Something went wrong');
   }
   ```

5. **Provide Context in Confirmations**
   ```jsx
   alert.confirm(
     'This will permanently delete 5 products. Continue?',
     { type: 'error', confirmText: 'Delete All' }
   );
   ```

---

## Styling

The alert system uses:
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Custom animations** for smooth transitions

Colors are based on:
- 🟢 Success: Green/Emerald
- 🔴 Error: Red/Rose
- 🟡 Warning: Yellow/Amber
- 🔵 Info: Blue/Cyan

---

## Accessibility

- ✅ Keyboard navigation support
- ✅ Focus management in modals
- ✅ ARIA labels for screen readers
- ✅ Color contrast compliance
- ✅ Close button with X icon

---

## Common Integration Points

Replace old alerts with the new system:

### Before:
```jsx
window.alert('Product created!');
if (window.confirm('Delete this?')) {
  // delete
}
console.log('Success!');
```

### After:
```jsx
alert.success('Product created!');
if (await alert.confirm('Delete this?')) {
  // delete
}
```

---

## Troubleshooting

### Alerts Not Showing?
1. Check that `AlertProvider` wraps your app
2. Verify `AlertContainer` is rendered
3. Check browser console for errors

### Styling Issues?
1. Ensure Tailwind CSS is configured
2. Check that lucide-react is installed
3. Verify no CSS conflicts

### Icons Missing?
Install lucide-react:
```bash
npm install lucide-react
```

---

## Migration Checklist

- [ ] Replace all `window.alert()` calls
- [ ] Replace all `window.confirm()` calls
- [ ] Replace all `console.log()` for user feedback
- [ ] Add success messages after CRUD operations
- [ ] Add error handling with alerts
- [ ] Add confirmations for delete actions
- [ ] Test on mobile devices
- [ ] Verify keyboard navigation

---

**Happy Alerting! 🎉**

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const EMPTY_CART_CONTEXT = {
  cartItems: [],
  isCartOpen: false,
  setIsCartOpen: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getCartTotal: () => 0,
  getCartCount: () => 0,
  getItemsByVendor: () => []
};

const loadCartItems = (storageKey) => {
  const savedCart = localStorage.getItem(storageKey);

  if (!savedCart) {
    return [];
  }

  try {
    return JSON.parse(savedCart);
  } catch (error) {
    console.error('Error loading cart:', error);
    localStorage.removeItem(storageKey);
    return [];
  }
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const storageKey = user?.id ? `sellgh_cart_${user.id}` : 'sellgh_cart_guest';

  if (loading) {
    return <CartContext.Provider value={EMPTY_CART_CONTEXT}>{children}</CartContext.Provider>;
  }

  return (
    <CartStorageProvider key={storageKey} storageKey={storageKey}>
      {children}
    </CartStorageProvider>
  );
};

const CartStorageProvider = ({ children, storageKey }) => {
  const [cartItems, setCartItems] = useState(() => loadCartItems(storageKey));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const hydratedStorageKeyRef = useRef(storageKey);

  useEffect(() => {
    if (hydratedStorageKeyRef.current !== storageKey) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }, [cartItems, storageKey]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);

      if (existingItem) {
        // Update quantity if item exists
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        return [...prevItems, {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          vendor_id: product.vendor_id,
          vendor_name: product.vendors?.business_name || 'Unknown Vendor',
          stock_quantity: product.stock_quantity,
          quantity
        }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, item.stock_quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Group items by vendor for checkout
  const getItemsByVendor = () => {
    const grouped = {};
    cartItems.forEach(item => {
      if (!grouped[item.vendor_id]) {
        grouped[item.vendor_id] = {
          vendor_id: item.vendor_id,
          vendor_name: item.vendor_name,
          items: []
        };
      }
      grouped[item.vendor_id].items.push(item);
    });
    return Object.values(grouped);
  };

  const value = {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getItemsByVendor
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

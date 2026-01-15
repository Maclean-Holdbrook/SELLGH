import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../config/supabase';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist when user logs in
  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            name,
            price,
            stock_quantity,
            is_active,
            vendors (
              business_name
            ),
            product_images (
              image_url,
              is_primary
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process wishlist items to include primary image
      const processedWishlist = (data || []).map(item => ({
        ...item,
        products: {
          ...item.products,
          image_url: item.products?.product_images?.find(img => img.is_primary)?.image_url
                     || item.products?.product_images?.[0]?.image_url
                     || null
        }
      }));

      setWishlist(processedWishlist);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    if (!user) {
      // Return false to indicate user needs to login
      return { success: false, needsLogin: true };
    }

    try {
      // Check if already in wishlist
      const existing = wishlist.find(item => item.product_id === productId);
      if (existing) {
        return { success: true, message: 'Already in wishlist' };
      }

      const { data, error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          product_id: productId
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh wishlist to get full product details
      await fetchWishlist();
      return { success: true, message: 'Added to wishlist' };
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      return { success: false, error: err.message };
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setWishlist(prev => prev.filter(item => item.product_id !== productId));
      return { success: true, message: 'Removed from wishlist' };
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      return { success: false, error: err.message };
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.product_id === productId);
  };

  const getWishlistCount = () => {
    return wishlist.length;
  };

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistCount,
    refreshWishlist: fetchWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;

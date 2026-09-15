import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistApi } from '../utils/api';

const WishlistContext = createContext();

const getOrCreateGuestId = () => {
  try {
    let gid = localStorage.getItem('auriva_guest_id');
    if (!gid) {
      gid = 'guest_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('auriva_guest_id', gid);
    }
    return gid;
  } catch {
    return 'guest_' + Date.now();
  }
};

export function WishlistProvider({ children }) {
  const [guestId] = useState(getOrCreateGuestId);

  // Wishlist starts CLEAN and EMPTY - zero hardcoded dummy items
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Populated product objects from backend
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('auriva_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  // Load authoritative wishlist from MongoDB on mount
  const refreshWishlistFromBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await wishlistApi.getWishlist(guestId);
      if (res && res.data && res.data.wishlist) {
        const serverWishlist = res.data.wishlist;
        if (Array.isArray(serverWishlist.items) && serverWishlist.items.length > 0) {
          setWishlistItems(serverWishlist.items);
          setWishlist(serverWishlist.productIds || serverWishlist.items.map(it => it.id || it.productId || it.slug));
        } else {
          // If server is empty but client has local items, sync to server
          const localSaved = localStorage.getItem('auriva_wishlist');
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const syncRes = await wishlistApi.syncWishlist(parsed, guestId);
                if (syncRes && syncRes.data && syncRes.data.wishlist) {
                  setWishlistItems(syncRes.data.wishlist.items || []);
                  setWishlist(syncRes.data.wishlist.productIds || parsed);
                }
              }
            } catch (err) {
              console.warn('[Wishlist] Sync error:', err);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[WishlistContext] Backend sync fallback to local cache:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    refreshWishlistFromBackend();
  }, [refreshWishlistFromBackend]);

  /**
   * Check if a product is in wishlist
   * Accepts product ID, slug, or product object
   */
  const isInWishlist = useCallback((productOrId) => {
    if (!productOrId) return false;

    if (typeof productOrId === 'object') {
      const id = productOrId.id || productOrId._id;
      const slug = productOrId.slug;
      if (id && wishlist.includes(String(id))) return true;
      if (slug && wishlist.includes(String(slug))) return true;
      return wishlistItems.some(
        it => (id && (it.id === String(id) || it.productId === String(id))) || (slug && it.slug === String(slug))
      );
    }

    const key = String(productOrId);
    if (wishlist.includes(key)) return true;

    return wishlistItems.some(
      it => it.id === key || it.productId === key || it.slug === key
    );
  }, [wishlist, wishlistItems]);

  /**
   * Toggle product in wishlist
   * Accepts product ID, slug, or full product object
   */
  const toggleWishlist = async (productOrId) => {
    if (!productOrId) return;

    let targetId = '';
    let productData = {};

    if (typeof productOrId === 'object') {
      targetId = String(productOrId.id || productOrId._id || productOrId.slug || '');
      productData = {
        name: productOrId.name,
        image: productOrId.image,
        price: productOrId.price,
        oldPrice: productOrId.oldPrice,
        slug: productOrId.slug
      };
    } else {
      targetId = String(productOrId);
    }

    if (!targetId) return;

    // Optimistic toggle in local state
    const isCurrentlyWishlisted = isInWishlist(targetId);

    setWishlist(prev => {
      if (isCurrentlyWishlisted) {
        return prev.filter(id => id !== targetId && (!productData.slug || id !== productData.slug));
      } else {
        const next = [...prev, targetId];
        if (productData.slug && !next.includes(productData.slug)) {
          next.push(productData.slug);
        }
        return next;
      }
    });

    if (isCurrentlyWishlisted) {
      setWishlistItems(prev => prev.filter(
        it => it.id !== targetId && it.productId !== targetId && (!productData.slug || it.slug !== productData.slug)
      ));
    } else if (typeof productOrId === 'object') {
      setWishlistItems(prev => [
        ...prev,
        {
          id: targetId,
          productId: targetId,
          slug: productData.slug || targetId,
          name: productData.name || 'Snack Item',
          image: productData.image || '',
          price: productData.price || 0,
          oldPrice: productData.oldPrice || 0
        }
      ]);
    }

    // Persist to MongoDB backend in real-time
    try {
      const res = await wishlistApi.toggleWishlist(targetId, productData, guestId);
      if (res && res.data && res.data.wishlist) {
        const serverWishlist = res.data.wishlist;
        setWishlistItems(serverWishlist.items || []);
        if (Array.isArray(serverWishlist.productIds)) {
          setWishlist(serverWishlist.productIds);
        }
      }
    } catch (err) {
      console.error('[WishlistContext] Failed to persist toggle to backend:', err);
    }
  };

  /**
   * Clear entire wishlist
   */
  const clearWishlist = async () => {
    setWishlist([]);
    setWishlistItems([]);
    try {
      localStorage.removeItem('auriva_wishlist');
      await wishlistApi.clearWishlist(guestId);
    } catch (err) {
      console.error('[WishlistContext] Failed to clear wishlist on backend:', err);
    }
  };

  const calculatedCount = wishlistItems.length > 0 
    ? wishlistItems.length 
    : Array.from(new Set(wishlist)).length;

  return (
    <WishlistContext.Provider value={{
      wishlist,
      wishlistItems,
      wishlistCount: calculatedCount,
      toggleWishlist,
      isInWishlist,
      clearWishlist,
      isLoading,
      refreshWishlistFromBackend
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
export default WishlistContext;

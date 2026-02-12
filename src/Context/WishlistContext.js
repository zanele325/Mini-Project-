"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/src/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const WishlistContext = createContext({});

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch wishlist when user changes
  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setWishlistCount(0);
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const wishlistDoc = await getDoc(wishlistRef);
      
      if (wishlistDoc.exists()) {
        const items = wishlistDoc.data().items || [];
        setWishlistItems(items);
        setWishlistCount(items.length);
      } else {
        setWishlistItems([]);
        setWishlistCount(0);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (product) => {
    if (!user) {
      window.location.href = '/login?redirect=' + window.location.pathname;
      return false;
    }

    // Check if already in wishlist
    if (wishlistItems.some(item => item.id === product.id)) {
      alert(`"${product.name}" is already in your wishlist`);
      return false;
    }

    try {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const wishlistDoc = await getDoc(wishlistRef);
      
      const wishlistItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice || null,
        culture: product.culture,
        category: product.category,
        occasions: product.occasions || [],
        description: product.description || '',
        inStock: product.inStock !== false,
        image: product.image || null,
        addedAt: new Date().toISOString()
      };

      if (wishlistDoc.exists()) {
        await updateDoc(wishlistRef, {
          items: arrayUnion(wishlistItem)
        });
      } else {
        await setDoc(wishlistRef, {
          items: [wishlistItem],
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Update local state
      setWishlistItems(prev => [...prev, wishlistItem]);
      setWishlistCount(prev => prev + 1);
      
      alert(`Added "${product.name}" to wishlist!`);
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Failed to add to wishlist. Please try again.');
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return false;

    try {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const itemToRemove = wishlistItems.find(item => item.id === productId);
      
      if (itemToRemove) {
        await updateDoc(wishlistRef, {
          items: arrayRemove(itemToRemove)
        });

        // Update local state
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
        setWishlistCount(prev => prev - 1);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  const clearWishlist = async () => {
    if (!user) return false;

    try {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      await updateDoc(wishlistRef, {
        items: []
      });
      
      setWishlistItems([]);
      setWishlistCount(0);
      return true;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      return false;
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount,
      loading,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      clearWishlist,
      refreshWishlist: fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
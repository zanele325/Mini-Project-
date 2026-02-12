"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/src/lib/firebase';
import { 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('guest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Check if it's an anonymous user
        if (firebaseUser.isAnonymous) {
          setUserRole('guest');
          setLoading(false);
          return;
        }

        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || 'customer');
          } else {
            setUserRole('customer');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('customer');
        }
      } else {
        setUser(null);
        setUserRole('guest');
        
        // Check for guest session in localStorage
        const guestSession = localStorage.getItem('guestSession');
        if (guestSession) {
          // Still a guest, but we track it in UI
          setUserRole('guest');
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear guest session
      localStorage.removeItem('guestSession');
      sessionStorage.removeItem('isGuest');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    isGuest: userRole === 'guest',
    isCustomer: userRole === 'customer',
    isAdmin: userRole === 'admin',
    loading,
    logout,
    setUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
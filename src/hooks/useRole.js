"use client";

import { useAuth } from '@/src/Context/AuthContext';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

// Define role constants
export const ROLES = {
  GUEST: 'guest',
  CUSTOMER: 'customer',
  ADMIN: 'admin'
};

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState(ROLES.GUEST);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRole(ROLES.GUEST);
        setLoading(false);
        return;
      }

      try {
        // Check if user is admin (you can store this in Firestore)
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role || ROLES.CUSTOMER);
        } else {
          setRole(ROLES.CUSTOMER);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(ROLES.CUSTOMER);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  return {
    role,
    loading,
    isGuest: role === ROLES.GUEST,
    isCustomer: role === ROLES.CUSTOMER,
    isAdmin: role === ROLES.ADMIN,
    isAuthenticated: !!user
  };
}

// Higher-order component for protecting routes
export function withRoleProtection(Component, requiredRole) {
  return function ProtectedComponent(props) {
    const { role, loading } = useRole();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (requiredRole === ROLES.ADMIN && role !== ROLES.ADMIN) {
          router.push('/');
        } else if (requiredRole === ROLES.CUSTOMER && role === ROLES.GUEST) {
          router.push('/login');
        }
      }
    }, [role, loading, router]);

    if (loading) {
      return <div>Loading...</div>;
    }

    return <Component {...props} />;
  };
}
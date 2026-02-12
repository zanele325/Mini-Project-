'use client'; // This is a client component

import { createContext, useContext, useEffect, useState } from 'react';

import {
    onAuthStateChanged,
    signOut,
} from 'firebase/auth';  

import { auth } from '../lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
            setUser({
                userID: user.uid,
                email: user.email,
                displayName: user.displayName,
            });
        }else{
            setUser(null);
        }
         setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {

        try {
        await signOut(auth);
        setUser(null);

    }

        catch (error) {
            console.error("Error during logout:", error);
        }
    };

const value = {
    user,
    loading,
    logout,
};

return (
    <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
);

    }

export function useAuth () {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export{AuthContext};

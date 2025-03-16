'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Only allow this specific admin account
const ADMIN_EMAIL = 'svucyno@gmail.com';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    authError: string | null;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    authError: null,
    signInWithGoogle: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Only allow the admin email
            if (user && user.email !== ADMIN_EMAIL) {
                console.log('Unauthorized access attempt:', user.email);
                setAuthError('Only the admin account is allowed access.');
                signOut(auth);
                setUser(null);
            } else {
                setUser(user);
                setAuthError(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            setAuthError(null);
            setLoading(true);
            const result = await signInWithPopup(auth, provider);

            // Verify the email is the admin email
            if (result.user.email !== ADMIN_EMAIL) {
                console.log('Unauthorized login attempt:', result.user.email);
                setAuthError('Only the admin account (svucyno@gmail.com) is allowed access.');
                await signOut(auth);
                setUser(null);
            }
        } catch (error: any) {
            console.error('Error signing in with Google:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                setAuthError('Login popup was closed. Please try again.');
            } else if (error.code === 'auth/popup-blocked') {
                setAuthError('Login popup was blocked. Please enable popups for this site.');
            } else if (error.code === 'auth/user-disabled') {
                setAuthError('This account has been disabled. Contact an administrator.');
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                setAuthError('Account exists with different sign-in method. Try another method.');
            } else {
                setAuthError('Authentication failed. Only the admin account is allowed.');
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, authError, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext); 
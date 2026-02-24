"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const AuthContext = createContext({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    signUpWithEmail: async (email, password) => { },
    signInWithEmail: async (email, password) => { },
    logout: async () => { },
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // --- NEW STRICT STUDENT EMAIL VERIFICATION ---
    // Enforces logins strictly to the '@students.must.ac.ke' domain.
    const isStudentEmail = (email) => {
        return email && email.toLowerCase().endsWith('@students.must.ac.ke');
    };

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            if (!isStudentEmail(result.user.email)) {
                await signOut(auth);
                const error = new Error("Only @students.must.ac.ke emails are allowed.");
                error.code = 'auth/unauthorized-domain';
                throw error;
            }
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    };

    const signUpWithEmail = async (email, password) => {
        try {
            if (!isStudentEmail(email)) {
                const error = new Error("Only @students.must.ac.ke emails are allowed.");
                error.code = 'auth/unauthorized-domain';
                throw error;
            }
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing up with email:", error);
            throw error;
        }
    };

    const signInWithEmail = async (email, password) => {
        try {
            if (!isStudentEmail(email)) {
                const error = new Error("Only @students.must.ac.ke emails are allowed.");
                error.code = 'auth/unauthorized-domain';
                throw error;
            }
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing in with email:", error);
            throw error;
        }
    };

    /* 
    // --- ORIGINAL CODE (FOR FUTURE SCALING TO ALL EMAILS) ---
    // Uncomment these functions and remove the strict ones above to allow any email domain.
    
    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    };

    const signUpWithEmail = async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing up with email:", error);
            throw error;
        }
    };

    const signInWithEmail = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing in with email:", error);
            throw error;
        }
    };
    */

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
    const { user, signInWithGoogle, signInWithEmail, loading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (user && !loading) {
            router.push("/profile");
        }
    }, [user, loading, router]);

    const handleEmailSignin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await signInWithEmail(email, password);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className={styles.signupWrapper}>
                <div className={styles.ambientOrb} />
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className={styles.signupWrapper}>
            <div className={styles.ambientOrb} />
            <div className={styles.ambientOrb} style={{ top: "auto", bottom: "-20%", left: "50%" }} />

            <div className={styles.signupCard}>
                <div className={styles.signupLogo}>
                    <Logo size={64} />
                </div>

                <h1 className={styles.signupTitle}>
                    Welcome <span className={styles.heroTitleGradient}>Back!</span>
                </h1>

                <p className={styles.signupDescription}>
                    Sign in to continue connecting with your university network.
                </p>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <form onSubmit={handleEmailSignin} className={styles.authForm}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className={styles.btnPrimary} style={{ width: '100%', marginTop: '16px' }}>
                        Log In
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>OR</span>
                </div>

                <button
                    onClick={signInWithGoogle}
                    className={styles.googleBtn}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.68-2.3 1.09-3.71 1.09-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.12c-.22-.68-.35-1.4-.35-2.12s.13-1.44.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.86 0-5.29 1.93-6.16 4.53l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <div style={{ marginTop: "32px", textAlign: "center" }}>
                    <p style={{ marginBottom: "12px", opacity: 0.8 }}>
                        Don't have an account? <Link href="/signup" style={{ color: "var(--primary-color)", fontWeight: "bold" }}>Sign Up</Link>
                    </p>
                    <Link href="/" className={styles.returnLink}>
                        Return to home
                    </Link>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navigation.module.css";
import { useAuth } from "@/context/AuthContext";

export default function Navigation() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Listen for unread notifications
    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        const q = query(
            collection(db, "notifications"),
            where("recipientId", "==", user.uid),
            where("isRead", "==", false)
        );
        const unsub = onSnapshot(q, (snap) => {
            setUnreadCount(snap.size);
        });
        return () => unsub();
    }, [user]);

    if (!mounted) return null;

    const isAuthPage = pathname === "/login" || pathname === "/signup";
    if (isAuthPage) return null;

    // Unauthenticated nav
    if (!user) {
        return (
            <nav className={styles.nav}>
                <div className={styles.inner}>
                    <Link href="/" className={styles.brand}>
                        <img src="/brand/logo.png" alt="Campus Connect Icon" className={styles.brandIcon} />
                        <span className={styles.brandText}>Campus<span className={styles.brandAccent}>Connect</span></span>
                    </Link>
                    <div className={styles.authLinks}>
                        <Link href="/login" className={styles.loginLink}>Log in</Link>
                        <Link href="/signup" className={styles.signupBtn}>Sign up</Link>
                    </div>
                </div>
            </nav>
        );
    }

    const navItems = [
        {
            label: "Home", path: "/",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
            iconFilled: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
        },
        {
            label: "Feed", path: "/sema",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>,
            iconFilled: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
        },
        {
            label: "Discover", path: "/discover",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
            iconFilled: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="3" /></svg>
        },
        {
            label: "DMs", path: "/messages",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
            iconFilled: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
        },
        {
            label: "Activity", path: "/notifications",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>,
            iconFilled: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        },
        {
            label: "Profile", path: "/profile",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
            iconFilled: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        },
    ];

    const isActive = (path) => {
        if (path === "/") return pathname === "/";
        return pathname.startsWith(path);
    };

    return (
        <>
            {/* Desktop Top Nav */}
            <nav className={styles.nav}>
                <div className={styles.inner}>
                    <Link href="/" className={styles.brand}>
                        <img src="/brand/logo.png" alt="Campus Connect Icon" className={styles.brandIcon} />
                        <span className={styles.brandText}>Campus<span className={styles.brandAccent}>Connect</span></span>
                    </Link>

                    <div className={styles.desktopLinks}>
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.desktopLink} ${isActive(item.path) ? styles.desktopActive : ""}`}
                                title={item.label}
                                style={{ position: 'relative' }}
                            >
                                {isActive(item.path) ? item.iconFilled : item.icon}
                                {item.label === "Activity" && unreadCount > 0 && (
                                    <span className={styles.badge} style={{ top: 2, right: 2 }}>{unreadCount}</span>
                                )}
                            </Link>
                        ))}
                    </div>

                    <div className={styles.desktopRight}>
                        <Link href="/profile" className={styles.avatarLink} style={{ position: 'relative' }}>
                            <img
                                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || "U"}&background=1c1c1e&color=f5f5f7`}
                                alt="You"
                                className={`${styles.navAvatar} ${isActive("/profile") ? styles.navAvatarActive : ""}`}
                            />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Tab Bar */}
            <nav className={styles.mobileBar}>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`${styles.mobileTab} ${isActive(item.path) ? styles.mobileTabActive : ""}`}
                    >
                        <span className={styles.tabIconWrap}>
                            {isActive(item.path) ? item.iconFilled : item.icon}
                            {item.label === "Activity" && unreadCount > 0 && (
                                <span className={styles.badge}>{unreadCount}</span>
                            )}
                        </span>
                    </Link>
                ))}
            </nav>
        </>
    );
}

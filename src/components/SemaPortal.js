"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./SemaPortal.module.css";

export default function SemaPortal() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isAuthPage = pathname === "/login" || pathname === "/signup";
    const isMessages = pathname && pathname.startsWith("/messages");

    if (isAuthPage || isMessages) return null;
    return (
        <Link href="/sema" className={styles.semaTrigger}>
            <span className={styles.semaIcon}>🗣️</span>
            Sema
        </Link>
    );
}

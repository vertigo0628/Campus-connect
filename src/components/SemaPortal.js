"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SemaPortal.module.css";

export default function SemaPortal() {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/signup";

    if (isAuthPage) return null;
    return (
        <Link href="/sema" className={styles.semaTrigger}>
            <span className={styles.semaIcon}>🗣️</span>
            Sema
        </Link>
    );
}

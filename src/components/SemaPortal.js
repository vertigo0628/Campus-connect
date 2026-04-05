"use client";

import Link from "next/link";
import styles from "./SemaPortal.module.css";

export default function SemaPortal() {
    return (
        <Link href="/sema" className={styles.semaTrigger}>
            <span className={styles.semaIcon}>🗣️</span>
            Sema
        </Link>
    );
}

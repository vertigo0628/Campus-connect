"use client";

import { useEffect, useState } from "react";
import styles from "./MediaModal.module.css";

export default function MediaModal({ src, type = "image", isOpen, onClose }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            document.body.style.overflow = "hidden";
        } else {
            const timer = setTimeout(() => setIsMounted(false), 300); // Wait for animation
            document.body.style.overflow = "unset";
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isMounted && !isOpen) return null;

    return (
        <div
            className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
            onClick={onClose}
        >
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                ✕
            </button>

            <div
                className={`${styles.content} ${isOpen ? styles.contentOpen : ""}`}
                onClick={(e) => e.stopPropagation()}
            >
                {type === "video" ? (
                    <video
                        src={src}
                        controls
                        autoPlay
                        className={styles.media}
                    />
                ) : (
                    <img
                        src={src}
                        alt="Maximized view"
                        className={styles.media}
                    />
                )}
            </div>
        </div>
    );
}

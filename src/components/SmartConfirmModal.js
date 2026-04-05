"use client";

import styles from "./SmartConfirmModal.module.css";

export default function SmartConfirmModal({ isOpen, onClose, onConfirm, title, message, isDestructive = true, loading = false }) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        {isDestructive ? '⚠️' : '❓'}
                    </div>
                    <h3>{title}</h3>
                </div>
                <div className={styles.body}>
                    <p>{message}</p>
                </div>
                <div className={styles.footer}>
                    <button
                        className={styles.cancelBtn}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className={`${styles.confirmBtn} ${isDestructive ? styles.destructive : styles.neutral}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Deleting..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}

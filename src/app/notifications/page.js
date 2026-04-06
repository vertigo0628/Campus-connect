"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, getDocs, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./notifications.module.css";

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "notifications"),
            where("recipientId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleMarkAllRead = async () => {
        if (!user || notifications.length === 0) return;

        const unreadPosts = notifications.filter(n => !n.isRead);
        if (unreadPosts.length === 0) return;

        try {
            const batch = writeBatch(db);
            unreadPosts.forEach(n => {
                const ref = doc(db, "notifications", n.id);
                batch.update(ref, { isRead: true });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all read:", error);
        }
    };

    const handleNotificationClick = async (n) => {
        // Mark as read
        if (!n.isRead) {
            try {
                await updateDoc(doc(db, "notifications", n.id), { isRead: true });
            } catch (error) {
                console.error("Error marking notification as read:", error);
            }
        }

        // Navigate
        if (n.type === 'like' || n.type === 'comment') {
            router.push(`/sema?post=${n.postId}`);
        } else if (n.type === 'follow') {
            router.push(`/user/${n.senderId}`);
        }
    };

    const timeAgo = (timestamp) => {
        if (!timestamp) return "Just now";
        const now = new Date();
        const past = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = Math.floor((now - past) / 1000);
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    if (!user) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.empty}>
                    <h3>Please log in</h3>
                    <p>You need to be logged in to view your activity.</p>
                </div>
            </div>
        );
    }

    return (
        <main className={styles.wrapper}>
            <header className={styles.header}>
                <h1>Activity</h1>
                {notifications.some(n => !n.isRead) && (
                    <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                        Mark all as read
                    </button>
                )}
            </header>

            {loading ? (
                <div className={styles.list}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={styles.notification} style={{ opacity: 0.5 }}>
                            <div className={styles.avatar} style={{ background: 'var(--surface)' }} />
                            <div className={styles.content}>
                                <div style={{ height: '14px', width: '40%', background: 'var(--surface)', borderRadius: '4px', marginBottom: '8px' }} />
                                <div style={{ height: '12px', width: '70%', background: 'var(--surface)', borderRadius: '4px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    </div>
                    <h3>No activity yet</h3>
                    <p>When someone likes your posts or follows you, you'll see it here.</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`${styles.notification} ${!n.isRead ? styles.unread : ''}`}
                        >
                            {!n.isRead && <div className={styles.unreadDot} />}
                            <img
                                src={n.senderPhoto || `https://ui-avatars.com/api/?name=${n.senderName}&background=1c1c1e&color=f5f5f7`}
                                alt={n.senderName}
                                className={styles.avatar}
                            />
                            <div className={styles.content}>
                                <span className={styles.senderName}>{n.senderName} </span>
                                <span className={styles.message}>{n.text}</span>
                                <div className={styles.meta}>{timeAgo(n.createdAt)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}

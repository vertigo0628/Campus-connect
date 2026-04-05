"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import styles from "./SocialListModal.module.css";

export default function SocialListModal({ isOpen, onClose, userId, type }) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchList = async () => {
            setLoading(true);
            try {
                const subColl = type === 'FOLLOWERS' ? 'followers' : 'following';
                const listRef = collection(db, "profiles", userId, subColl);
                const snapshot = await getDocs(query(listRef, limit(100)));

                const userIds = snapshot.docs.map(doc => doc.id);

                // Fetch basic profile info for each ID
                const userProfiles = await Promise.all(
                    userIds.map(async (id) => {
                        const pRef = doc(db, "profiles", id);
                        const pSnap = await getDoc(pRef);
                        if (pSnap.exists()) {
                            return { id, ...pSnap.data() };
                        }
                        return { id, displayName: "Unknown User" };
                    })
                );

                setList(userProfiles);
            } catch (error) {
                console.error("Error fetching social list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchList();
    }, [isOpen, userId, type]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{type === 'FOLLOWERS' ? 'Followers' : 'Following'}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.message}>Loading list...</div>
                    ) : list.length === 0 ? (
                        <div className={styles.message}>No {type.toLowerCase()} yet.</div>
                    ) : (
                        <div className={styles.userList}>
                            {list.map(user => (
                                <Link
                                    href={`/user/${user.id}`}
                                    key={user.id}
                                    className={styles.userItem}
                                    onClick={onClose}
                                >
                                    <img
                                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                                        alt={user.displayName}
                                        className={styles.avatar}
                                    />
                                    <div className={styles.userInfo}>
                                        <span className={styles.name}>{user.displayName}</span>
                                        <span className={styles.handle}>@{user.id.substring(0, 6)}</span>
                                    </div>
                                    <div className={styles.viewBtn}>View</div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

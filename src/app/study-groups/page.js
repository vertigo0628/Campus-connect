"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, serverTimestamp, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import styles from "./study-groups.module.css";

export default function StudyGroupsPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        unit: "",
        topic: "",
        venue: "",
        time: "",
        description: "",
        contact: ""
    });

    useEffect(() => {
        const q = query(collection(db, "study_groups"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGroups(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!user) return;

        try {
            await addDoc(collection(db, "study_groups"), {
                ...formData,
                creatorId: user.uid,
                creatorName: user.displayName || "Anonymous Comrade",
                members: [user.uid],
                memberNames: [user.displayName || "Comrade"],
                createdAt: serverTimestamp()
            });
            setFormData({ unit: "", topic: "", venue: "", time: "", description: "", contact: "" });
            setShowModal(false);
        } catch (error) {
            console.error("Error creating group:", error);
        }
    };

    const handleJoinGroup = async (groupId, group) => {
        if (!user || group.members?.includes(user.uid)) return;

        try {
            const groupRef = doc(db, "study_groups", groupId);
            await updateDoc(groupRef, {
                members: arrayUnion(user.uid),
                memberNames: arrayUnion(user.displayName || "Comrade")
            });
        } catch (error) {
            console.error("Error joining group:", error);
        }
    };

    const filteredGroups = groups.filter(g =>
        g.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className={styles.container}>
            <Navigation />
            <div className={styles.content}>
                {/* Hub Navigation */}
                <div className={styles.hubNav}>
                    <Link href="/discover" className={styles.hubNavBtn}>Comrades</Link>
                    <Link href="/study-groups" className={`${styles.hubNavBtn} ${styles.hubNavBtnActive}`}>Study Groups</Link>
                    <Link href="/hostels" className={styles.hubNavBtn}>Hostels</Link>
                </div>

                <header className={styles.header}>
                    <h1>Study Groups Hub 📚</h1>
                    <p>Connect, collaborate, and crush those units.</p>

                    <div className={styles.controls}>
                        <div className={styles.searchBar}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search by unit code or topic..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                            + Start a Group
                        </button>
                    </div>
                </header>

                <div className={styles.list}>
                    {loading ? (
                        <div className={styles.info}>Loading circles...</div>
                    ) : filteredGroups.length === 0 ? (
                        <div className={styles.info}>No groups found. Be a leader and start one!</div>
                    ) : (
                        filteredGroups.map(group => (
                            <div key={group.id} className={styles.groupCard}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h3 className={styles.unitCode}>{group.unit}</h3>
                                        <p className={styles.topicName}>{group.topic}</p>
                                    </div>
                                    <span className={styles.memberCount}>👤 {group.members?.length || 1}</span>
                                </div>

                                <p className={styles.desc}>{group.description}</p>

                                <div className={styles.details}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.icon}>📍</span>
                                        <span>{group.venue}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.icon}>🕒</span>
                                        <span>{group.time}</span>
                                    </div>
                                </div>

                                {group.members?.includes(user?.uid) && (
                                    <div className={styles.joinedSection}>
                                        <div className={styles.contactInfo}>
                                            <span className={styles.label}>📞 Exchange Info:</span>
                                            <p className={styles.contactText}>{group.contact || "Reach out to the lead at the venue!"}</p>
                                        </div>
                                        <div className={styles.membersList}>
                                            <span className={styles.label}>👥 Circle Members:</span>
                                            <p className={styles.memberNames}>{group.memberNames?.join(", ")}</p>
                                        </div>
                                    </div>
                                )}

                                <div className={styles.cardFooter}>
                                    <div className={styles.leadInfo}>
                                        <span className={styles.leadLabel}>Circle Lead</span>
                                        <span className={styles.leadName}>{group.creatorName}</span>
                                    </div>
                                    <button
                                        className={group.members?.includes(user?.uid) ? styles.joinedBtn : styles.joinBtn}
                                        onClick={() => handleJoinGroup(group.id, group)}
                                        disabled={group.members?.includes(user?.uid)}
                                    >
                                        {group.members?.includes(user?.uid) ? "Joined ✓" : "Join Circle"}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Start a Study Circle 🎓</h2>
                        <form onSubmit={handleCreateGroup}>
                            <input
                                type="text"
                                placeholder="Unit Code (e.g. BIT 2102)"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Discussion Topic"
                                value={formData.topic}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Venue (e.g. Science Park Bench 4)"
                                value={formData.venue}
                                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Time (e.g. Wed @ 4:00 PM)"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Short description for comrades..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Contact/WhatsApp Link (Optional)"
                                value={formData.contact}
                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                style={{ background: '#000', border: '1px solid #222', padding: '14px', borderRadius: '12px', color: '#fff' }}
                            />
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" className={styles.submitBtn}>Create Circle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

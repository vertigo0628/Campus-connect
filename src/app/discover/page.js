"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import styles from "./discover.module.css";
import { useAuth } from "@/context/AuthContext";

export default function DiscoverPage() {
    const { user: currentUser } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = ["All", "Tech", "Tutoring", "Creative", "Business", "Other"];

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const snapshot = await getDocs(collection(db, "profiles"));
                const loaded = [];
                snapshot.forEach(doc => loaded.push({ id: doc.id, ...doc.data() }));
                setProfiles(loaded);
            } catch (error) {
                console.error("Error fetching profiles:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    const filteredProfiles = useMemo(() => {
        let result = profiles;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(p =>
                (p.displayName && p.displayName.toLowerCase().includes(q)) ||
                (p.bio && p.bio.toLowerCase().includes(q)) ||
                (p.services && p.services.some(s => s.toLowerCase().includes(q)))
            );
        }

        if (activeCategory !== "All") {
            result = result.filter(p =>
                p.services && p.services.some(s => s.toLowerCase().includes(activeCategory.toLowerCase()))
            );
        }

        return result;
    }, [profiles, searchQuery, activeCategory]);

    // Top 8 suggested comrades (those with avatars first)
    const suggested = useMemo(() => {
        return profiles
            .filter(p => p.photoURL && p.id !== currentUser?.uid)
            .slice(0, 8);
    }, [profiles, currentUser]);

    const getRating = (p) => {
        if (!p.reviewCount || p.reviewCount === 0 || !p.rating) return null;
        return (p.rating / p.reviewCount).toFixed(1);
    };

    return (
        <div className={styles.wrapper}>
            {/* Hub Navigation — Sticky */}
            <div className={styles.stickyHubHeader}>
                <div className={styles.hubNav}>
                    <Link href="/discover" className={`${styles.hubNavBtn} ${styles.hubNavBtnActive}`}>Comrades</Link>
                    <Link href="/study-groups" className={styles.hubNavBtn}>Study Groups</Link>
                    <Link href="/hostels" className={styles.hubNavBtn}>Hostels</Link>
                </div>
            </div>

            {/* Search Header */}
            <div className={styles.searchHeader}>
                <div className={styles.searchBar}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.searchSvg}>
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search comrades, services..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Category Pills */}
                <div className={styles.pills}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`${styles.pill} ${activeCategory === cat ? styles.pillActive : ""}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Suggested Row */}
            {suggested.length > 0 && !searchQuery && (
                <section className={styles.suggestedSection}>
                    <h3 className={styles.suggestedTitle}>Suggested</h3>
                    <div className={styles.suggestedRow}>
                        {suggested.map(p => (
                            <Link href={`/user/${p.id}`} key={p.id} className={styles.suggestedItem}>
                                <div className={styles.suggestedRing}>
                                    <img
                                        src={p.photoURL}
                                        alt={p.displayName}
                                        className={styles.suggestedAvatar}
                                    />
                                </div>
                                <span className={styles.suggestedName}>
                                    {(p.displayName || "Comrade").split(" ")[0]}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Results */}
            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loadingGrid}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={styles.skeletonAvatar} />
                                <div className={styles.skeletonLine} />
                                <div className={styles.skeletonLineShort} />
                            </div>
                        ))}
                    </div>
                ) : filteredProfiles.length === 0 ? (
                    <div className={styles.empty}>
                        <span style={{ fontSize: "2.5rem" }}>🔍</span>
                        <h3>No comrades found</h3>
                        <p>Try a different search or category.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filteredProfiles.map(profile => (
                            <Link href={`/user/${profile.id}`} key={profile.id} className={styles.card}>
                                <div className={styles.cardTop}>
                                    <img
                                        src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || "C"}&background=1c1c1e&color=f5f5f7&size=200`}
                                        alt={profile.displayName}
                                        className={styles.cardAvatar}
                                    />
                                    {getRating(profile) && (
                                        <div className={styles.cardRating}>
                                            ⭐ {getRating(profile)}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.cardBody}>
                                    <h4 className={styles.cardName}>{profile.displayName || "Comrade"}</h4>
                                    <p className={styles.cardBio}>
                                        {profile.bio ? profile.bio.substring(0, 60) + (profile.bio.length > 60 ? "..." : "") : "No bio yet"}
                                    </p>
                                    {profile.services && profile.services.length > 0 && (
                                        <div className={styles.cardTags}>
                                            {profile.services.slice(0, 2).map((s, i) => (
                                                <span key={i} className={styles.tag}>{s}</span>
                                            ))}
                                            {profile.services.length > 2 && (
                                                <span className={styles.tagMore}>+{profile.services.length - 2}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

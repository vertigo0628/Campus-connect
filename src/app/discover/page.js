"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./discover.module.css";
import { useAuth } from "@/context/AuthContext";

export default function DiscoverPage() {
    const { user: currentUser } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch up to 50 active profiles for the network
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const profilesRef = collection(db, "profiles");
                const snapshot = await getDocs(profilesRef);
                const loadedProfiles = [];
                snapshot.forEach(doc => {
                    loadedProfiles.push({ id: doc.id, ...doc.data() });
                });
                setProfiles(loadedProfiles);
            } catch (error) {
                console.error("Error fetching discover profiles:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, []);

    // Client-side real-time filtering engine
    const filteredProfiles = useMemo(() => {
        if (!searchQuery.trim()) return profiles;

        const query = searchQuery.toLowerCase().trim();

        return profiles.filter(profile => {
            // Match Name
            if (profile.displayName && profile.displayName.toLowerCase().includes(query)) return true;

            // Match Bio
            if (profile.bio && profile.bio.toLowerCase().includes(query)) return true;

            // Match Services
            if (profile.services && Array.isArray(profile.services)) {
                if (profile.services.some(service => service.toLowerCase().includes(query))) return true;
            }

            return false;
        });
    }, [profiles, searchQuery]);

    return (
        <div className={styles.discoverWrapper}>
            {/* Minimal Nav */}
            <nav style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
                    <Logo size={24} />
                    <span style={{ fontWeight: 'bold' }}>Campus Connect</span>
                </Link>
                {currentUser && (
                    <Link href="/profile" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>My Profile</Link>
                )}
            </nav>

            <div className={styles.container}>
                <div className={styles.searchSection}>
                    <h1 className={styles.searchTitle}>Discover Comrades</h1>
                    <p className={styles.searchSubtitle}>Find talented students, study partners, and services on campus.</p>

                    <div className={styles.searchBar}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name, bio, or services (e.g. 'Laptop Repair')..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className={styles.messageContainer}>Loading network...</div>
                ) : (
                    <>
                        {filteredProfiles.length === 0 ? (
                            <div className={styles.messageContainer}>
                                <h2>No Comrades Found</h2>
                                <p>We couldn't find anyone matching "{searchQuery}". Try a different keyword.</p>
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {filteredProfiles.map(profile => (
                                    <Link href={`/user/${profile.id}`} key={profile.id} className={styles.card}>
                                        <img
                                            src={profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.displayName}
                                            alt={profile.displayName}
                                            className={styles.avatar}
                                        />
                                        <h3 className={styles.name}>{profile.displayName}</h3>

                                        <div className={styles.rating}>
                                            <span className={styles.ratingStar}>⭐</span>
                                            <span style={{ fontWeight: 600 }}>{profile.rating || 'New'}</span>
                                            {profile.reviewCount > 0 && <span>({profile.reviewCount})</span>}
                                        </div>

                                        {profile.services && profile.services.length > 0 && (
                                            <div className={styles.services}>
                                                {profile.services.slice(0, 3).map((service, i) => (
                                                    <span key={i} className={styles.serviceTag}>{service}</span>
                                                ))}
                                                {profile.services.length > 3 && (
                                                    <span className={styles.serviceTag}>+{profile.services.length - 3}</span>
                                                )}
                                            </div>
                                        )}

                                        <p className={styles.bio}>{profile.bio || "No bio provided."}</p>

                                        <div className={styles.viewProfileBtn}>View Profile</div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

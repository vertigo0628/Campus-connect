"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, setDoc, deleteDoc, query, where, getDocs, updateDoc, serverTimestamp, orderBy, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import styles from "@/app/profile/profile.module.css";
import Link from "next/link";
import Logo from "@/components/Logo";
import MediaModal from "@/components/MediaModal";
import ReviewSystem from "@/components/ReviewSystem";
import SocialListModal from "@/components/SocialListModal";

export default function PublicProfile({ params }) {
    const unwrappedParams = use(params);
    const targetUserId = unwrappedParams.id;
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('POSTS');
    // Media View State
    const [mediaModal, setMediaModal] = useState({ isOpen: false, src: "", type: "image" });
    const [socialModal, setSocialModal] = useState({ isOpen: false, type: 'FOLLOWERS' });
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const isVideo = (url) => {
        if (!url) return false;
        try {
            const cleanUrl = url.split('?')[0].toLowerCase();
            return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm');
        } catch (e) {
            return false;
        }
    };

    const openMedia = (src) => {
        setMediaModal({
            isOpen: true,
            src,
            type: isVideo(src) ? "video" : "image"
        });
    };

    const closeMedia = () => {
        setMediaModal(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        if (!targetUserId) return;

        const fetchProfile = async () => {
            try {
                const docRef = doc(db, "profiles", targetUserId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfile(docSnap.data());
                } else {
                    setProfile(null);
                }

                // Check if already following
                if (currentUser) {
                    const followRef = doc(db, "profiles", targetUserId, "followers", currentUser.uid);
                    const followSnap = await getDoc(followRef);
                    setIsFollowing(followSnap.exists());
                }
            } catch (error) {
                console.error("Error fetching public profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [targetUserId, currentUser]);

    const handleFollowToggle = async () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setFollowLoading(true);
        try {
            const followerRef = doc(db, "profiles", targetUserId, "followers", currentUser.uid);
            const followingRef = doc(db, "profiles", currentUser.uid, "following", targetUserId);
            const targetProfileRef = doc(db, "profiles", targetUserId);
            const myProfileRef = doc(db, "profiles", currentUser.uid);

            // Ensure my profile exists before following/unfollowing
            const myProfileSnap = await getDoc(myProfileRef);
            if (!myProfileSnap.exists()) {
                await setDoc(myProfileRef, {
                    displayName: currentUser.displayName || "Comrade",
                    bio: "Welcome to my campus profile!",
                    services: ["Textbook Trade", "Study Groups"],
                    gallery: [],
                    photoURL: currentUser.photoURL || null,
                    rating: "New",
                    reviewCount: 0,
                    followers: 0,
                    following: 0
                });
            }

            if (isFollowing) {
                // UNFOLLOW
                await deleteDoc(followerRef);
                await deleteDoc(followingRef);
                await updateDoc(targetProfileRef, { followers: increment(-1) });
                await updateDoc(myProfileRef, { following: increment(-1) });
                setIsFollowing(false);
                setProfile(prev => ({ ...prev, followers: (prev.followers || 1) - 1 }));
            } else {
                // FOLLOW
                await setDoc(followerRef, { timestamp: serverTimestamp() });
                await setDoc(followingRef, { timestamp: serverTimestamp() });
                await updateDoc(targetProfileRef, { followers: increment(1) });
                await updateDoc(myProfileRef, { following: increment(1) });
                setIsFollowing(true);
                setProfile(prev => ({ ...prev, followers: (prev.followers || 0) + 1 }));
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.profileWrapper}>
                <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>Loading profile...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className={styles.profileWrapper}>
                <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>User not found.</div>
            </div>
        );
    }

    return (
        <div className={styles.profileWrapper}>
            {/* Minimal Nav for Public View */}

            <header className={styles.header}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatarContainer} style={{ cursor: 'pointer' }} onClick={() => openMedia(profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.displayName, "image")}>
                        <img
                            src={profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.displayName}
                            alt="Profile"
                            className={styles.avatar}
                        />
                        <div className={styles.avatarOverlay}>
                            <span>View</span>
                        </div>
                    </div>
                </div>

                <div className={styles.infoSection}>
                    <div className={styles.topRow}>
                        <h1 className={styles.username}>{profile.displayName}</h1>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {currentUser && currentUser.uid !== targetUserId && (
                                <>
                                    <button
                                        className={isFollowing ? styles.unfollowBtn : styles.followBtn}
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                    >
                                        {followLoading ? "..." : (isFollowing ? "Unfollow" : "Follow")}
                                    </button>
                                    <Link
                                        href={`/messages?to=${targetUserId}&name=${encodeURIComponent(profile.displayName || "Comrade")}`}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            textDecoration: 'none',
                                            display: 'inline-block',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--must-gold, #ffb700)';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.borderColor = 'var(--must-gold, #ffb700)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                                            e.currentTarget.style.color = '#fff';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                        }}
                                    >
                                        Message
                                    </Link>
                                </>
                            )}
                            {!currentUser && (
                                <button className={styles.followBtn} onClick={() => router.push('/login')}>
                                    Follow
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.gallery?.length || 0}</span> posts
                        </div>
                        <div className={styles.statItem} onClick={() => setSocialModal({ isOpen: true, type: 'FOLLOWERS' })} style={{ cursor: 'pointer' }}>
                            <span className={styles.statValue}>{profile.followers || 0}</span> followers
                        </div>
                        <div className={styles.statItem} onClick={() => setSocialModal({ isOpen: true, type: 'FOLLOWING' })} style={{ cursor: 'pointer' }}>
                            <span className={styles.statValue}>{profile.following || 0}</span> following
                        </div>
                    </div>

                    <div className={styles.bioSection}>
                        <span className={styles.displayName}>{profile.displayName}</span>
                        <p className={styles.bio}>{profile.bio}</p>

                        <div className={styles.servicesGrid}>
                            {profile.services?.map((service, i) => (
                                <span key={i} className={styles.serviceTag}>{service}</span>
                            ))}
                        </div>

                        {profile.reviewCount > 0 && (
                            <div className={styles.ratingContainer}>
                                <span className={styles.star}>⭐</span>
                                <span style={{ fontWeight: 600, color: 'white' }}>
                                    {(profile.rating / profile.reviewCount).toFixed(1)}
                                </span>
                                <span>({profile.reviewCount} reviews)</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className={styles.tabs}>
                <div className={`${styles.tab} ${activeTab === 'POSTS' ? styles.activeTab : ''}`} onClick={() => setActiveTab('POSTS')}>
                    POSTS
                </div>
                <div className={`${styles.tab} ${activeTab === 'REVIEWS' ? styles.activeTab : ''}`} onClick={() => setActiveTab('REVIEWS')}>
                    REVIEWS
                </div>
            </div>

            {activeTab === 'POSTS' && (
                <div className={styles.galleryContent}>
                    <div className={styles.galleryGrid}>
                        {profile.gallery?.map((img, i) => (
                            <div key={i} className={styles.galleryItem} style={{ cursor: 'pointer' }} onClick={() => openMedia(img)}>
                                {isVideo(img) ? (
                                    <>
                                        <video src={img} className={styles.itemImage} muted style={{ pointerEvents: 'none' }} />
                                        <div className={styles.reelIcon}>▶</div>
                                    </>
                                ) : (
                                    <img src={img} alt={`Gallery ${i}`} className={styles.itemImage} style={{ pointerEvents: 'none' }} />
                                )}
                            </div>
                        ))}
                    </div>
                    {(!profile.gallery || profile.gallery.length === 0) && (
                        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                            <h2>No Posts Yet</h2>
                            <p>This user hasn't shared any content.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'REVIEWS' && (
                <ReviewSystem targetUserId={targetUserId} targetUserName={profile.displayName} />
            )}

            <MediaModal
                isOpen={mediaModal.isOpen}
                src={mediaModal.src}
                type={mediaModal.type}
                onClose={closeMedia}
            />

            <SocialListModal
                isOpen={socialModal.isOpen}
                onClose={() => setSocialModal(prev => ({ ...prev, isOpen: false }))}
                userId={targetUserId}
                type={socialModal.type}
            />
        </div>
    );
}

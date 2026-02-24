"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import styles from "./profile.module.css";
import Logo from "@/components/Logo";
import LogoutModal from "@/components/LogoutModal";
import Link from "next/link";

export default function Profile() {
    const { user, loading: authLoading, logout } = useAuth();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const router = useRouter();
    const [profile, setProfile] = useState({
        displayName: "",
        bio: "",
        photoURL: null,
        services: [],
        gallery: [],
        rating: "New",
        reviewCount: 0,
        followers: 0,
        following: 0
    });
    const [activeTab, setActiveTab] = useState('POSTS');
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/signup");
            return;
        }

        if (user) {
            fetchProfile();
        }
    }, [user, authLoading, router]);

    const fetchProfile = async () => {
        try {
            const docRef = doc(db, "profiles", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile({
                    displayName: data.displayName || "",
                    bio: data.bio || "",
                    photoURL: data.photoURL || null,
                    services: data.services || [],
                    gallery: data.gallery || [],
                    rating: data.rating || "New",
                    reviewCount: data.reviewCount || 0,
                    followers: data.followers || 0,
                    following: data.following || 0
                });
            } else {
                const initialProfile = {
                    displayName: user.displayName || "Comrade",
                    bio: "Welcome to my campus profile!",
                    services: ["Textbook Trade", "Study Groups"],
                    gallery: [],
                    photoURL: user.photoURL || null,
                    rating: "New",
                    reviewCount: 0,
                    followers: 0,
                    following: 0
                };
                await setDoc(docRef, initialProfile);
                setProfile(initialProfile);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const docRef = doc(db, "profiles", user.uid);
            await updateDoc(docRef, profile);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!supabase) {
            alert("Supabase is not configured! Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.");
            return;
        }

        setUploading(true);
        try {
            const bucket = type === 'avatar' ? 'avatars' : 'showcase';
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.uid}/${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { cacheControl: '3600', upsert: true });

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            const docRef = doc(db, "profiles", user.uid);
            if (type === 'avatar') {
                await updateDoc(docRef, { photoURL: publicUrl });
                setProfile(prev => ({ ...prev, photoURL: publicUrl }));
            } else {
                await updateDoc(docRef, { gallery: arrayUnion(publicUrl) });
                setProfile(prev => ({ ...prev, gallery: [...prev.gallery, publicUrl] }));
            }
        } catch (error) {
            console.error("Error uploading image to Supabase:", error);
            const message = error.message || "Unknown error";
            alert(`Upload failed: ${message}. \n\nCheck if your 'avatars' and 'showcase' buckets are Public and have RLS policies set to allow 'Insert'.`);
        } finally {
            setUploading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className={styles.profileWrapper} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <p>Loading comrade profile...</p>
            </div>
        );
    }

    return (
        <div className={styles.profileWrapper}>
            <nav style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "16px 32px", background: "rgba(10, 14, 23, 0.8)", backdropFilter: "blur(10px)", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                    <Logo size={32} />
                    <span style={{ fontWeight: 700, color: "white" }}>Campus Connect</span>
                </Link>
                <div style={{ display: "flex", gap: "12px" }}>
                    <Link href="/" style={{ padding: "8px 16px", borderRadius: "100px", color: "white", textDecoration: "none", fontSize: "0.9rem" }}>Home</Link>
                    <button onClick={() => setIsLogoutModalOpen(true)} style={{ background: "transparent", border: "1px solid var(--border)", color: "white", padding: "8px 16px", borderRadius: "100px", cursor: "pointer" }}>Logout</button>
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={() => {
                    logout();
                    setIsLogoutModalOpen(false);
                }}
            />

            <header className={styles.header}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatarContainer} onClick={() => fileInputRef.current.click()}>
                        <img
                            src={profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.displayName}
                            alt="Profile"
                            className={styles.avatar}
                        />
                        <div className={styles.uploadOverlay}>
                            {uploading ? "Uploading..." : "Change Photo"}
                        </div>
                    </div>
                    <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        onChange={(e) => handleImageUpload(e, 'avatar')}
                        accept="image/*"
                    />
                </div>

                <div className={styles.infoSection}>
                    <div className={styles.topRow}>
                        <h1 className={styles.username}>{user.email.split('@')[0]}</h1>
                        <button className={styles.editBtn} onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? "Cancel" : "Edit Profile"}
                        </button>
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.gallery.length}</span> posts
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.followers || 0}</span> followers
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.following || 0}</span> following
                        </div>
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleUpdateProfile} className={styles.editForm}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Display Name</label>
                                <input
                                    className={styles.input}
                                    value={profile.displayName}
                                    onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Bio</label>
                                <textarea
                                    className={styles.textarea}
                                    value={profile.bio}
                                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                                />
                            </div>
                            <button type="submit" className={styles.saveBtn}>Save Changes</button>
                        </form>
                    ) : (
                        <div className={styles.bioSection}>
                            <span className={styles.displayName}>{profile.displayName}</span>
                            <p className={styles.bio}>{profile.bio}</p>

                            <div className={styles.servicesGrid}>
                                {profile.services.map((service, i) => (
                                    <span key={i} className={styles.serviceTag}>{service}</span>
                                ))}
                            </div>

                            <div className={styles.ratingContainer}>
                                <span className={styles.star}>⭐</span>
                                <span style={{ fontWeight: 600, color: 'white' }}>{profile.rating || 'New'}</span>
                                {profile.reviewCount > 0 && <span>({profile.reviewCount} reviews)</span>}
                            </div>
                        </div>
                    )}
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
                    <div style={{ textAlign: "center", margin: "20px 0" }}>
                        <button
                            className={styles.editBtn}
                            onClick={() => galleryInputRef.current.click()}
                            disabled={uploading}
                        >
                            {uploading ? "Uploading..." : "Add New Post"}
                        </button>
                        <input
                            type="file"
                            hidden
                            ref={galleryInputRef}
                            onChange={(e) => handleImageUpload(e, 'gallery')}
                            accept="image/*,video/*"
                        />
                    </div>

                    <div className={styles.galleryGrid}>
                        {profile.gallery.map((img, i) => (
                            <div key={i} className={styles.galleryItem}>
                                {img.endsWith('.mp4') || img.endsWith('.mov') ? (
                                    <video src={img} className={styles.itemImage} />
                                ) : (
                                    <img src={img} alt={`Gallery ${i}`} className={styles.itemImage} />
                                )}
                                <div className={styles.itemOverlay}>✨</div>
                            </div>
                        ))}
                    </div>
                    {profile.gallery.length === 0 && (
                        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                            <h2>No Posts Yet</h2>
                            <p>Share your campus life with the network.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'REVIEWS' && (
                <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                    <h2>No Reviews Yet</h2>
                    <p>When Comrades rate your services, they will appear here.</p>
                </div>
            )}
        </div>
    );
}

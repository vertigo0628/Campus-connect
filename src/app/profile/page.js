"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import styles from "./profile.module.css";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function Profile() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState({
        displayName: "",
        bio: "",
        services: [],
        gallery: [],
        photoURL: ""
    });
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
                setProfile(docSnap.data());
            } else {
                const initialProfile = {
                    displayName: user.displayName || "Comrade",
                    bio: "Welcome to my campus profile!",
                    services: ["Textbook Trade", "Study Groups"],
                    gallery: [],
                    photoURL: user.photoURL || ""
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

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            alert("Please add your Supabase credentials to .env.local to enable uploads!");
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
            alert("Error uploading image. Ensure you have created the 'avatars' and 'showcase' buckets in Supabase and set them to public.");
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
                    <button onClick={logout} style={{ background: "transparent", border: "1px solid var(--border)", color: "white", padding: "8px 16px", borderRadius: "100px", cursor: "pointer" }}>Logout</button>
                </div>
            </nav>

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
                        </div>
                    )}
                </div>
            </header>

            <div className={styles.servicesSection}>
                <div className={styles.sectionTitle}>Services & Interests</div>
                <div className={styles.servicesGrid}>
                    {profile.services.map((service, i) => (
                        <span key={i} className={styles.serviceTag}>{service}</span>
                    ))}
                    <button
                        className={styles.serviceTag}
                        style={{ background: "transparent", borderStyle: "dashed", cursor: "pointer" }}
                        onClick={() => {
                            const s = prompt("Add a service (e.g., Laptop Repair, Tutoring)");
                            if (s) {
                                const newServices = [...profile.services, s];
                                setProfile(prev => ({ ...prev, services: newServices }));
                                updateDoc(doc(db, "profiles", user.uid), { services: newServices });
                            }
                        }}
                    >
                        + Add Service
                    </button>
                </div>
            </div>

            <div className={styles.servicesSection} style={{ marginTop: "60px" }}>
                <div className={styles.sectionTitle}>Showcase Gallery</div>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <button
                        className={styles.editBtn}
                        onClick={() => galleryInputRef.current.click()}
                        disabled={uploading}
                    >
                        {uploading ? "Uploading..." : "Add Photo/Video to Gallery"}
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
                    {profile.gallery.length === 0 && (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                            No items yet. Showcase your products or shop!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

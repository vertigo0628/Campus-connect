"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import styles from "./profile.module.css";
import Logo from "@/components/Logo";
import LogoutModal from "@/components/LogoutModal";
import Link from "next/link";
import MediaModal from "@/components/MediaModal";
import SocialListModal from "@/components/SocialListModal";
import SmartConfirmModal from "@/components/SmartConfirmModal";

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
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: "", message: "", action: null, loading: false });
    const [mediaModal, setMediaModal] = useState({ isOpen: false, src: "", type: "image" });
    const [socialModal, setSocialModal] = useState({ isOpen: false, type: 'FOLLOWERS' });
    const [myContributions, setMyContributions] = useState({ posts: [], groups: [], hostels: [] });
    const [dashboardLoading, setDashboardLoading] = useState(false);

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
        if (!authLoading && !user) {
            router.push("/signup");
            return;
        }

        if (user) {
            fetchMyContributions();

            // Real-time Profile Listener
            const docRef = doc(db, "profiles", user.uid);
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
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
                    // Create initial profile if it doesn't exist
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
                    setDoc(docRef, initialProfile);
                }
            });

            return () => unsubscribe();
        }
    }, [user, authLoading, router]);

    const fetchMyContributions = async () => {
        if (!user) return;
        setDashboardLoading(true);
        try {
            const userId = user.uid;

            // Fetch Posts
            const postsQ = query(collection(db, "sema_posts"), where("creatorId", "==", userId));
            const postsSnap = await getDocs(postsQ);
            const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'POST' }));

            // Fetch Groups
            const groupsQ = query(collection(db, "study_groups"), where("creatorId", "==", userId));
            const groupsSnap = await getDocs(groupsQ);
            const groups = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'GROUP' }));

            // Fetch Hostels
            const hostelsQ = query(collection(db, "hostels"), where("creatorId", "==", userId));
            const hostelsSnap = await getDocs(hostelsQ);
            const hostels = hostelsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'HOSTEL' }));

            setMyContributions({ posts, groups, hostels });
        } catch (error) {
            console.error("Error fetching contributions:", error);
        } finally {
            setDashboardLoading(false);
        }
    };

    const handleDeleteContribution = (id, coll, type) => {
        setConfirmState({
            isOpen: true,
            title: `Delete ${type}`,
            message: `Are you sure you want to permanently delete this ${type.toLowerCase()}?`,
            action: async () => {
                setConfirmState(prev => ({ ...prev, loading: true }));
                try {
                    await deleteDoc(doc(db, coll, id));
                    setMyContributions(prev => ({
                        ...prev,
                        [`${type.toLowerCase()}s`]: prev[`${type.toLowerCase()}s`].filter(item => item.id !== id)
                    }));
                    setConfirmState({ isOpen: false });
                } catch (error) {
                    console.error("Error deleting item:", error);
                    alert("Failed to delete item.");
                    setConfirmState({ isOpen: false });
                }
            }
        });
    };

    const handleDeleteAccount = () => {
        setConfirmState({
            isOpen: true,
            title: "Delete Account Permanently?",
            message: "This will securely wipe all your listed Hostels, Study Groups, Sema Posts, and your Profile. This action is irreversible.",
            action: async () => {
                setConfirmState(prev => ({ ...prev, loading: true }));
                try {
                    // Delete listed contributions implicitly fetched in dashboard
                    for (const p of myContributions.posts) await deleteDoc(doc(db, "sema_posts", p.id));
                    for (const g of myContributions.groups) await deleteDoc(doc(db, "study_groups", g.id));
                    for (const h of myContributions.hostels) await deleteDoc(doc(db, "hostels", h.id));

                    // Delete profile
                    await deleteDoc(doc(db, "profiles", user.uid));

                    // Delete Auth User
                    await deleteUser(user);
                    router.push("/");
                } catch (error) {
                    console.error("Account deletion failed:", error);
                    alert("Account deletion requires recent authentication. Please log out and log back in, then try again.");
                    setConfirmState({ isOpen: false });
                }
            }
        });
    };

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

            {/* Logout Confirmation Modal */}
            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={() => {
                    logout();
                    setIsLogoutModalOpen(false);
                    router.push("/");
                }}
            />

            {/* Smart Deletion Confirmation Modal */}
            <SmartConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => !confirmState.loading && setConfirmState({ isOpen: false })}
                onConfirm={confirmState.action}
                title={confirmState.title}
                message={confirmState.message}
                loading={confirmState.loading}
            />

            <MediaModal
                isOpen={mediaModal.isOpen}
                src={mediaModal.src}
                type={mediaModal.type}
                onClose={closeMedia}
            />

            <header className={styles.header}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatarWrapper} onClick={() => openMedia(profile.photoURL || "https://ui-avatars.com/api/?name=" + (profile.displayName || user.email.split('@')[0]), "image")}>
                            <img
                                src={profile.photoURL || "https://ui-avatars.com/api/?name=" + (profile.displayName || user.email.split('@')[0])}
                                alt="Profile Avatar"
                                className={styles.avatar}
                            />
                            <div className={styles.avatarOverlay}>
                                <span>View</span>
                            </div>
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
                        <button
                            className={styles.editBtn}
                            style={{ background: 'transparent', color: 'var(--primary-light)', border: '1px solid var(--primary)' }}
                            onClick={() => router.push(`/user/${user.uid}`)}
                        >
                            View Public Profile
                        </button>
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.gallery.length}</span> posts
                        </div>
                        <div className={styles.statItem} onClick={() => setSocialModal({ isOpen: true, type: 'FOLLOWERS' })} style={{ cursor: 'pointer' }}>
                            <span className={styles.statValue}>{profile.followers || 0}</span> followers
                        </div>
                        <div className={styles.statItem} onClick={() => setSocialModal({ isOpen: true, type: 'FOLLOWING' })} style={{ cursor: 'pointer' }}>
                            <span className={styles.statValue}>{profile.following || 0}</span> following
                        </div>
                    </div>

                    {/* Profile Completion Guide */}
                    {!isEditing && (profile.gallery.length === 0 || profile.services.length < 3 || !profile.bio) && (
                        <div className={styles.completionCard}>
                            <div className={styles.completionHeader}>
                                <span className={styles.completionTitle}>Finish your Profile</span>
                                <span className={styles.completionPercent}>
                                    {Math.round(((profile.gallery.length > 0 ? 1 : 0) + (profile.services.length >= 3 ? 1 : 0) + (profile.bio ? 1 : 0)) / 3 * 100)}%
                                </span>
                            </div>
                            <div className={styles.completionList}>
                                {!profile.bio && <div className={styles.completionItem}>✍️ Add a compelling bio</div>}
                                {profile.services.length < 3 && <div className={styles.completionItem}>🛠️ List at least 3 services</div>}
                                {profile.gallery.length === 0 && <div className={styles.completionItem}>📸 Upload your first gallery photo</div>}
                            </div>
                        </div>
                    )}

                    {isEditing ? (
                        <form onSubmit={handleUpdateProfile} className={styles.editForm}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Profile Photo</label>
                                <div className={styles.photoEditSection}>
                                    <img
                                        src={profile.photoURL || "https://ui-avatars.com/api/?name=" + (profile.displayName || user.email.split('@')[0])}
                                        alt="Current Avatar"
                                        className={styles.photoPreview}
                                    />
                                    <button
                                        type="button"
                                        className={styles.editBtn}
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        {uploading ? "Uploading..." : "Change Photo"}
                                    </button>
                                </div>
                            </div>

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

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Services Offered</label>
                                <div className={styles.servicesGrid} style={{ marginBottom: "12px", justifyContent: "flex-start" }}>
                                    {profile.services.map((service, i) => (
                                        <span key={i} className={styles.serviceTag}>
                                            {service}
                                            <button
                                                type="button"
                                                style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: '6px', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                                                onClick={() => {
                                                    setProfile(prev => ({ ...prev, services: prev.services.filter((_, index) => index !== i) }));
                                                }}
                                            >×</button>
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        className={styles.input}
                                        id="newServiceInput"
                                        placeholder="Add a service (e.g. Graphic Design)"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.target.value.trim();
                                                if (val && !profile.services.includes(val)) {
                                                    setProfile(prev => ({ ...prev, services: [...prev.services, val] }));
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.editBtn}
                                        onClick={() => {
                                            const input = document.getElementById('newServiceInput');
                                            const val = input.value.trim();
                                            if (val && !profile.services.includes(val)) {
                                                setProfile(prev => ({ ...prev, services: [...prev.services, val] }));
                                                input.value = '';
                                            }
                                        }}
                                    >Add</button>
                                </div>
                            </div>

                            <button type="submit" className={styles.saveBtn}>Save Changes</button>
                            <div style={{ marginTop: '30px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                                <button type="button" className={styles.deleteBtn} style={{ background: 'rgba(255, 69, 58, 0.1)', color: '#ff453a', padding: '12px 24px', borderRadius: 'var(--radius-md)' }} onClick={handleDeleteAccount}>
                                    Delete Account Permanently
                                </button>
                            </div>
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
                <div className={`${styles.tab} ${activeTab === 'DASHBOARD' ? styles.activeTab : ''}`} onClick={() => setActiveTab('DASHBOARD')}>
                    DASHBOARD ⚡
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
                            <div key={i} className={styles.galleryItem} onClick={() => openMedia(img)}>
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

            {activeTab === 'DASHBOARD' && (
                <div className={styles.dashboardGrid}>
                    <div className={styles.dashboardSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Your Sema Posts 🗣️</h3>
                            <span className={styles.count}>{myContributions.posts.length}</span>
                        </div>
                        <div className={styles.contributionsList}>
                            {myContributions.posts.map(post => (
                                <div key={post.id} className={styles.contributionItem}>
                                    <div className={styles.itemMain}>
                                        <p className={styles.itemTitle}>{post.content?.substring(0, 40)}...</p>
                                        <span className={styles.itemSub}>{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={() => handleDeleteContribution(post.id, "sema_posts", "POST")}>Delete</button>
                                </div>
                            ))}
                            {myContributions.posts.length === 0 && <p className={styles.empty}>No posts yet.</p>}
                        </div>
                    </div>

                    <div className={styles.dashboardSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Active Study Groups 📚</h3>
                            <span className={styles.count}>{myContributions.groups.length}</span>
                        </div>
                        <div className={styles.contributionsList}>
                            {myContributions.groups.map(group => (
                                <div key={group.id} className={styles.contributionItem}>
                                    <div className={styles.itemMain}>
                                        <p className={styles.itemTitle}>{group.unit}: {group.topic}</p>
                                        <span className={styles.itemSub}>{group.venue}</span>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={() => handleDeleteContribution(group.id, "study_groups", "GROUP")}>Delete</button>
                                </div>
                            ))}
                            {myContributions.groups.length === 0 && <p className={styles.empty}>No groups started.</p>}
                        </div>
                    </div>

                    <div className={styles.dashboardSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Listed Hostels 🏠</h3>
                            <span className={styles.count}>{myContributions.hostels.length}</span>
                        </div>
                        <div className={styles.contributionsList}>
                            {myContributions.hostels.map(hostel => (
                                <div key={hostel.id} className={styles.contributionItem}>
                                    <div className={styles.itemMain}>
                                        <p className={styles.itemTitle}>{hostel.name}</p>
                                        <span className={styles.itemSub}>{hostel.location} • {hostel.price}</span>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={() => handleDeleteContribution(hostel.id, "hostels", "HOSTEL")}>Delete</button>
                                </div>
                            ))}
                            {myContributions.hostels.length === 0 && <p className={styles.empty}>No hostels listed.</p>}
                        </div>
                    </div>
                </div>
            )}

            <SocialListModal
                isOpen={socialModal.isOpen}
                onClose={() => setSocialModal(prev => ({ ...prev, isOpen: false }))}
                userId={user?.uid}
                type={socialModal.type}
            />
        </div>
    );
}

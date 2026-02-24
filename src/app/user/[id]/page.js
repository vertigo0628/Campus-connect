"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import styles from "@/app/profile/profile.module.css";
import Link from "next/link";
import Logo from "@/components/Logo";
import MediaModal from "@/components/MediaModal";

export default function PublicProfile({ params }) {
    const unwrappedParams = use(params);
    const targetUserId = unwrappedParams.id;
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('POSTS');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Review Form State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState("");

    // Media View State
    const [mediaModal, setMediaModal] = useState({ isOpen: false, src: "", type: "image" });

    const openMedia = (src, type = "image") => {
        setMediaModal({ isOpen: true, src, type });
    };

    const closeMedia = () => {
        setMediaModal(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        if (!targetUserId) return;

        const fetchProfileAndReviews = async () => {
            try {
                // 1. Fetch Profile
                const docRef = doc(db, "profiles", targetUserId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfile(docSnap.data());
                } else {
                    setProfile(null); // User not found
                }

                // 2. Fetch Reviews
                const reviewsRef = collection(db, "reviews");
                const q = query(reviewsRef, where("targetUserId", "==", targetUserId));
                const querySnapshot = await getDocs(q);

                const loadedReviews = [];
                querySnapshot.forEach((doc) => {
                    loadedReviews.push({ id: doc.id, ...doc.data() });
                });
                // Sort client-side if needed since we didn't index orderBy on multiple fields yet
                loadedReviews.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
                setReviews(loadedReviews);

            } catch (error) {
                console.error("Error fetching public profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileAndReviews();
    }, [targetUserId]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewError("");
        if (!currentUser) {
            setReviewError("You must be logged in to leave a review.");
            return;
        }
        if (currentUser.uid === targetUserId) {
            setReviewError("You cannot review yourself.");
            return;
        }
        if (!comment.trim()) {
            setReviewError("Please provide a comment.");
            return;
        }

        setSubmittingReview(true);
        try {
            // 1. Add Review to Collection
            const newReview = {
                targetUserId,
                reviewerId: currentUser.uid,
                reviewerName: currentUser.displayName || currentUser.email.split('@')[0],
                reviewerPhoto: currentUser.photoURL || null,
                rating,
                comment: comment.trim(),
                timestamp: serverTimestamp()
            };

            await addDoc(collection(db, "reviews"), newReview);

            // 2. Update Target User's Profile Stats
            const currentCount = profile.reviewCount || 0;
            const currentRating = profile.rating === "New" ? 0 : parseFloat(profile.rating);

            const newCount = currentCount + 1;
            const totalScore = (currentRating * currentCount) + rating;
            const newAverageRating = (totalScore / newCount).toFixed(1);

            await updateDoc(doc(db, "profiles", targetUserId), {
                reviewCount: newCount,
                rating: newAverageRating
            });

            // Update local state to reflect new review instantly
            setReviews([{ ...newReview, timestamp: { toMillis: () => Date.now() } }, ...reviews]);
            setProfile(prev => ({ ...prev, reviewCount: newCount, rating: newAverageRating }));
            setComment("");
            setRating(5);

        } catch (err) {
            console.error("Error submitting review:", err);
            setReviewError("Failed to submit review. Try again.");
        } finally {
            setSubmittingReview(false);
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
            <nav style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
                    <Logo size={24} />
                    <span style={{ fontWeight: 'bold' }}>Campus Connect</span>
                </Link>
                {currentUser && currentUser.uid !== targetUserId && (
                    <Link href="/profile" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Back to My Profile</Link>
                )}
            </nav>

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
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.gallery?.length || 0}</span> posts
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.followers || 0}</span> followers
                        </div>
                        <div className={styles.statItem}>
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
                                <span style={{ fontWeight: 600, color: 'white' }}>{profile.rating}</span>
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
                            <div key={i} className={styles.galleryItem} style={{ cursor: 'pointer' }} onClick={() => openMedia(img, img.endsWith('.mp4') || img.endsWith('.mov') ? 'video' : 'image')}>
                                {img.endsWith('.mp4') || img.endsWith('.mov') ? (
                                    <video src={img} className={styles.itemImage} muted />
                                ) : (
                                    <img src={img} alt={`Gallery ${i}`} className={styles.itemImage} />
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
                <div style={{ marginTop: '20px' }}>

                    {/* Leave a Review Form (Only for other logged in users) */}
                    {currentUser && currentUser.uid !== targetUserId && (
                        <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Leave a Review for {profile.displayName}</h3>
                            {reviewError && <p style={{ color: '#ff4d4f', fontSize: '0.85rem', marginBottom: '12px' }}>{reviewError}</p>}
                            <form onSubmit={handleReviewSubmit}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Rating (1-5 Stars)</label>
                                    <select
                                        value={rating}
                                        onChange={(e) => setRating(Number(e.target.value))}
                                        className={styles.input}
                                        style={{ width: '100px' }}
                                    >
                                        <option value={5}>5 ⭐</option>
                                        <option value={4}>4 ⭐</option>
                                        <option value={3}>3 ⭐</option>
                                        <option value={2}>2 ⭐</option>
                                        <option value={1}>1 ⭐</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Your Review</label>
                                    <textarea
                                        className={styles.textarea}
                                        placeholder="Describe your experience with their services..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className={styles.saveBtn} disabled={submittingReview}>
                                    {submittingReview ? "Submitting..." : "Post Review"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Display Reviews */}
                    <div>
                        {reviews.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                                <h2>No Reviews Yet</h2>
                                <p>Be the first to leave a review!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {reviews.map(review => (
                                    <div key={review.id} style={{ background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <img
                                                    src={review.reviewerPhoto || "https://ui-avatars.com/api/?name=" + review.reviewerName}
                                                    alt={review.reviewerName}
                                                    style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{review.reviewerName}</span>
                                            </div>
                                            <span style={{ color: '#fbbc05', fontWeight: 'bold' }}>{review.rating} ⭐</span>
                                        </div>
                                        <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.4', marginTop: '8px' }}>{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <MediaModal
                isOpen={mediaModal.isOpen}
                src={mediaModal.src}
                type={mediaModal.type}
                onClose={closeMedia}
            />
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import styles from "./ReviewSystem.module.css";

export default function ReviewSystem({ targetUserId, targetUserName }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!targetUserId) return;

        const q = query(
            collection(db, "reviews"),
            where("targetId", "==", targetUserId),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setReviews(reviewData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [targetUserId]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user || user.uid === targetUserId) return;

        setIsSubmitting(true);
        try {
            // 1. Add Review
            await addDoc(collection(db, "reviews"), {
                targetId: targetUserId,
                authorId: user.uid,
                authorName: user.displayName || "Anonymous Student",
                authorPhoto: user.photoURL || null,
                rating: Number(rating),
                text,
                timestamp: serverTimestamp()
            });

            // 2. Update Target User's Aggregate Rating
            const targetRef = doc(db, "profiles", targetUserId);
            await updateDoc(targetRef, {
                rating: increment(Number(rating)),
                reviewCount: increment(1)
            });

            setText("");
            setRating(5);
        } catch (error) {
            console.error("Error submitting review:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.reviewContainer}>
            <div className={styles.reviewHeader}>
                <h3>Comrade Reviews (Verified) ⭐️</h3>
                <p>Showing feedback for {targetUserName}</p>
            </div>

            {user && user.uid !== targetUserId && (
                <div className={styles.reviewForm}>
                    <h4>Rate your experience</h4>
                    <form onSubmit={handleSubmitReview}>
                        <div className={styles.starRating}>
                            {[5, 4, 3, 2, 1].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={rating >= star ? styles.starActive : styles.starInactive}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <textarea
                            placeholder="How was the service? (Be honest, be a comrade)"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={isSubmitting || !text.trim()}>
                            {isSubmitting ? "Submitting..." : "Submit Review"}
                        </button>
                    </form>
                </div>
            )}

            <div className={styles.reviewList}>
                {loading ? (
                    <p className={styles.infoText}>Loading reviews...</p>
                ) : reviews.length === 0 ? (
                    <p className={styles.infoText}>No reviews yet. Be the first to vouch for this comrade!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className={styles.reviewCard}>
                            <div className={styles.reviewMeta}>
                                <div className={styles.authorGroup}>
                                    <span className={styles.authorName}>{review.authorName}</span>
                                    <div className={styles.stars}>{"★".repeat(review.rating)}</div>
                                </div>
                                <span className={styles.time}>
                                    {review.timestamp?.toDate().toLocaleDateString() || "Just now"}
                                </span>
                            </div>
                            <p className={styles.reviewText}>{review.text}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

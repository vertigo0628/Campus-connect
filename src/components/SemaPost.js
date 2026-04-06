"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment, setDoc, deleteDoc, getDoc, collection, query, orderBy, limit, onSnapshot, serverTimestamp, addDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SmartConfirmModal from "@/components/SmartConfirmModal";
import styles from "./SemaPost.module.css";

export default function SemaPost({ post, onCommentOpen }) {
    const { user } = useAuth();
    const router = useRouter();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [commentCount, setCommentCount] = useState(post.commentCount || 0);
    const [commentPreview, setCommentPreview] = useState([]);
    const [showFullCaption, setShowFullCaption] = useState(false);
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: "", message: "", action: null, loading: false });

    // Real-time listener for post-level stats (likes + comments)
    useEffect(() => {
        if (!post.id) return;
        const postRef = doc(db, "sema_posts", post.id);
        const unsub = onSnapshot(postRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setLikeCount(data.likeCount || 0);
                setCommentCount(data.commentCount || 0);
            }
        });
        return () => unsub();
    }, [post.id]);

    // Check if user already liked
    useEffect(() => {
        if (!user || !post.id) return;
        const checkLike = async () => {
            const likeRef = doc(db, "sema_posts", post.id, "likes", user.uid);
            const snap = await getDoc(likeRef);
            setLiked(snap.exists());
        };
        checkLike();
    }, [user, post.id]);

    // Fetch latest 2 comments for preview
    useEffect(() => {
        if (!post.id) return;
        const commentsRef = collection(db, "sema_posts", post.id, "comments");
        const q = query(commentsRef, orderBy("createdAt", "desc"), limit(2));
        const unsub = onSnapshot(q, (snap) => {
            setCommentPreview(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
        });
        return () => unsub();
    }, [post.id]);

    const handleLike = async () => {
        if (!user) return;
        const likeRef = doc(db, "sema_posts", post.id, "likes", user.uid);
        const postRef = doc(db, "sema_posts", post.id);

        try {
            if (liked) {
                await deleteDoc(likeRef);
                await updateDoc(postRef, { likeCount: increment(-1) });
                setLikeCount(prev => Math.max(0, prev - 1));
                setLiked(false);
            } else {
                await setDoc(likeRef, { timestamp: serverTimestamp() });
                await updateDoc(postRef, { likeCount: increment(1) });
                setLikeCount(prev => prev + 1);
                setLiked(true);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const handleDeletePost = () => {
        setConfirmState({
            isOpen: true,
            title: "Delete Post",
            message: "Are you sure you want to permanently delete this post?",
            action: async () => {
                setConfirmState(prev => ({ ...prev, loading: true }));
                try {
                    await deleteDoc(doc(db, "sema_posts", post.id));
                    setConfirmState({ isOpen: false });
                } catch (error) {
                    console.error("Error deleting post:", error);
                    setConfirmState({ isOpen: false });
                }
            }
        });
    };

    const handleMessageAuthor = async () => {
        if (!user) {
            alert("Please log in to message the author.");
            return;
        }
        if (post.creatorId === 'anonymous' || !post.creatorId) {
            alert("Cannot message an anonymous user.");
            return;
        }
        if (post.creatorId === user.uid) {
            alert("You cannot message yourself.");
            return;
        }

        try {
            const convoId = [user.uid, post.creatorId].sort().join("_");
            const convoRef = doc(db, "conversations", convoId);
            const convoSnap = await getDoc(convoRef);

            if (!convoSnap.exists()) {
                await setDoc(convoRef, {
                    participants: [user.uid, post.creatorId],
                    updatedAt: serverTimestamp(),
                    lastMessage: "Started exploring a post setup",
                    participantsData: {
                        [user.uid]: { displayName: user.displayName || user.email?.split("@")[0] || "User", photoURL: user.photoURL || null },
                        [post.creatorId]: { displayName: post.creatorName || "Comrade", photoURL: null } // The target comrade
                    }
                });
            }

            const postRefText = post.content ? `Hey! I saw your post: "${post.content.substring(0, 40)}..."` : `Hey! I saw your image post on the Feed.`;

            await addDoc(collection(db, "conversations", convoId, "messages"), {
                text: postRefText,
                senderId: user.uid,
                createdAt: serverTimestamp(),
                type: "text"
            });

            await updateDoc(convoRef, {
                updatedAt: serverTimestamp(),
                lastMessage: postRefText
            });

            router.push(`/messages`);
        } catch (error) {
            console.error("Error initiating DM:", error);
            alert("Could not start conversation.");
        }
    };

    const timeAgo = (timestamp) => {
        if (!timestamp) return "Just now";
        const now = new Date();
        const past = new Date(timestamp.toMillis ? timestamp.toMillis() : timestamp);
        const diff = Math.floor((now - past) / 1000);
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    const caption = post.content || "";
    const isLong = caption.length > 120;

    return (
        <div className={styles.post}>
            {/* Header: Avatar + Username + Time */}
            <div className={styles.postHeader}>
                <Link href={post.creatorId && post.creatorId !== "anonymous" ? `/user/${post.creatorId}` : "#"} style={{ display: 'flex', gap: '10px', textDecoration: 'none', alignItems: 'center', flex: 1 }}>
                    <img
                        src={`https://ui-avatars.com/api/?name=${post.creatorName || "C"}&background=1c1c1e&color=f5f5f7`}
                        alt={post.creatorName}
                        className={styles.postAvatar}
                    />
                    <div className={styles.postUser}>
                        <span className={styles.postUsername}>{post.creatorName || "Anonymous Comrade"}</span>
                        <span className={styles.postMeta}>{post.category || "General"}</span>
                    </div>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.postTag}>{timeAgo(post.createdAt)}</span>
                    {user?.uid === post.creatorId && (
                        <button onClick={handleDeletePost} style={{ background: 'transparent', border: 'none', color: '#ff453a', cursor: 'pointer', padding: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Media */}
            {post.mediaUrl && (
                <div style={{ width: '100%' }}>
                    {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls className={styles.postMedia} />
                    ) : (
                        <img src={post.mediaUrl} alt="Post media" className={styles.postMedia} />
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className={styles.postActions}>
                <button className={`${styles.actionBtn} ${liked ? styles.liked : ""}`} onClick={handleLike}>
                    {liked ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                    )}
                </button>
                <button className={styles.actionBtn} onClick={onCommentOpen} style={{ position: 'relative' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                    {commentCount > 0 && (
                        <span className={styles.commentBadge}>{commentCount > 99 ? '99+' : commentCount}</span>
                    )}
                </button>
                <button className={styles.actionBtn} onClick={handleMessageAuthor} title="Message Author">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
            </div>

            {/* Body */}
            <div className={styles.postBody}>
                {likeCount > 0 && <div className={styles.postLikes}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</div>}

                {caption && (
                    <div className={styles.postCaption}>
                        <strong>{post.creatorName || "Anonymous"}</strong>
                        {isLong && !showFullCaption ? (
                            <>
                                {caption.substring(0, 120)}...
                                <span className={styles.captionMore} onClick={() => setShowFullCaption(true)}> more</span>
                            </>
                        ) : (
                            caption
                        )}
                    </div>
                )}

                {post.commentCount > 0 && (
                    <div className={styles.commentPreview} onClick={onCommentOpen}>
                        View all {post.commentCount} comments
                    </div>
                )}

                {/* Recent Comments Preview */}
                {commentPreview.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                        {commentPreview.map(c => (
                            <div key={c.id} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                                <strong>{(c.authorName || c.userName || "Comrade").split(" ")[0]} </strong>
                                <span style={{ color: 'var(--text-secondary)' }}>{c.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                <span className={styles.postTime}>{timeAgo(post.createdAt)} ago</span>
            </div>

            <SmartConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => !confirmState.loading && setConfirmState({ isOpen: false })}
                onConfirm={confirmState.action}
                title={confirmState.title}
                message={confirmState.message}
                loading={confirmState.loading}
            />
        </div>
    );
}

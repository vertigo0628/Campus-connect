"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import SmartConfirmModal from "@/components/SmartConfirmModal";
import styles from "./CommentSection.module.css";

export default function CommentSection({ isOpen, onClose, post }) {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: "", message: "", action: null, loading: false });
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !post?.id) return;

        const commentsRef = collection(db, "sema_posts", post.id, "comments");
        const q = query(commentsRef, orderBy("createdAt", "asc"));

        const unsub = onSnapshot(q, (snap) => {
            setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => unsub();
    }, [isOpen, post?.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user || !post?.id) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, "sema_posts", post.id, "comments"), {
                text: newComment.trim(),
                authorId: user.uid,
                authorName: user.displayName || user.email?.split("@")[0] || "Comrade",
                authorPhoto: user.photoURL || null,
                createdAt: serverTimestamp()
            });

            // Increment comment count on the post
            await updateDoc(doc(db, "sema_posts", post.id), {
                commentCount: increment(1)
            });

            setNewComment("");
        } catch (error) {
            console.error("Error posting comment:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = (commentId) => {
        setConfirmState({
            isOpen: true,
            title: "Delete Comment",
            message: "Are you sure you want to delete your comment?",
            action: async () => {
                setConfirmState(prev => ({ ...prev, loading: true }));
                try {
                    await deleteDoc(doc(db, "sema_posts", post.id, "comments", commentId));
                    await updateDoc(doc(db, "sema_posts", post.id), {
                        commentCount: increment(-1)
                    });
                    setConfirmState({ isOpen: false });
                } catch (error) {
                    console.error("Error deleting comment:", error);
                    setConfirmState({ isOpen: false });
                }
            }
        });
    };

    const timeAgo = (timestamp) => {
        if (!timestamp) return "now";
        const now = new Date();
        const past = new Date(timestamp.toMillis ? timestamp.toMillis() : timestamp);
        const diff = Math.floor((now - past) / 1000);
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.drawer} onClick={e => e.stopPropagation()}>
                <div className={styles.handle} />

                <div className={styles.header}>
                    <h3>Comments</h3>
                    <span className={styles.count}>{comments.length}</span>
                </div>

                <div className={styles.commentList}>
                    {comments.length === 0 ? (
                        <div className={styles.empty}>No comments yet. Be the first! 💬</div>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} className={styles.commentItem}>
                                <div className={styles.commentAvatar}>
                                    {c.authorPhoto ? (
                                        <img src={c.authorPhoto} alt="" className={styles.commentAvatarImg} />
                                    ) : (
                                        <span>{c.authorName?.charAt(0)?.toUpperCase() || "C"}</span>
                                    )}
                                </div>
                                <div className={styles.commentBody}>
                                    <div className={styles.commentMeta}>
                                        <span className={styles.commentAuthor}>{c.authorName}</span>
                                        <span className={styles.commentTime}>{timeAgo(c.createdAt)}</span>
                                        {user?.uid === c.authorId && (
                                            <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'transparent', border: 'none', color: '#ff453a', cursor: 'pointer', padding: 0, marginLeft: '6px' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                            </button>
                                        )}
                                    </div>
                                    <p className={styles.commentText}>{c.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>

                {user ? (
                    <form className={styles.inputArea} onSubmit={handleSubmit}>
                        <div className={styles.inputAvatar}>
                            {user.displayName?.charAt(0)?.toUpperCase() || "Y"}
                        </div>
                        <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            className={styles.commentInput}
                            maxLength={300}
                        />
                        <button type="submit" disabled={submitting || !newComment.trim()} className={styles.postBtn}>
                            {submitting ? "..." : "Post"}
                        </button>
                    </form>
                ) : (
                    <div className={styles.loginPrompt}>Log in to comment</div>
                )}
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

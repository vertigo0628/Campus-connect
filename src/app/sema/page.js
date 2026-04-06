"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import SemaPost from "@/components/SemaPost";
import CommentSection from "@/components/CommentSection";
import styles from "./sema.module.css";

export default function SemaPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("foryou"); // "foryou" | "following"
    const [filter, setFilter] = useState("All");
    const [newMessage, setNewMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComposeExpanded, setIsComposeExpanded] = useState(false);
    const [commentPost, setCommentPost] = useState(null);

    const categories = ["All", "Security", "Wellness", "Academics", "Market", "Gossip"];

    // Real-time feed listener
    useEffect(() => {
        const q = query(
            collection(db, "sema_posts"),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const feedItems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Client side filtering for tabs to save Firebase indexes
                let filtered = feedItems;
                if (filter !== "All") {
                    filtered = filtered.filter(p => p.category === filter);
                }
                // (Following filter logic would go here, currently showing all for "foryou")
                setPosts(filtered);
                setLoading(false);
            },
            (error) => {
                console.error("Firestore Permission Error:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [filter]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFilePreview(URL.createObjectURL(file));
            setIsComposeExpanded(true);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedFile) return;

        setIsSubmitting(true);
        try {
            let mediaUrl = null;
            let mediaType = null;

            if (selectedFile) {
                const fileName = `${Date.now()}-${selectedFile.name}`;
                const { data, error } = await supabase.storage
                    .from('showcase')
                    .upload(`sema/${fileName}`, selectedFile, {
                        contentType: selectedFile.type || 'image/jpeg',
                        upsert: true
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('showcase')
                    .getPublicUrl(`sema/${fileName}`);

                mediaUrl = publicUrl;
                mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
            }

            await addDoc(collection(db, "sema_posts"), {
                content: newMessage,
                category: filter === "All" ? "General" : filter,
                createdAt: serverTimestamp(),
                likeCount: 0,
                commentCount: 0,
                status: "Public",
                mediaUrl,
                mediaType,
                creatorId: user?.uid || "anonymous",
                creatorName: user?.displayName || "Anonymous Comrade",
            });

            setNewMessage("");
            setSelectedFile(null);
            setFilePreview(null);
            setIsComposeExpanded(false);
        } catch (error) {
            console.error("Error posting:", error);
            alert("Failed to post message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.feedWrapper}>
            {/* Sticky Header: Category Pills + Feed Tabs */}
            <div className={styles.stickyHeader}>
                {/* Category Pills Header */}
                <div className={styles.categoryBar}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`${styles.catPill} ${filter === cat ? styles.catPillActive : ""}`}
                            onClick={() => setFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Instagram-style Feed Tabs */}
                <div className={styles.feedTabs}>
                    <div
                        className={`${styles.feedTab} ${activeTab === 'foryou' ? styles.feedTabActive : ''}`}
                        onClick={() => setActiveTab('foryou')}
                    >
                        For You
                    </div>
                    <div
                        className={`${styles.feedTab} ${activeTab === 'following' ? styles.feedTabActive : ''}`}
                        onClick={() => setActiveTab('following')}
                    >
                        Following
                    </div>
                </div>
            </div>

            {/* Compose Card */}
            {user && (
                <div className={styles.composeCard}>
                    <img
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || "C"}&background=1c1c1e&color=f5f5f7`}
                        alt="You"
                        className={styles.composeAvatar}
                    />
                    {!isComposeExpanded ? (
                        <>
                            <input
                                type="text"
                                placeholder="What's happening on campus?"
                                className={styles.composeInput}
                                onClick={() => setIsComposeExpanded(true)}
                                readOnly
                            />
                            <div className={styles.composeActions}>
                                <label className={styles.composeBtn}>
                                    📸
                                    <input type="file" accept="image/*,video/*" hidden onChange={handleFileSelect} />
                                </label>
                            </div>
                        </>
                    ) : (
                        <div className={styles.composeExpanded} style={{ flex: 1 }}>
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="What's happening on campus?"
                                className={styles.composeTextarea}
                                autoFocus
                            />

                            {filePreview && (
                                <div className={styles.mediaPreview}>
                                    {selectedFile?.type.startsWith('video/') ? (
                                        <video src={filePreview} controls />
                                    ) : (
                                        <img src={filePreview} alt="Upload preview" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                        className={styles.removeMedia}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            <div className={styles.composeFooter}>
                                <div className={styles.composeActions}>
                                    <label className={styles.composeBtn}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                        <input type="file" accept="image/*,video/*" hidden onChange={handleFileSelect} />
                                    </label>
                                    <select
                                        className={styles.categorySelect}
                                        value={filter !== "All" ? filter : "General"}
                                        onChange={(e) => setFilter(e.target.value)}
                                    >
                                        <option value="General">General</option>
                                        <option value="Security">Security</option>
                                        <option value="Academics">Academics</option>
                                        <option value="Market">Market</option>
                                        <option value="Gossip">Gossip</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        className={styles.composeBtn}
                                        onClick={() => setIsComposeExpanded(false)}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePostSubmit}
                                        disabled={isSubmitting || (!newMessage.trim() && !selectedFile)}
                                        className={styles.submitBtn}
                                    >
                                        {isSubmitting ? "Posting..." : "Post"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Feed List */}
            <div className={styles.postList}>
                {loading ? (
                    <div className={styles.loading}>Loading feed...</div>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <SemaPost
                            key={post.id}
                            post={post}
                            onCommentOpen={() => setCommentPost(post)}
                        />
                    ))
                ) : (
                    <div className={styles.empty}>
                        <h3>No posts found</h3>
                        <p>Be the first to post about {filter === "All" ? "what's happening" : filter.toLowerCase()}.</p>
                    </div>
                )}
            </div>

            {/* Mobile Floating Compose Button */}
            {user && (
                <div
                    className={styles.mobileFab}
                    onClick={() => {
                        setIsComposeExpanded(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
            )}

            {/* Comments Drawer Placeholder */}
            {commentPost && (
                <CommentSection
                    post={commentPost}
                    onClose={() => setCommentPost(null)}
                />
            )}
        </div>
    );
}

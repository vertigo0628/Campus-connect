"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, getDocs, limit, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import SmartConfirmModal from "@/components/SmartConfirmModal";
import Link from "next/link";
import styles from "./messages.module.css";

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className={styles.wrapper}><div className={styles.emptyState}><p>Loading messages...</p></div></div>}>
            <MessagesContent />
        </Suspense>
    );
}

function MessagesContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const toUserId = searchParams.get("to");
    const toUserName = searchParams.get("name");

    const [conversations, setConversations] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: "", message: "", action: null, loading: false });
    const bottomRef = useRef(null);

    const isInitializing = useRef(false);

    // Load all conversations for current user
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "conversations"),
            where("participants", "array-contains", user.uid)
        );

        const unsub = onSnapshot(q, (snap) => {
            const convos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Client-side sort to bypass missing composite index in Firestore
            convos.sort((a, b) => {
                const timeA = a.lastMessageAt?.seconds || 0;
                const timeB = b.lastMessageAt?.seconds || 0;
                return timeB - timeA;
            });
            setConversations(convos);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    // Safely auto-create or open conversation from URL without race conditions
    useEffect(() => {
        if (!user || loading || !toUserId || activeConvo || isInitializing.current) return;

        const initConvo = async () => {
            isInitializing.current = true;
            try {
                const existing = conversations.find(c => c.participants.includes(toUserId));

                if (existing) {
                    setActiveConvo(existing);
                    window.history.replaceState(null, '', '/messages');
                } else {
                    const myName = user.displayName || user.email?.split("@")[0] || "Comrade";
                    const names = {};
                    names[user.uid] = myName;
                    names[toUserId] = decodeURIComponent(toUserName || "Comrade");

                    const convoRef = await addDoc(collection(db, "conversations"), {
                        participants: [user.uid, toUserId],
                        participantNames: names,
                        lastMessage: "",
                        lastMessageAt: serverTimestamp(),
                        createdAt: serverTimestamp()
                    });

                    setActiveConvo({ id: convoRef.id, participants: [user.uid, toUserId], participantNames: names });
                    window.history.replaceState(null, '', '/messages');
                }
            } catch (err) {
                console.error("Error setting up chat:", err);
            } finally {
                // We keep it true so it doesn't try again for the same URL param
                isInitializing.current = false;
            }
        };

        initConvo();
    }, [user, loading, toUserId, conversations, activeConvo, toUserName]);

    // Load messages for active conversation efficiently
    useEffect(() => {
        if (!activeConvo?.id) return;

        const q = query(
            collection(db, "conversations", activeConvo.id, "messages"),
            orderBy("createdAt", "desc"),
            limit(100)
        );

        const unsub = onSnapshot(q, (snap) => {
            const rawMessages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Reverse to show oldest first at the top
            setMessages(rawMessages.reverse());
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => unsub();
    }, [activeConvo?.id]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMsg.trim() || !activeConvo?.id || !user) return;

        setSending(true);
        try {
            const senderName = user.displayName || user.email?.split("@")[0] || "Comrade";

            await addDoc(collection(db, "conversations", activeConvo.id, "messages"), {
                text: newMsg.trim(),
                senderId: user.uid,
                senderName,
                createdAt: serverTimestamp(),
                type: "text"
            });

            await updateDoc(doc(db, "conversations", activeConvo.id), {
                lastMessage: newMsg.trim().substring(0, 50),
                lastMessageAt: serverTimestamp()
            });

            setNewMsg("");
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = (msgId) => {
        const isLastMessage = msgId === messages[messages.length - 1]?.id;

        let newLastText = "Start chatting...";
        if (messages.length > 1) {
            const prevMsg = messages[messages.length - 2];
            newLastText = prevMsg.type === "contact_share" ? "📇 Contact Shared" : prevMsg.text.substring(0, 50);
        }

        setConfirmState({
            isOpen: true,
            title: "Unsend Message",
            message: "Are you sure you want to unsend this message? It will be deleted for both you and the comrade.",
            action: async () => {
                setConfirmState(prev => ({ ...prev, loading: true }));
                try {
                    await deleteDoc(doc(db, "conversations", activeConvo.id, "messages", msgId));

                    if (isLastMessage) {
                        await updateDoc(doc(db, "conversations", activeConvo.id), {
                            lastMessage: newLastText
                        });
                    }

                    setConfirmState({ isOpen: false });
                } catch (error) {
                    console.error("Error deleting message:", error);
                    setConfirmState({ isOpen: false });
                }
            }
        });
    };

    const handleShareContact = async () => {
        if (!activeConvo?.id || !user) return;
        const contact = user.email || "No email";
        const senderName = user.displayName || user.email?.split("@")[0] || "Comrade";

        try {
            await addDoc(collection(db, "conversations", activeConvo.id, "messages"), {
                text: `📇 Contact Shared: ${contact}`,
                senderId: user.uid,
                senderName,
                createdAt: serverTimestamp(),
                type: "contact_share"
            });

            await updateDoc(doc(db, "conversations", activeConvo.id), {
                lastMessage: "📇 Shared contact info",
                lastMessageAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sharing contact:", error);
        }
    };

    const getOtherId = (convo) => {
        if (!user || !convo?.participants) return null;
        return convo.participants.find(id => id !== user.uid);
    };

    const getOtherName = (convo) => {
        if (!convo?.participantNames || !user) return "Comrade";
        const otherId = convo.participants.find(p => p !== user.uid);
        return convo.participantNames[otherId] || "Comrade";
    };

    const timeAgo = (timestamp) => {
        if (!timestamp) return "";
        const now = new Date();
        const past = new Date(timestamp.toMillis ? timestamp.toMillis() : timestamp);
        const diff = Math.floor((now - past) / 1000);
        if (diff < 60) return "now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    if (!user) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.emptyState}>
                    <h2>💬 Messages</h2>
                    <p>Log in to start chatting with comrades.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.layout}>
                {/* Sidebar */}
                <div className={`${styles.sidebar} ${activeConvo ? styles.hideMobile : ""}`}>
                    <div className={styles.sidebarHeader}>
                        <h2>Messages</h2>
                    </div>

                    <div className={styles.convoList}>
                        {loading ? (
                            <div className={styles.emptyConvo}>Loading chats...</div>
                        ) : conversations.length === 0 ? (
                            <div className={styles.emptyConvo}>
                                <p>No conversations yet.</p>
                                <p style={{ fontSize: "0.8rem", color: "#555" }}>
                                    Message a comrade from their post or profile!
                                </p>
                            </div>
                        ) : (
                            conversations.map(convo => (
                                <div
                                    key={convo.id}
                                    className={`${styles.convoItem} ${activeConvo?.id === convo.id ? styles.activeConvo : ""}`}
                                    onClick={() => setActiveConvo(convo)}
                                >
                                    <div className={styles.convoAvatar}>
                                        {getOtherName(convo).charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.convoInfo}>
                                        <span className={styles.convoName}>{getOtherName(convo)}</span>
                                        <span className={styles.convoPreview}>{convo.lastMessage || "Start chatting..."}</span>
                                    </div>
                                    <span className={styles.convoTime}>{timeAgo(convo.lastMessageAt)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Window */}
                <div className={`${styles.chatWindow} ${!activeConvo ? styles.hideMobile : ""}`}>
                    {!activeConvo ? (
                        <div className={styles.noChatSelected}>
                            <span style={{ fontSize: "3rem" }}>💬</span>
                            <h3>Select a conversation</h3>
                            <p>Choose a comrade to start chatting</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className={styles.chatHeader}>
                                <button className={styles.backBtn} onClick={() => setActiveConvo(null)}>←</button>
                                <Link
                                    href={`/user/${getOtherId(activeConvo)}`}
                                    style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', flex: 1, gap: '10px' }}
                                >
                                    <div className={styles.chatHeaderAvatar}>
                                        {getOtherName(activeConvo).charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.chatHeaderInfo}>
                                        <span className={styles.chatHeaderName}>{getOtherName(activeConvo)}</span>
                                        <span className={styles.chatHeaderSub}>Tap to view profile</span>
                                    </div>
                                </Link>
                                <button className={styles.shareContactBtn} onClick={handleShareContact} title="Share your contact">
                                    📇
                                </button>
                            </div>

                            {/* Messages */}
                            <div className={styles.messageList}>
                                <div className={styles.encryptionNotice}>
                                    🔒 Messages are secured and private. Only you and {getOtherName(activeConvo)} can see them.
                                </div>

                                {messages.map(msg => (
                                    <div key={msg.id} className={`${styles.msgBubble} ${msg.senderId === user.uid ? styles.sent : styles.received}`}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            {msg.type === "contact_share" ? (
                                                <div className={styles.contactCard}>
                                                    <span>📇</span>
                                                    <span>{msg.text.replace("📇 Contact Shared: ", "")}</span>
                                                </div>
                                            ) : (
                                                <p>{msg.text}</p>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: msg.senderId === user.uid ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                <span className={styles.msgTime} style={{ marginTop: 0 }}>{timeAgo(msg.createdAt)}</span>
                                                {msg.senderId === user.uid && (
                                                    <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0 }} title="Unsend">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <form className={styles.msgInput} onSubmit={handleSend}>
                                <input
                                    type="text"
                                    placeholder="Message..."
                                    value={newMsg}
                                    onChange={e => setNewMsg(e.target.value)}
                                    className={styles.msgTextField}
                                />
                                <button type="submit" disabled={sending || !newMsg.trim()} className={styles.sendBtn} title="Send">
                                    {sending ? "..." : (
                                        <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" version="1.1" x="0px" y="0px" enableBackground="new 0 0 24 24"><path fill="currentColor" d="M1.101,21.757L23.8,12.028L1.101,2.3l0.011,7.912l13.623,1.816L1.112,13.845 L1.101,21.757z"></path></svg>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
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

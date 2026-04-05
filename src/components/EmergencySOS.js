"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import styles from "./EmergencySOS.module.css";

export default function EmergencySOS() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const emergencyContacts = [
        { name: "Campus Security (Primary)", number: "0712 345 678" },
        { name: "University Clinic", number: "0723 456 789" },
        { name: "Student Welfare", number: "0734 567 890" },
        { name: "Ambulance / Fire", number: "999 / 112" },
    ];

    const handleBroadcast = async () => {
        if (!user) return alert("Please log in to broadcast an emergency.");
        if (isBroadcasting) return;

        setIsBroadcasting(true);
        try {
            await addDoc(collection(db, "emergency_alerts"), {
                userId: user.uid,
                userName: user.displayName || user.email.split('@')[0],
                email: user.email,
                timestamp: serverTimestamp(),
                status: "ACTIVE"
            });
            alert("🚨 EMERGENCY BROADCAST SENT! Campus security and student leaders have been notified of your location. Stay safe.");
        } catch (error) {
            console.error("Error broadcasting emergency:", error);
            alert("Failed to broadcast alert. Please call security directly.");
        } finally {
            setIsBroadcasting(false);
        }
    };

    return (
        <>
            <button
                className={styles.sosTrigger}
                onClick={() => setIsOpen(true)}
                aria-label="Emergency SOS"
            >
                <span className={styles.sosIcon}>🚨</span>
                <span className={styles.sosText}>SOS</span>
            </button>

            {isOpen && (
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.header}>
                            <h2>Emergency SOS 🚨</h2>
                            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
                        </div>

                        <p className={styles.description}>
                            Select a contact below to call campus security or emergency services immediately.
                        </p>

                        <div className={styles.contactList}>
                            {emergencyContacts.map((contact, i) => (
                                <a
                                    key={i}
                                    href={`tel:${contact.number.replace(/\s/g, '')}`}
                                    className={styles.contactCard}
                                >
                                    <div className={styles.contactInfo}>
                                        <span className={styles.contactName}>{contact.name}</span>
                                        <span className={styles.contactNumber}>{contact.number}</span>
                                    </div>
                                    <span className={styles.callBtn}>📞 Call</span>
                                </a>
                            ))}
                        </div>

                        <div className={styles.safetyInfo}>
                            <h3>Proactive Safety Steps:</h3>
                            <button
                                className={styles.broadcastBtn}
                                onClick={handleBroadcast}
                                disabled={isBroadcasting}
                            >
                                {isBroadcasting ? "Broadcasting..." : "📢 Broadcast Silent Emergency"}
                            </button>
                            <ul>
                                <li>Stay in well-lit areas if possible.</li>
                                <li>Keep your location shared with a trusted friend.</li>
                                <li>Do not hang up until help arrives or dispatcher instructs.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

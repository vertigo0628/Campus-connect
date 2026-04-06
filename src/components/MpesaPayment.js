"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import styles from "./MpesaPayment.module.css";

export default function MpesaPayment({ targetUserId, targetUserName }) {
    const { user } = useAuth();
    const [status, setStatus] = useState("idle"); // idle, processing, success, fail
    const [phoneNumber, setPhoneNumber] = useState("");
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, "profiles", user.uid), (snap) => {
            if (snap.exists()) setProfile(snap.data());
        });
        return () => unsub();
    }, [user]);

    const handlePayment = (e) => {
        e.preventDefault();
        if (!phoneNumber) return;

        setStatus("processing");
        // Simulate STK Push delay
        setTimeout(async () => {
            try {
                // Log Transaction to Firestore
                await addDoc(collection(db, "transactions"), {
                    senderId: user?.uid || "anonymous",
                    senderName: profile?.displayName || user?.displayName || "Anonymous Comrade",
                    targetId: targetUserId,
                    targetName: targetUserName,
                    amount: "Ksh 10.00", // Standard Hiring Fee for Demo
                    phoneNumber,
                    timestamp: serverTimestamp(),
                    status: "COMPLETED"
                });

                setStatus("success");
                setTimeout(() => setStatus("idle"), 5000);
            } catch (error) {
                console.error("Error logging transaction:", error);
                setStatus("fail");
            }
        }, 3000);
    };

    return (
        <div className={styles.container}>
            {status === "idle" ? (
                <button
                    className={styles.hireBtn}
                    onClick={() => setStatus("input")}
                >
                    Hire with M-Pesa 💸
                </button>
            ) : status === "input" ? (
                <div className={styles.modal}>
                    <h4>Pay Comrade {targetUserName}</h4>
                    <p>Enter your M-Pesa number for STK Push</p>
                    <form onSubmit={handlePayment}>
                        <input
                            type="tel"
                            placeholder="07XX XXX XXX"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                        />
                        <div className={styles.btnGroup}>
                            <button type="button" onClick={() => setStatus("idle")} className={styles.cancelBtn}>Cancel</button>
                            <button type="submit" className={styles.confirmBtn}>Send STK Push</button>
                        </div>
                    </form>
                </div>
            ) : status === "processing" ? (
                <div className={styles.processing}>
                    <div className={styles.spinner}></div>
                    <p>Waiting for PIN on phone...</p>
                </div>
            ) : (
                <div className={styles.success}>
                    <span>✅</span>
                    <p>Payment Successful! Comrade Notified.</p>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import styles from "./hostels.module.css";

export default function HostelsPage() {
    const { user } = useAuth();
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        location: "",
        price: "",
        amenities: "",
        contact: "",
        image: null
    });

    useEffect(() => {
        const q = query(collection(db, "hostels"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHostels(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setFormData({ ...formData, image: e.target.files[0] });
        }
    };

    const handleCreateHostel = async (e) => {
        e.preventDefault();
        if (!user || !formData.image) return;

        setUploading(true);
        try {
            // Upload Image to Supabase
            const fileName = `${Date.now()}-${formData.image.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("showcase")
                .upload(`hostels/${fileName}`, formData.image, {
                    contentType: formData.image.type || 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("showcase")
                .getPublicUrl(`hostels/${fileName}`);

            // Save to Firestore
            await addDoc(collection(db, "hostels"), {
                name: formData.name,
                location: formData.location,
                price: formData.price,
                amenities: formData.amenities.split(",").map(a => a.trim()),
                contact: formData.contact,
                image: publicUrl,
                creatorId: user.uid,
                createdAt: serverTimestamp()
            });

            setFormData({ name: "", location: "", price: "", amenities: "", contact: "", image: null });
            setShowModal(false);
        } catch (error) {
            console.error("Error listing hostel:", error);
            alert("Failed to list hostel. Try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className={styles.container}>
            <Navigation />
            <div className={styles.content}>
                {/* Hub Navigation */}
                <div className={styles.stickyHubHeader}>
                    <div className={styles.hubNav}>
                        <Link href="/discover" className={styles.hubNavBtn}>Comrades</Link>
                        <Link href="/study-groups" className={styles.hubNavBtn}>Study Groups</Link>
                        <Link href="/hostels" className={`${styles.hubNavBtn} ${styles.hubNavBtnActive}`}>Hostels</Link>
                    </div>
                </div>

                <header className={styles.header}>
                    <h1>Hostel Finder 🏠</h1>
                    <p>Verified student-friendly housing near campus.</p>
                    <button className={styles.listBtn} onClick={() => setShowModal(true)}>
                        + List a Hostel
                    </button>
                </header>

                <div className={styles.grid}>
                    {loading ? (
                        <div className={styles.loader}>Scanning Hostels...</div>
                    ) : hostels.length === 0 ? (
                        <div className={styles.emptyState}>
                            <h3>No Hostels Found 🏠</h3>
                            <p>Be the first comrade to list a hostel near your gate!</p>
                        </div>
                    ) : (
                        hostels.map((hostel) => (
                            <div key={hostel.id} className={styles.card}>
                                <div className={styles.imageContainer}>
                                    <img src={hostel.image || "/placeholder-hostel.jpg"} alt={hostel.name} />
                                    <div className={styles.priceTag}>Ksh {hostel.price}/mo</div>
                                </div>
                                <div className={styles.cardContent}>
                                    <h3 className={styles.hostelName}>{hostel.name}</h3>
                                    <p className={styles.location}>📍 {hostel.location}</p>
                                    <div className={styles.amenities}>
                                        {hostel.amenities?.map(a => <span key={a} className={styles.badge}>{a}</span>)}
                                    </div>
                                    <button
                                        className={styles.viewBtn}
                                        onClick={() => {
                                            let num = hostel.contact?.replace(/\D/g, '') || "";
                                            if (num.startsWith('0')) num = '254' + num.slice(1);
                                            else if (num.length === 9) num = '254' + num;
                                            window.open(`https://wa.me/${num}`, '_blank');
                                        }}
                                    >
                                        WhatsApp Lead 💬
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>List your Hostel 🏠</h2>
                        <form onSubmit={handleCreateHostel}>
                            <input
                                type="text"
                                placeholder="Hostel Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <select
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                required
                            >
                                <option value="">Select Location</option>
                                <option value="MUST Gate A">MUST Gate A</option>
                                <option value="MUST Gate B">MUST Gate B</option>
                                <option value="MUST Gate C">MUST Gate C</option>
                                <option value="Juja Town">Juja Town</option>
                                <option value="Main Stage">Main Stage</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Monthly Price (e.g. Ksh 4,500)"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Amenities (comma separated: Wifi, Water, Security)"
                                value={formData.amenities}
                                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="WhatsApp (e.g. 0712345678)"
                                value={formData.contact}
                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                required
                            />
                            <div className={styles.fileInput}>
                                <label>Hostel Photo</label>
                                <input type="file" accept="image/*" onChange={handleImageChange} required />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" className={styles.submitBtn} disabled={uploading}>
                                    {uploading ? "Listing..." : "List Hostel"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

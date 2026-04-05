"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import LogoutModal from "@/components/LogoutModal";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const features = [
    { icon: "🛡️", title: "Verified Trust", desc: "Strict university email authentication for a safe, high-trust campus network." },
    { icon: "💼", title: "Comrade Services", desc: "Find peer-to-peer services — from tech help to creative gigs and tutoring." },
    { icon: "🏠", title: "Hostel Finder", desc: "Browse verified student housing with prices, photos, and real reviews." },
    { icon: "📚", title: "Study Circles", desc: "Join or create study groups matched by unit, topic, and schedule." },
    { icon: "💬", title: "Private DMs", desc: "Secure real-time messaging with contact sharing for trusted exchanges." },
    { icon: "🚨", title: "Emergency SOS", desc: "One-tap campus safety alerts with location broadcast to nearby comrades." },
  ];

  return (
    <div className={styles.wrapper}>
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => { logout(); setIsLogoutModalOpen(false); }}
      />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            Built for Kenyan University Students
          </div>

          <h1 className={styles.heroTitle}>
            Your Campus.
            <br />
            <span className={styles.heroGradient}>Your Network.</span>
          </h1>

          <p className={styles.heroSub}>
            The ultimate digital layer for your university experience. Connect with
            comrades, trade services, find hostels, and stay safe — all in one
            student-led network.
          </p>

          <div className={styles.heroCtas}>
            {user ? (
              <>
                <Link href="/sema" className={styles.btnPrimary}>
                  Open Feed
                </Link>
                <Link href="/profile" className={styles.btnGhost}>
                  My Profile
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup" className={styles.btnPrimary}>
                  Get Started — It&apos;s Free
                </Link>
                <Link href="/login" className={styles.btnGhost}>
                  Log In
                </Link>
              </>
            )}
          </div>

          <p className={styles.heroProof}>
            Join <strong>500+</strong> comrades at MUST 🇰🇪
          </p>
        </div>
      </section>

      {/* Quick Hubs (logged in) */}
      {user && (
        <section className={styles.hubsSection}>
          <div className={styles.hubsGrid}>
            <Link href="/sema" className={styles.hubCard}>
              <span className={styles.hubEmoji}>📸</span>
              <div>
                <h4 className={styles.hubTitle}>Feed</h4>
                <p className={styles.hubSub}>Campus pulse</p>
              </div>
            </Link>
            <Link href="/discover" className={styles.hubCard}>
              <span className={styles.hubEmoji}>🔍</span>
              <div>
                <h4 className={styles.hubTitle}>Discover</h4>
                <p className={styles.hubSub}>Find comrades</p>
              </div>
            </Link>
            <Link href="/hostels" className={styles.hubCard}>
              <span className={styles.hubEmoji}>🏠</span>
              <div>
                <h4 className={styles.hubTitle}>Hostels</h4>
                <p className={styles.hubSub}>Home finder</p>
              </div>
            </Link>
            <Link href="/study-groups" className={styles.hubCard}>
              <span className={styles.hubEmoji}>📚</span>
              <div>
                <h4 className={styles.hubTitle}>Study</h4>
                <p className={styles.hubSub}>Group circles</p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Features */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>Built Different.</h2>
        <p className={styles.sectionSub}>Everything a Kenyan university student needs — in one app.</p>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureCard} style={{ animationDelay: `${i * 0.1}s` }}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© 2026 Campus Connect Kenya</span>
          <span className={styles.footerDot}>·</span>
          <span>Made with <span style={{ color: "#ff6b6b" }}>♥</span> for the Comrades</span>
        </div>
      </footer>
    </div>
  );
}

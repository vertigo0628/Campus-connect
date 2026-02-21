"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const router = useRouter();
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Automatic redirect for logged-in users
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        router.push("/profile");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  const goToDashboard = () => {
    router.push("/profile");
    setIsMenuOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      {/* Ambient background orbs */}
      <div className={styles.ambientOrb} />
      <div className={styles.ambientOrb} />
      <div className={styles.ambientOrb} />

      {/* Navigation */}
      <nav className={`${styles.nav} ${isMenuOpen ? styles.navActive : ""}`}>
        <div className={styles.navBrand}>
          <Logo size={36} />
          <div className={styles.navBrandText}>
            <span className={styles.navTitle}>Campus Connect</span>
            <span className={styles.navSubtitle}>Kenya</span>
          </div>
        </div>

        {/* Hamburger Menu Button */}
        <button
          className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerActive : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          <span className={styles.hamburgerBar}></span>
          <span className={styles.hamburgerBar}></span>
          <span className={styles.hamburgerBar}></span>
        </button>

        <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ""}`}>

          {user ? (
            <div className={styles.userProfile}>
              <button className={styles.navLink} onClick={goToDashboard}>Dashboard</button>
              <Link href="/profile">
                <img src={user.photoURL || "https://ui-avatars.com/api/?name=" + user.displayName} alt={user.displayName} className={styles.userAvatar} />
              </Link>
              <button className={styles.navCta} onClick={logout}>Logout</button>
            </div>
          ) : (
            <Link href="/signup" className={styles.navCta} onClick={() => setIsMenuOpen(false)}>Get Started</Link>
          )}

        </div>
      </nav>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logoContainer}>
            <Logo size={90} />
          </div>

          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Built for Kenyan University Students
          </div>

          <h1 className={styles.heroTitle}>
            Your Campus {" "}
            <span className={styles.heroTitleGradient}>Your Network.</span>
          </h1>

          <p className={styles.heroDescription}>
            One platform for everything campus — trade textbooks, find hostels,
            join study groups, access M-Pesa payments, and stay safe with
            emergency SOS. Built by students, for students.
          </p>

          <div className={styles.heroCtas}>
            {user ? (
              <span className={styles.welcomeText}>Welcome back, {user.displayName}!</span>
            ) : (
              <>
                <Link href="/signup" className={styles.btnPrimary}>Get Started Today</Link>
                <button className={styles.btnSecondary}>Learn More</button>
              </>
            )}
          </div>
        </div>
      </main>



      {/* Footer */}
      <footer className={styles.footer}>
        © 2026 Campus Connect Kenya — Made with{" "}
        <span className={styles.footerHeart}>♥</span> for the Comrades.
      </footer>
    </div>
  );
}

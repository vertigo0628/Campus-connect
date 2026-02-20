"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signInWithGoogle, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
          <a href="#features" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Features</a>
          <a href="#about" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>About</a>

          {user ? (
            <div className={styles.userProfile}>
              <img src={user.photoURL} alt={user.displayName} className={styles.userAvatar} />
              <button className={styles.navCta} onClick={logout}>Logout</button>
            </div>
          ) : (
            <button className={styles.navCta} onClick={signInWithGoogle}>Get Started</button>
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
            One platform for everything in campus — trade textbooks, find hostels,
            join study groups, access M-Pesa payments, and stay safe with
            emergency SOS. Built by students, for students.
          </p>

          <div className={styles.heroCtas}>
            {user ? (
              <span className={styles.welcomeText}>Welcome back, {user.displayName}!</span>
            ) : (
              <>
                <button className={styles.btnPrimary} onClick={signInWithGoogle}>Join the Waitlist</button>
                <button className={styles.btnSecondary}>Learn More</button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Feature Highlights */}
      <section id="features" className={styles.features}>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>🛒</span>
          <h3 className={styles.featureTitle}>Comrade Market</h3>
          <p className={styles.featureDesc}>
            Buy & sell textbooks, find hostels, and discover student services.
          </p>
        </div>

        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>📚</span>
          <h3 className={styles.featureTitle}>Academic Hub</h3>
          <p className={styles.featureDesc}>
            Share past papers, find study groups, and connect with tutors.
          </p>
        </div>

        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>🛡️</span>
          <h3 className={styles.featureTitle}>Safety First</h3>
          <p className={styles.featureDesc}>
            One-tap Emergency SOS, anonymous reporting, and wellness support.
          </p>
        </div>

        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>🎉</span>
          <h3 className={styles.featureTitle}>Campus Life</h3>
          <p className={styles.featureDesc}>
            Events, lost & found, campus maps, and exclusive student deals.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={styles.about}>
        <h2 className={styles.sectionTitle}>Meet the Team</h2>
        <p className={styles.sectionSubtitle}>
          We are a group of 9 dedicated students working to build the ultimate
          digital ecosystem for Kenyan universities.
        </p>

        <div className={styles.teamGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((member) => (
            <div key={member} className={styles.teamMember}>
              <div className={styles.memberAvatar}>👤</div>
              <h4 className={styles.memberName}>Team Member {member}</h4>
              <p className={styles.memberRole}>Developer / Designer</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        © 2026 Campus Connect Kenya — Made with{" "}
        <span className={styles.footerHeart}>♥</span> for the Comrades.
      </footer>
    </div>
  );
}

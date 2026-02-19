import styles from "./page.module.css";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className={styles.wrapper}>
      {/* Ambient background orbs */}
      <div className={styles.ambientOrb} />
      <div className={styles.ambientOrb} />
      <div className={styles.ambientOrb} />

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <Logo size={36} />
          <div className={styles.navBrandText}>
            <span className={styles.navTitle}>Campus Connect</span>
            <span className={styles.navSubtitle}>Kenya</span>
          </div>
        </div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#about" className={styles.navLink}>About</a>
          <button className={styles.navCta}>Get Started</button>
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
            Your Campus,{" "}
            <span className={styles.heroTitleGradient}>Fully Connected.</span>
          </h1>

          <p className={styles.heroDescription}>
            One platform for everything campus — trade textbooks, find hostels,
            join study groups, access M-Pesa payments, and stay safe with
            emergency SOS. Built by students, for students.
          </p>

          <div className={styles.heroCtas}>
            <button className={styles.btnPrimary}>Join the Waitlist</button>
            <button className={styles.btnSecondary}>Learn More</button>
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

      {/* Footer */}
      <footer className={styles.footer}>
        © 2026 Campus Connect Kenya — Made with{" "}
        <span className={styles.footerHeart}>♥</span> for the Comrades.
      </footer>
    </div>
  );
}

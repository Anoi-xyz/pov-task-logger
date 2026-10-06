import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={`${styles.eyebrow} ${styles.mono}`}>
        <div className={styles.ring}></div>
        FIRST-PERSON TASK LOGGING — DEMO
      </div>

      <h1 className={styles.title}>
        Every step,<br />recorded as it happens.
      </h1>

      <p className={styles.subtitle}>
        A small tool for logging everyday tasks POV-style — record a session,
        check off steps as you go, watch the sequence build in real time.
      </p>

      <div className={styles.stage}>
        <div className={styles.recBadge}>
          <div className={styles.dot}></div>REC
        </div>
        <div className={styles.orb}></div>
        <div className={`${styles.stageLabel} ${styles.mono}`}>POV FEED — LIVE SESSION</div>
      </div>

      <div className={styles.cta}>
        <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/">
          Launch the app
        </Link>
        <a
          className={`${styles.btn} ${styles.btnGhost}`}
          href="https://github.com/Anoi-xyz/pov-task-logger"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source
        </a>
      </div>

      <div className={styles.divider}></div>

      <footer className={styles.footer}>
        <div className={styles.zeno}>
          Inspired by <span className={styles.zenoMark}>ZenO</span> — building real-world data for physical AI
        </div>
        <div className={styles.credit}>
          built by <a href="https://x.com/anoi_exe" target="_blank" rel="noopener noreferrer">@anoi_exe</a> for ZenO
        </div>
      </footer>
    </div>
  );
}

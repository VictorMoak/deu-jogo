import styles from './BackButton.module.css'

export function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className={styles.backButton}>
      <span className={styles.backIcon}>←</span>
      <span className={styles.backText}>Voltar</span>
    </button>
  )
}

